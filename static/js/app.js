// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize variables for recording
    let mediaRecorder;              // Will hold the recorder instance
    let audioChunks = [];          // Array to store audio chunks
    let isRecording = false;       // Track recording state
    const recordButton = document.getElementById('recordButton');      // Get button element
    const microphoneImg = recordButton.querySelector('.microphone');  // Get mic icon
    console.log("init vars initalized");

    // Add click handler to record button
    recordButton.addEventListener('click', async () => {
        if(!isRecording){
            // Start Recording
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 44100,
                    sampleSize: 16,
                    volume: 1.0
                }
            });
            
            // Use specific MIME type
            const options = { mimeType: 'audio/webm' };  // More widely supported than MP3
            mediaRecorder = new MediaRecorder(stream, options);
            audioChunks = [];  // Reset chunks array
            
            // Handler for when audio data is available
            mediaRecorder.ondataavailable = (e) => {
                console.log('Got chunk:', e.data.size, 'bytes');
                audioChunks.push(e.data);  // Save audio chunk
            };
            
            mediaRecorder.start(1000);  // Start recording, get chunks every 1 second
            isRecording = true;
            recordButton.classList.add('recording');  // Visual feedback
            microphoneImg.style.filter = 'brightness(0.5)';  // Dim mic icon
        } else {
            // Stop Recording
            mediaRecorder.stop();
            isRecording = false;
            recordButton.classList.remove('recording');  // Remove visual feedback
            microphoneImg.style.filter = '';  // Reset mic icon

            // Handler for when recording stops
            mediaRecorder.onstop = () => {
                // Create blob from recorded chunks
                const audioBlob = new Blob(audioChunks, { 
                    type: 'audio/webm'  // Match the MediaRecorder MIME type
                });
                const formData = new FormData();  // Create form data for file upload
                formData.append('audio', audioBlob, 'recording.mp3');
                
                // First request: Upload audio file to server
                fetch('/upload', {
                    method: 'POST',
                    body: formData  // Send form data with audio file
                })
                .then(response => response.json())  // Parse JSON response
                .then(data => {
                    if (data.success) {
                        console.log('File uploaded successfully:', data.filename);
                        
                        // Second request: Send filename for transcription
                        fetch('/transcribe', {
                            method: 'POST',
                            headers:{
                                'Content-Type': 'application/json'  // Tell server we're sending JSON
                            },
                            body: JSON.stringify({  // Convert data to JSON string
                                filename: data.filename  // Send filename from upload response
                            }) 
                        })
                        .then(response => response.json())  // Convert transcription response to JSON
                        .then(data => {
                            console.log('Transcription:', data.transcription);  // Log the transcribed text
                        })
                        .catch(error => {
                            console.error('Error transcribing file:', error);  // Handle transcription errors
                        });
                    } else {
                        console.error('Upload failed:', data.error);  // Handle upload failure
                    }
                })
                .catch(error => {
                    console.error('Error uploading file:', error);  // Handle upload errors
                });
            };  // End of onstop handler
        }  // End of else (stop recording) block
    });  // End of click event listener
});  // End of DOMContentLoaded event listener