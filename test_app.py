import unittest
from prototype_app import app, transcribe_audio, summarize_text
import os
import tempfile
from flask import Flask, request
from werkzeug.datastructures import FileStorage

class TestAudioProcessing(unittest.TestCase):
    def setUp(self):
        # Create a test client
        self.app = app.test_client()
        self.app.testing = True

    def test_transcribe_audio(self):
        """Test audio transcription with a sample audio file"""
        # Create a temporary audio file
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_audio:
            # Write some test data (you might want to use a real audio file for testing)
            temp_audio.write(b'test audio data')
            temp_audio_path = temp_audio.name

        try:
            # Test transcription
            result = transcribe_audio(temp_audio_path)
            self.assertIsNotNone(result, "Transcription should return text")
            self.assertIsInstance(result, str, "Transcription should return a string")
        finally:
            # Clean up
            os.unlink(temp_audio_path)

    def test_summarize_text(self):
        """Test text summarization with sample text"""
        test_text = "Patient John Doe, age 45, presented with chest pain. History of hypertension."
        result = summarize_text(test_text)
        
        self.assertIsNotNone(result, "Summarization should return text")
        self.assertIsInstance(result, str, "Summarization should return a string")
        # Check if the summary contains expected sections
        self.assertTrue(any(section in result for section in 
                          ['Patient Information', 'Chief Complaint', 'History', 'Assessment', 'Plan']))

    def test_process_audio_route(self):
        """Test the /process-audio route"""
        # Create a test audio file
        with tempfile.NamedTemporaryFile(suffix='.mp4') as temp_audio:
            temp_audio.write(b'test audio data')
            temp_audio.seek(0)
            
            # Create a FileStorage object
            audio_file = FileStorage(
                stream=temp_audio,
                filename='test.mp4',
                content_type='audio/mp4'
            )
            
            # Test the route
            response = self.app.post(
                '/process-audio',
                data={'audio': audio_file},
                content_type='multipart/form-data'
            )
            
            # Check response
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertIn('success', data)
            self.assertIn('summary', data)

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        # Test with no audio file
        response = self.app.post('/process-audio')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertFalse(data['success'])
        self.assertIn('error', data)

if __name__ == '__main__':
    unittest.main() 