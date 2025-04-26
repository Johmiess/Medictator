from flask import Flask, render_template, request, jsonify
import os
from groq import Groq

app = Flask(__name__)

# Initialize Groq client - you'll need to set your API key
client = Groq(
    api_key="your-groq-api-key"  # Store this securely in environment variables
)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process-audio', methods=['POST'])
def process_audio():
    try:
        # Get the audio data from the request
        audio_data = request.files['audio']
        
        # Here you would:
        # 1. Save the audio temporarily
        # 2. Transcribe the audio (you might want to use OpenAI's Whisper API or another transcription service)
        # 3. Send transcription to Groq for summarization
        
        # Example Groq API call for summarization
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that creates concise, well-structured notes from text."
                },
                {
                    "role": "user",
                    "content": f"Please create a structured summary in bullet points from this text: {transcribed_text}"
                }
            ],
            model="mixtral-8x7b-32768",  # or another appropriate model
            temperature=0.7,
        )
        
        summary = chat_completion.choices[0].message.content
        
        return jsonify({
            'success': True,
            'summary': summary
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    app.run(debug=True)
