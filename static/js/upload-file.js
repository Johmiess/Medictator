// File upload functionality for the SOAP notes application
document.addEventListener('DOMContentLoaded', () => {
    const uploadButton = document.getElementById('uploadButton');
    const audioFileInput = document.getElementById('audioFileInput');
    
    if (!uploadButton || !audioFileInput) {
        console.error('Upload elements not found in the DOM');
        return;
    }
    
    // Setup file upload functionality
    uploadButton.addEventListener('click', () => {
        audioFileInput.click(); // Trigger the hidden file input
    });
    
    // Handle file selection
    audioFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        console.log('File selected:', file.name);
        
        // Check if file is an MP3
        if (!file.type.includes('audio')) {
            alert('Please select an audio file (MP3 preferred)');
            return;
        }
        
        // Create a loading indicator
        uploadButton.disabled = true;
        uploadButton.style.opacity = 0.6;
        const originalHtml = uploadButton.innerHTML;
        uploadButton.innerHTML = '<div class="spinner"></div>';
        
        // Upload and process the file
        const formData = new FormData();
        formData.append('audio', file);
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Server response:', data);
            if (data.success) {
                console.log('File uploaded successfully:', data.filename);
                
                // Parse and display the transcription results
                if (data.structured_transcription) {
                    processTranscription(data.structured_transcription);
                }
                
                // Reset the file input
                audioFileInput.value = '';
                
                // Show success indicator
                uploadButton.style.backgroundColor = '#4CAF50';
                uploadButton.innerHTML = '<span style="color: white;">✓</span>';
                setTimeout(() => {
                    uploadButton.style.backgroundColor = '';
                    uploadButton.innerHTML = originalHtml;
                    uploadButton.disabled = false;
                    uploadButton.style.opacity = 1;
                }, 2000);
            } else {
                console.error('Upload failed:', data.error);
                alert('Upload failed: ' + (data.error || 'Unknown error'));
                uploadButton.innerHTML = originalHtml;
                uploadButton.disabled = false;
                uploadButton.style.opacity = 1;
            }
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            alert('Error uploading file. Please try again.');
            uploadButton.innerHTML = originalHtml;
            uploadButton.disabled = false;
            uploadButton.style.opacity = 1;
        });
    });
    
    // Function to process the transcription data
    function processTranscription(transcription) {
        try {
            // Extract the JSON string from the transcription
            const jsonStr = transcription.substring(
                transcription.indexOf('{'),
                transcription.lastIndexOf('}') + 1
            );
            
            // Parse the JSON string into an object
            const parsedData = JSON.parse(jsonStr);
            
            // Update patient info
            const patientName = document.getElementById('patient-name-display');
            const patientAge = document.getElementById('patient-age-display');
            
            if (patientName && parsedData.patient_name) {
                patientName.textContent = parsedData.patient_name;
            }
            
            if (patientAge && parsedData.patient_age) {
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
            
            // Update SOAP sections
            const subjective = document.getElementById('subjective-notes');
            const objective = document.getElementById('objective-notes');
            const assessment = document.getElementById('assessment-notes');
            const plan = document.getElementById('plan-notes');
            
            if (subjective) {
                subjective.textContent = parsedData.subjective || 'No subjective information available';
            }
            
            if (objective) {
                objective.textContent = parsedData.objective || 'No objective information available';
            }
            
            if (assessment) {
                assessment.textContent = parsedData.assessment || 'No assessment information available';
            }
            
            if (plan) {
                plan.textContent = parsedData.treatment_plan || 'No treatment plan available';
            }
            
        } catch (error) {
            console.error('Error processing transcription:', error);
        }
    }
}); 