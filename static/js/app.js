// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Your code will go here
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    const recordButton = document.getElementById('recordButton');
    const microphoneImg = recordButton.querySelector('.microphone');
    console.log("init vars initalized");
    recordButton.addEventListener('click', async () => {
        if(!isRecording){
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = (e) => {
                console.log('Got chunk:', e.data.size, 'bytes');
                audioChunks.push(e.data);
            };
            mediaRecorder.start(1000);
            isRecording = true;
            recordButton.classList.add('recording');
            microphoneImg.style.filter = 'brightness(0.5)'; // Visual feedback for recording
        } else {
            mediaRecorder.stop();
            isRecording = false;
            recordButton.classList.remove('recording');
            microphoneImg.style.filter = ''; // Reset visual feedback
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.mp3');
                
                // Send to server
                fetch('/upload', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('File uploaded successfully:', data.filename);
                    } else {
                        console.error('Upload failed:', data.error);
                    }
                })
                .catch(error => {
                    console.error('Error uploading file:', error);
                });
            };
        }
    });
});