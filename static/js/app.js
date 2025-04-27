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
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = (e) => {
                console.log('Got chunk:', e.data.size, 'bytes');
                audioChunks.push(e.data);
            };
            mediaRecorder.start(10);
            isRecording = true;
            recordButton.classList.add('recording');  // Visual feedback
            microphoneImg.style.filter = 'brightness(0.5)';  // Dim mic icon
        } else {
            // Stop Recording
            mediaRecorder.stop();
            isRecording = false;
            recordButton.classList.remove('recording');  // Remove visual feedback
       

            // Handler for when recording stops
            mediaRecorder.onstop = () => {
                console.log('Recording stopped');
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.mp3');
                microphoneImg.style.filter = '';  // Reset mic icon
                // First request: Upload audio file to server
                console.log('Uploading file to server');
                // Make POST request to /upload endpoint with audio file
                fetch('/upload', {
                    method: 'POST',
                    body: formData  // FormData containing the audio blob
                })
                // First .then() - Handle the raw response
                .then(response => {
                    console.log('Response status:', response.status);  // Log HTTP status code
                    return response.json();  // Parse response body as JSON
                })
                // Second .then() - Handle the parsed JSON data
                .then(data => {
                    console.log('Server response:', data);
                    if (data.success) {
                        console.log('File uploaded successfully:', data.filename);
                        console.log('Transcription:', data.transcription);
                        
                        // Parse the transcription into sections
                        const sections = parseTranscription(data.transcription);
                        
                        // Display each section in its corresponding textarea
                        document.getElementById('subjective').value = sections.subjective || '';
                        document.getElementById('objective').value = sections.objective || '';
                        document.getElementById('assessment').value = sections.assessment || '';
                        document.getElementById('plan').value = sections.plan || '';
                    } else {
                        console.error('Upload failed:', data.error);
                    }
                })
                // Catch any errors in the Promise chain
                .catch(error => {
                    console.error('Error uploading file:', error);  // Log network/parsing errors
                });
            };
        }
    })
});

// Function to parse transcription into sections
function parseTranscription(transcription) {
    const sections = {
        subjective: '',
        objective: '',
        assessment: '',
        plan: ''
    };

    // Split the transcription by section headers
    const sectionRegex = /\$\[(.*?)\]\$/g;
    let currentSection = '';
    let currentContent = [];

    // Split the transcription into lines and process each line
    const lines = transcription.split('\n');
    
    for (const line of lines) {
        // Check if line contains a section header
        const sectionMatch = line.match(sectionRegex);
        if (sectionMatch) {
            // If we were processing a previous section, save its content
            if (currentSection && currentContent.length > 0) {
                sections[currentSection] = currentContent.join('\n').trim();
                currentContent = [];
            }
            // Start new section
            currentSection = sectionMatch[1].toLowerCase();
        } else if (currentSection) {
            // Add content to current section
            currentContent.push(line);
        }
    }

    // Save the last section
    if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
}