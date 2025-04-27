from google import genai
from dotenv import load_dotenv
import os

def transcribe_audio(file_path: str) -> str:
    """
    Transcribe audio file using Gemini API.
    
    Args:
        file_path (str): Path to the audio file
        
    Returns:
        str: Transcription text
    """
    load_dotenv()
    genai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    
    audio_file = genai_client.files.upload(file=file_path)
    
    response = genai_client.models.generate_content(
        model="gemini-2.0-flash", 
        contents=["Describe this audio clip", audio_file]
    )
    
    return response.text

if __name__ == "__main__":
    # Example usage
    transcription = transcribe_audio("uploads/recording_20250426_145823.mp3")
    print(transcription)
