import React, { useState, useRef, useEffect, useCallback } from 'react';

const WEBSOCKET_URL = 'ws://localhost:8000/ws'; // Replace with your WebSocket server URL
const RECORDING_TIMESLICE_MS = 3000; // Send audio chunks every 3 seconds

const AudioRecorderPlayer = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Click "Start Recording" to begin.');
    const [audioURL, setAudioURL] = useState(''); // URL for the <audio> element

    const mediaRecorderRef = useRef(null);
    const webSocketRef = useRef(null);
    const audioChunksFromSocketRef = useRef([]); // Stores received audio chunks from backend
    const localStreamRef = useRef(null); // To store the local media stream for proper cleanup

    // Effect for WebSocket connection management
    useEffect(() => {
        // Don't connect if already connected or in SSR
        if (typeof window === 'undefined' || webSocketRef.current) return;

        console.log('Attempting to connect to WebSocket...');
        const ws = new WebSocket(WEBSOCKET_URL);
        webSocketRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connection established.');
            setStatusMessage('WebSocket connected. Ready to record.');
        };

        ws.onmessage = (event) => {
            if (event.data instanceof Blob) {
                console.log('Received audio chunk from backend:', event.data);
                audioChunksFromSocketRef.current.push(event.data);
                // Create a new Blob from all received chunks and update the audio player
                const audioBlob = new Blob(audioChunksFromSocketRef.current, { type: 'audio/webm' }); // Adjust MIME type if backend sends something else
                const newAudioURL = URL.createObjectURL(audioBlob);

                // Revoke the old URL before setting the new one to free up resources
                if (audioURL) {
                    URL.revokeObjectURL(audioURL);
                }
                setAudioURL(newAudioURL);
                setStatusMessage('Received processed audio chunk from backend.');
            } else {
                console.log('Received non-Blob message from backend:', event.data);
                // Handle text messages if your backend sends status/transcriptions etc.
                // setStatusMessage(`Backend: ${event.data}`);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setStatusMessage('WebSocket error. Please check the console.');
        };

        ws.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            setStatusMessage(`WebSocket closed. ${event.reason || 'Attempting to reconnect...'}`);
            webSocketRef.current = null;
            // Optional: Implement reconnection logic here
        };

        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                console.log('Closing WebSocket connection.');
                ws.close();
            }
            if (audioURL) {
                URL.revokeObjectURL(audioURL); // Clean up object URL on unmount
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // audioURL is excluded to prevent re-creating WS on audio update


    const startRecording = async () => {
        if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
            setStatusMessage('WebSocket is not connected. Cannot start recording.');
            console.error('WebSocket is not connected.');
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setStatusMessage('getUserMedia not supported on your browser!');
            console.error('getUserMedia not supported.');
            return;
        }

        setStatusMessage('Requesting microphone permission...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream; // Store stream for cleanup
            setStatusMessage('Microphone access granted. Starting recording...');

            // Clear previous audio data
            audioChunksFromSocketRef.current = [];
            if (audioURL) {
                URL.revokeObjectURL(audioURL);
                setAudioURL('');
            }

            // Choose a MIME type. 'audio/webm;codecs=opus' is widely supported and good quality.
            // You might need to adjust this based on what your backend expects or can process.
            const options = { mimeType: 'audio/webm;codecs=opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.warn(`${options.mimeType} is not supported. Trying default.`);
                // Fallback to default or other supported types
                options.mimeType = 'audio/webm'; // A common default
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    setStatusMessage('No suitable audio format supported by MediaRecorder.');
                    console.error('No suitable audio format supported.');
                    return;
                }
            }

            mediaRecorderRef.current = new MediaRecorder(stream, options);

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0 && webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
                    console.log('Sending audio chunk to backend:', event.data);
                    webSocketRef.current.send(event.data);
                }
            };

            mediaRecorderRef.current.onstart = () => {
                setIsRecording(true);
                setStatusMessage('Recording... Press "Stop Recording" to finish.');
            };

            mediaRecorderRef.current.onstop = () => {
                setIsRecording(false);
                setStatusMessage('Recording stopped. Waiting for final processing from backend...');
                // Stop all tracks on the stream
                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(track => track.stop());
                    localStreamRef.current = null;
                }
                // The last chunk might be sent here or via ondataavailable depending on timing.
                // If WebSocket is still open, backend should handle end of stream.
            };

            mediaRecorderRef.current.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                setStatusMessage(`Recording error: ${event.error.name}`);
                setIsRecording(false);
                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(track => track.stop());
                    localStreamRef.current = null;
                }
            };

            mediaRecorderRef.current.start(RECORDING_TIMESLICE_MS); // Collect 1s chunks

        } catch (err) {
            console.error('Error accessing microphone:', err);
            setStatusMessage(`Error accessing microphone: ${err.message}`);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            // onstop handler will set isRecording to false and update status.
        }
    };

    // Cleanup Object URL when component unmounts or audioURL changes and is no longer needed
    useEffect(() => {
        const currentAudioURL = audioURL; // Capture current value for cleanup
        return () => {
            if (currentAudioURL) {
                URL.revokeObjectURL(currentAudioURL);
            }
        };
    }, [audioURL]);

    return (
        <div>
            <h2>Audio Recorder & Player</h2>
            <p>Status: {statusMessage}</p>
            <div>
                {!isRecording ? (
                    <button onClick={startRecording} disabled={!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN}>
                        Start Recording
                    </button>
                ) : (
                    <button onClick={stopRecording}>Stop Recording</button>
                )}
            </div>

            {audioURL && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Processed Audio from Backend:</h3>
                    <audio src={audioURL} controls autoPlay>
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
        </div>
    );
};

export default AudioRecorderPlayer;