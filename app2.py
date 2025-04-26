from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
from groq import Groq
import tempfile
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Groq client
client = Groq(
    api_key=os.getenv('GROQ_API_KEY')
)

# Initialize Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def transcribe_audio(audio_file_path):
    """Transcribe audio file using Gemini API"""
    try:
        # Read the audio file
        with open(audio_file_path, "rb") as audio_file:
            audio_data = audio_file.read()
        
        # Create a generative model
        model = genai.GenerativeModel('gemini-pro-vision')
        
        # Create the prompt for transcription
        prompt = "Please transcribe this audio recording into text. Focus on medical terminology and patient information."
        
        # Generate the transcription
        response = model.generate_content([prompt, audio_data])
        
        return response.text
    except Exception as e:
        print(f"Error in transcription: {str(e)}")
        return None

def summarize_text(text):
    """Summarize text using Groq API"""
    try:
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
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error in summarization: {str(e)}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process-audio', methods=['POST'])
def process_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'success': False, 'error': 'No audio file provided'})

        audio_file = request.files['audio']
        
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
            os.unlink(temp_audio_path)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    app.run(debug=True)
