from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
from groq import Groq
import tempfile
from dotenv import load_dotenv
import google.generativeai as genai
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Groq client
try:
    client = Groq(
        api_key=os.getenv('GROQ_API_KEY')
    )
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {str(e)}")
    client = None

# Initialize Gemini
try:
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
except Exception as e:
    logger.error(f"Failed to initialize Gemini: {str(e)}")

def transcribe_audio(audio_file_path):
    """Transcribe audio file using Gemini API"""
    try:
        if not os.path.exists(audio_file_path):
            logger.error(f"Audio file not found: {audio_file_path}")
            return None

        # Read the audio file
        with open(audio_file_path, "rb") as audio_file:
            audio_data = audio_file.read()
        
        if not audio_data:
            logger.error("Audio file is empty")
            return None

        # Create a generative model
        model = genai.GenerativeModel('gemini-pro-vision')
        
        # Create the prompt for transcription
        prompt = "Please transcribe this audio recording into text. Focus on medical terminology and patient information."
        
        # Generate the transcription
        response = model.generate_content([prompt, audio_data])
        
        if not response.text:
            logger.error("Empty response from Gemini")
            return None

        return response.text
    except Exception as e:
        logger.error(f"Error in transcription: {str(e)}")
        return None

def summarize_text(text):
    """Summarize text using Groq API"""
    try:
        if not text or not text.strip():
            logger.error("Empty text provided for summarization")
            return None

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": """You are a medical assistant that creates structured medical notes. 
                    Format the summary as follows:
                    - Patient Information
                    - Chief Complaint
                    - History of Present Illness
                    - Assessment
                    - Plan
                    Use bullet points and keep the information concise but comprehensive."""
                },
                {
                    "role": "user",
                    "content": f"Please create a structured medical note from this text: {text}"
                }
            ],
            model="mixtral-8x7b-32768",
            temperature=0.7,
        )
        
        if not chat_completion.choices or not chat_completion.choices[0].message.content:
            logger.error("Empty response from Groq")
            return None

        return chat_completion.choices[0].message.content
    except Exception as e:
        logger.error(f"Error in summarization: {str(e)}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process-audio', methods=['POST'])
def process_audio():
    try:
        # Check if audio file is in request
        if 'audio' not in request.files:
            logger.error("No audio file in request")
            return jsonify({'success': False, 'error': 'No audio file provided'})

        audio_file = request.files['audio']
        
        # Validate file
        if not audio_file.filename:
            logger.error("Empty filename")
            return jsonify({'success': False, 'error': 'No file selected'})

        # Check file extension
        if not audio_file.filename.lower().endswith(('.mp4', '.mp3', '.wav')):
            logger.error(f"Invalid file type: {audio_file.filename}")
            return jsonify({'success': False, 'error': 'Invalid file type. Please upload MP4, MP3, or WAV.'})
        
        # Save audio temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_audio:
            audio_file.save(temp_audio.name)
            temp_audio_path = temp_audio.name

        try:
            # Transcribe audio
            transcribed_text = transcribe_audio(temp_audio_path)
            if not transcribed_text:
                return jsonify({'success': False, 'error': 'Failed to transcribe audio'})

            # Summarize text
            summary = summarize_text(transcribed_text)
            if not summary:
                return jsonify({'success': False, 'error': 'Failed to summarize text'})

            return jsonify({
                'success': True,
                'summary': summary
            })

        finally:
            # Clean up temporary file
            if os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)

    except Exception as e:
        logger.error(f"Error in process_audio: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    app.run(debug=True)
