import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
function PrerecordedDemoUpload() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [fpReturned, setFpReturned] = useState(null)
    const [isLoading, setIsLoading] = useState(false);
    const [isAudioReady, setAudioReady] = useState(null)

    const fileInputRef = useRef(null); // To programmatically click the hidden file input

    const BASE_URL = 'http://0.0.0.0:8000'
    const API_ENDPOINT_UPLOAD = '/process'


    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    };

    useEffect(() => {
        if (!fpReturned) return

        const checkAudioAvailability = async () => {
            try {
                const response = await fetch(`files/${fpReturned}`, { method: 'HEAD' })
                if (response.ok) {
                    setAudioReady(true)
                } else {
                    // Retry after 1 second
                    setTimeout(checkAudioAvailability, 3000)
                }
            } catch (error) {
                // Retry after 1 second on network errors
                setTimeout(checkAudioAvailability, 3000)
            }
        }

        checkAudioAvailability()
    }, [fpReturned])

    const handleUpload = async () => {
        if (!selectedFile) {
            // addLog("Error: No file selected for upload.");
            alert("Please select a file first!");
            return;
        }

        setIsLoading(true);
        // addLog(`Attempting to upload ${selectedFile.name} to ${API_ENDPOINT_UPLOAD}...`);

        const formData = new FormData();
        // The key 'file' here MUST match the parameter name in your FastAPI endpoint
        // e.g., async def create_upload_file(file: UploadFile):
        formData.append('file', selectedFile);

        try {
            // addLog("Sending POST request...");
            const response = await fetch(BASE_URL + API_ENDPOINT_UPLOAD, {
                method: 'POST',
                body: formData,
                // Headers:
                // For FormData, 'Content-Type': 'multipart/form-data' is usually set automatically by the browser.
                // Do NOT set it manually, as it needs a boundary parameter that the browser generates.
            });

            // addLog(`Received response with status: ${response.status}`);
            const responseData = await response.json(); // Assuming FastAPI returns JSON
            console.log('responseData: ', responseData.fp)
            if (response.ok) {
                // addLog(`Upload successful! Server response: ${JSON.stringify(responseData)}`);
                alert(`File ${selectedFile.name} uploaded successfully!`);
                setFpReturned(responseData.fp)
            } else {
                // addLog(`Upload failed. Status: ${response.status}. Server details: ${JSON.stringify(responseData.detail || responseData)}`);
                alert(`Upload failed: ${responseData.detail || response.statusText}`);
            }
        } catch (error) {
            // addLog(`Network or other error during upload: ${error.message}`);
            console.error("Upload error:", error);
            alert(`An error occurred: ${error.message}`);
        } finally {
            setIsLoading(false);
            // addLog("Upload process finished.");
            // Optionally reset the file input to allow re-uploading the same file
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setSelectedFile(null); // Clear selected file after attempt
        }
    };
    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (
        <div className='flex flex-col items-center align-middle mt-2'>
            <Link to='/' className='border border-amber-500 rounded-xl py-1 px-4 bg-amber-500 hover:text-gray-600 hover:cursor-pointer'>Home</Link>
            <h2 className='my-2'>File Upload with Debug Logs</h2>
            <div className='flex flex-col space-y-2'>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className='hidden'
                // Optional: specify accepted file types
                // accept=".jpg, .jpeg, .png, .pdf, .txt"
                />

                <button
                    onClick={triggerFileInput}
                    disabled={isLoading}
                    className='border border-cyan-400 bg-cyan-500 p-2 rounded-xl text-white hover:bg-blue-500 hover:cursor-pointer'
                >
                    {selectedFile ? `Change File: ${selectedFile.name.substring(0, 20)}...` : 'Choose File'}
                </button>

                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isLoading}
                    className='border border-green-400 bg-green-400 p-2 rounded-xl text-gray-800 hover:cursor-pointer hover:text-white'
                >
                    {isLoading ? 'Uploading...' : 'Upload to Backend'}
                </button>
            </div>
            {selectedFile && !isLoading && (
                <p >
                    Ready to upload: <strong>{selectedFile.name}</strong>
                </p>
            )}

            {fpReturned && (
                <div className='mt-16 flex flex-col items-center space-y-2'>
                    <p>Processed audio: </p>
                    {isAudioReady ? (
                        <audio controls>
                            <source src={`files/${fpReturned}`} type="audio/mpeg" />
                            Your browser does not support the audio element.
                        </audio>
                    ) : (
                        <p>Loading audio...</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default PrerecordedDemoUpload;