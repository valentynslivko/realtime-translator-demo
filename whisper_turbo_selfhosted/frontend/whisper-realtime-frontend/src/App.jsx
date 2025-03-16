import React, { useState, useRef, useEffect } from "react";

const WS_URL = "ws://0.0.0.0:8001/ws";

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState("");
  const mediaRecorder = useRef(null);
  const socket = useRef(new WebSocket(WS_URL));

  useEffect(() => {
    socket.current.onmessage = (event) => {
      setMessages((prev) => prev + "\n" + event.data);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.current.readyState === WebSocket.OPEN) {
          socket.current.send(event.data);
        }
      };

      mediaRecorder.current.start(500); // Collect data in 500ms chunks
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone: ", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
      <textarea
        className="w-96 h-40 p-2 border rounded"
        value={messages}
        readOnly
        placeholder="Messages from server..."
      />
    </div>
  );
};

export default VoiceRecorder;