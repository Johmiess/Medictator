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

    prompt = """
    *"The following is a recording of a conversation between a doctor and a patient during a medical appointment. Please transcribe the recording clearly. Then, organize the information into structured fields
    (keep the special characters like $):

    Patient Name: $insert patient name$

    Patient Age:$insert patient age$

    Chief Complaint: $insert chief complaint$

    Medical History: $insert medical history$

    Current Medications: $insert current medications$

    Conditions to Monitor: $insert conditions to monitor$

    Treatment Plan: $insert treatment plan$

    Follow-up Instructions: $insert follow-up instructions$

    Only include the relevant details and omit filler words. Use clear and professional language, formatted as a structured note.
    
    
    
    "*"""

    audio_file = genai_client.files.upload(file=file_path)
    
    response = genai_client.models.generate_content(
        model="gemini-2.0-flash", 
        contents=[prompt, audio_file]
    )
    
    return response.text

if __name__ == "__main__":
    # Example usage
    transcription = transcribe_audio("uploads/recording_20250426_145823.mp3")
    print(transcription)
