import React, { useState, useRef, useCallback, useEffect } from 'react';
import { WS_URL } from '../utils/constants';

const WEBSOCKET_URL = WS_URL; // Replace with your backend WebSocket URL
const CHUNK_SIZE = 1024 * 16;

function VibeAudioStreamer() {
    const [audioFile, setAudioFile] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);

    const websocketRef = useRef(null);
    const fileReaderRef = useRef(null);
    const offsetRef = useRef(0);
    const fileInputRef = useRef(null); // Ref for the file input

    const addMessage = useCallback((message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
    }, []);

    const disconnectWebSocket = useCallback(() => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            console.log('Closing WebSocket connection.');
            websocketRef.current.close();
        }
        websocketRef.current = null;
        setIsStreaming(false);
        offsetRef.current = 0;
        if (fileReaderRef.current) {
            // In case of abrupt stop, clean up reader
            fileReaderRef.current.onload = null;
            fileReaderRef.current.onerror = null;
            fileReaderRef.current = null;
        }
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('audio/')) {
            setAudioFile(file);
            setError(null);
            setMessages([]); // Clear messages for new file
            if (isStreaming) {
                disconnectWebSocket(); // Stop existing stream if a new file is uploaded
            }
        } else {
            setAudioFile(null);
            setError('Please select a valid audio file.');
        }
        // Reset file input value so selecting the same file again triggers onChange
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const readAndSendChunk = useCallback(() => {
        if (!audioFile || !websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
            console.log('Conditions not met for sending chunk. Stopping.');
            disconnectWebSocket();
            return;
        }

        if (offsetRef.current >= audioFile.size) {
            console.log('Audio file fully streamed.');
            // Optional: Send an end-of-stream marker if your backend expects it
            // websocketRef.current.send(JSON.stringify({ type: 'eos' }));
            disconnectWebSocket();
            return;
        }

        if (!fileReaderRef.current) {
            fileReaderRef.current = new FileReader();
        }
        const reader = fileReaderRef.current;
        const currentOffset = offsetRef.current;
        const slice = audioFile.slice(currentOffset, currentOffset + CHUNK_SIZE);

        reader.onload = (e) => {
            if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
                try {
                    websocketRef.current.send(e.target.result); // Send binary data
                    offsetRef.current += e.target.result.byteLength;
                    // Schedule next chunk read - using setTimeout to prevent blocking UI thread too much
                    setTimeout(readAndSendChunk, 0);
                } catch (sendError) {
                    console.error('WebSocket send error:', sendError);
                    setError(`WebSocket send error: ${sendError.message}`);
                    disconnectWebSocket();
                }
            } else {
                console.log("WebSocket closed before chunk could be sent.");
                disconnectWebSocket(); // Ensure cleanup if WS closed unexpectedly
            }
        };

        reader.onerror = (e) => {
            console.error('FileReader error:', e);
            setError(`FileReader error: ${reader.error}`);
            disconnectWebSocket();
        };

        reader.readAsArrayBuffer(slice); // Read chunk as ArrayBuffer for binary sending

    }, [audioFile, disconnectWebSocket]);


    const startStreaming = useCallback(() => {
        if (!audioFile) {
            setError('No audio file selected.');
            return;
        }
        if (isStreaming) {
            console.log('Already streaming.');
            return;
        }

        setError(null);
        setMessages([]); // Clear previous messages
        offsetRef.current = 0; // Reset offset for new stream

        console.log(`Attempting to connect to ${WEBSOCKET_URL}`);
        websocketRef.current = new WebSocket(WEBSOCKET_URL);
        setIsStreaming(true); // Set streaming true optimistically

        websocketRef.current.onopen = () => {
            console.log('WebSocket connection established.');
            addMessage('Backend connected.');
            // Start sending the first chunk once connection is open
            readAndSendChunk();
        };

        websocketRef.current.onmessage = (event) => {
            // Assuming backend sends text messages
            console.log('Message from server:', event.data);
            addMessage(`Server: ${event.data}`);
        };

        websocketRef.current.onerror = (event) => {
            console.error('WebSocket error:', event);
            setError('WebSocket connection error. Check console.');
            // disconnectWebSocket will be called by onclose usually, but call here for safety
            disconnectWebSocket();
        };

        websocketRef.current.onclose = (event) => {
            console.log('WebSocket connection closed.', event.code, event.reason);
            if (offsetRef.current < (audioFile?.size || 0)) {
                // Closed before finishing only if it wasn't a clean disconnect
                if (event.code !== 1000 && event.code !== 1005) { // 1000 = Normal Closure, 1005 = No Status Recvd
                    addMessage(`Backend disconnected unexpectedly (Code: ${event.code}).`);
                    setError(`WebSocket closed unexpectedly (Code: ${event.code})`);
                } else {
                    addMessage('Backend disconnected.');
                }
            } else {
                addMessage('Backend disconnected (streaming finished).');
            }
            // Ensure state reflects disconnection
            setIsStreaming(false);
            websocketRef.current = null;
            offsetRef.current = 0;
            if (fileReaderRef.current) {
                fileReaderRef.current.onload = null;
                fileReaderRef.current.onerror = null;
                fileReaderRef.current = null;
            }
        };

    }, [audioFile, isStreaming, addMessage, readAndSendChunk, disconnectWebSocket]);


    const handleStreamToggle = () => {
        if (isStreaming) {
            // Stop streaming
            disconnectWebSocket();
        } else {
            // Start streaming
            startStreaming();
        }
    };

    // Cleanup WebSocket connection on component unmount
    useEffect(() => {
        return () => {
            disconnectWebSocket();
        };
    }, [disconnectWebSocket]);

    return (
        <div className='flex flex-col'>
            <h2 className='flex justify-center my-5'>Audio Streaming via WebSocket</h2>
            <div className='flex align-middle space-x-2 justify-center mb-2'>
                <p className='font-semibold'>Connection status:</p>
                <p className={websocketRef.current ? 'text-green-400 font-semibold' : 'text-red-500 font-semibold'}>{websocketRef.current ? 'Connected to Backend' : "Disconnected from Backend"}</p>
            </div>
            <div className='flex items-center justify-center space-x-4'>
                <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }} // Hide default input
                    id="audioFileInput"
                />
                <button className='border-2 border-green-500 bg-green-500 p-2 rounded-2xl text-gray-100 hover:cursor-pointer hover:text-black' onClick={() => fileInputRef.current && fileInputRef.current.click()} >
                    Upload Audio File
                </button>

                {audioFile && (
                    <p style={{ margin: '10px 0' }}>Selected file: {audioFile.name}</p>
                )}

                <button
                    onClick={handleStreamToggle}
                    disabled={!audioFile}
                    className='border-2 border-cyan-300 bg-cyan-300 rounded-2xl text-gray-500 p-2 hover:cursor-pointer hover:text-gray-800'
                >
                    {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
                </button>
            </div>
            {error && <p style={{ color: 'red', marginTop: '10px' }}>Error: {error}</p>}
            <div className='mx-15 flex flex-col w-1/3'>
                <h3 className='mt-10'>WebSocket Messages:</h3>
                <textarea
                    rows="10"
                    cols="60"
                    value={messages.join('\n')}
                    readOnly
                    placeholder="Debug messages from backend will appear here..."
                    // style={{ display: 'block', marginTop: '5px', fontFamily: 'monospace' }}
                    className='block border-1 font-mono mt-5 p-2'
                />
            </div>
        </div>
    );
}

export default VibeAudioStreamer;
