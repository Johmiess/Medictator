// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize variables for recording
    let mediaRecorder;              // Will hold the recorder instance
    let audioChunks = [];          // Array to store audio chunks
    let isRecording = false;       // Track recording state
    const recordButton = document.getElementById('recordButton');      // Get button element
    const microphoneImg = recordButton.querySelector('.mic-icon');  // Get mic icon
    const uploadButton = document.getElementById('uploadButton');    // Get upload button
    const audioFileInput = document.getElementById('audioFileInput'); // Get file input
    console.log("init vars initalized");

    // Setup file upload functionality
    uploadButton.addEventListener('click', () => {
        audioFileInput.click(); // Trigger the hidden file input
    });

    // Handle file selection
    audioFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log('File selected:', file.name);
            processAudioFile(file);
        }
    });

    // Function to process an audio file (either recorded or uploaded)
    function processAudioFile(audioBlob) {
        console.log('Processing audio file...');
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.mp3');
        
        // Upload file to server
        console.log('Uploading file to server');
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Server response:', data);
            if (data.success) {
                console.log('File uploaded successfully:', data.filename);
                console.log('Structured Data:', data.structured_transcription);
                console.log('Word-for-word:', data.word_for_word);
                
                // Parse the JSON transcription
                const parsedData = parseTranscription(data.structured_transcription);
                
                // Update patient info
                const patientName = document.getElementById('patient-name-display');
                const patientAge = document.getElementById('patient-age-display');
                const patientSex = document.getElementById('patient-sex-display');
                
                if (parsedData.patient_name) patientName.textContent = parsedData.patient_name;
                
                if (parsedData.patient_age) {
                    // Validate age is a number
                    let age = parsedData.patient_age;
                    if (typeof age === 'string') {
                        // Try to extract a number from the string (e.g., "42 years old" -> 42)
                        const matches = age.match(/\d+/);
                        if (matches && matches.length > 0) {
                            age = parseInt(matches[0], 10);
                        } else {
                            console.warn('Could not parse age as a number:', age);
                            age = '';
                        }
                    }
                    
                    // Only update if we have a valid number
                    if (typeof age === 'number' && !isNaN(age) && age >= 0 && age <= 120) {
                        patientAge.textContent = `Age: ${age}`;
                    } else {
                        console.warn('Invalid age value, not updating:', age);
                    }
                }
                
                // Update sections according to prompt.txt categories
                const subjective = document.getElementById('subjective-notes');
                const objective = document.getElementById('objective-notes');
                const assessment = document.getElementById('assessment-notes');
                const plan = document.getElementById('plan-notes');
                
                // Update each section with corresponding data
                if (subjective) subjective.textContent = parsedData.subjective || 'No subjective information available';
                if (objective) objective.textContent = parsedData.objective || 'No objective information available';
                if (assessment) assessment.textContent = parsedData.assessment || 'No assessment information available';
                if (plan) plan.textContent = parsedData.treatment_plan || 'No treatment plan available';
            } else {
                console.error('Upload failed:', data.error);
            }
        })
        .catch(error => {
            console.error('Error uploading file:', error);
        });
    }

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
                // Process the recorded audio
                processAudioFile(audioBlob);
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
            subjective: parsedData.subjective || 'Information not available',
            objective: parsedData.objective || 'Information not available',
            assessment: parsedData.assessment || 'Information not available',
            treatment_plan: parsedData.treatment_plan || 'Information not available'
        };
    } catch (error) {
        console.error('Error parsing transcription:', error);
        // Return default values if parsing fails
        return {
            patient_name: 'Error parsing data',
            patient_age: 'Error parsing data',
            subjective: 'Error parsing data',
            objective: 'Error parsing data',
            assessment: 'Error parsing data',
            treatment_plan: 'Error parsing data'
        };
    }
}