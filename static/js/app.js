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
            microphoneImg.style.filter = '';  // Reset mic icon

            // Handler for when recording stops
            mediaRecorder.onstop = () => {
                console.log('Recording stopped');
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.mp3');
                
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
                        console.log('Structured Data:', data.structured_transcription);
                        console.log('Word-for-word:', data.word_for_word);
                        
                        // Parse the JSON transcription
                        const parsedData = parseTranscription(data.structured_transcription);
                        
                        // Update patient info
                        const patientName = document.querySelector('.text-wrapper');
                        const patientAge = document.querySelector('.text-wrapper-2');
                        const patientSex = document.querySelector('.text-wrapper-3');
                        
                        if (parsedData.patient_name) patientName.textContent = parsedData.patient_name;
                        if (parsedData.patient_age) patientAge.textContent = `Age: ${parsedData.patient_age}`;
                        
                        // Update SOAP sections
                        const subjective = document.getElementById('subjective');
                        const objective = document.getElementById('objective');
                        const assessment = document.getElementById('assessment');
                        const plan = document.getElementById('plan');
                        const patientHistorySection = document.querySelector('.rectangle-3');
                        
                        // Combine relevant sections for each SOAP component
                        subjective.value = `Chief Complaint: ${parsedData.chief_complaint || 'Not available'}\nMedical History: ${parsedData.medical_history || 'Not available'}`;
                        objective.value = `Current Medications: ${parsedData.current_medications || 'Not available'}`;
                        assessment.value = parsedData.assessment || 'Not available';
                        plan.value = parsedData.treatment_plan || 'Not available';

                        // Update patient history section
                     
                        if (patientHistorySection) {
                            patientHistorySection.innerHTML = `<div class="patient-history-content">${parsedData.medical_history || 'No medical history available'}</div>`;
                        }

                        // Display word-for-word transcription in a new section or modal
                        // const existingElement = document.querySelector('.word-for-word-transcription');
                        // if (existingElement) {
                        //     existingElement.remove();
                        // }
                        
                        // const wordForWordSection = document.createElement('div');
                        // wordForWordSection.className = 'word-for-word-transcription';
                        // wordForWordSection.innerHTML = `<h3>Full Conversation</h3><pre>${data.word_for_word}</pre>`;
                        document.body.appendChild(wordForWordSection);
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
    });
});

// Function to parse the transcription JSON
function parseTranscription(transcription) {
    try {
        // Extract the JSON string from the transcription
        const jsonStr = transcription.substring(
            transcription.indexOf('{'),
            transcription.lastIndexOf('}') + 1
        );
        
        // Parse the JSON string into an object
        const parsedData = JSON.parse(jsonStr);
        
        // Return the parsed data with default values for missing fields
        return {
            patient_name: parsedData.patient_name || 'Information not available',
            patient_age: parsedData.patient_age || 'Information not available',
            chief_complaint: parsedData.chief_complaint || 'Information not available',
            medical_history: parsedData.medical_history || 'Information not available',
            current_medications: parsedData.current_medications || 'Information not available',
            assessment: parsedData.assessment || 'Information not available',
            treatment_plan: parsedData.treatment_plan || 'Information not available'
        };
    } catch (error) {
        console.error('Error parsing transcription:', error);
        // Return default values if parsing fails
        return {
            patient_name: 'Error parsing data',
            patient_age: 'Error parsing data',
            chief_complaint: 'Error parsing data',
            medical_history: 'Error parsing data',
            current_medications: 'Error parsing data',
            assessment: 'Error parsing data',
            treatment_plan: 'Error parsing data'
        };
    }
}