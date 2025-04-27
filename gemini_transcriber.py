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
    *"Attached with is a recording of a conversation between a doctor and a patient during a medical appointment. Do not hallucinate anything and don't make information up, just write "information not avliable" if you don't know the information.
      Here are the specifics of the information you need to extract for each field:

        patient_name: Full name of the patient

        patient_age: Patient's current age

        subjective: Patient's description of their past and current medical history, feelings, and symptoms, described in their own words as subjective information.

        objective: All of patient's medical diagnoses, medications, lab results, exam results, and any other objective information.

        assessment: The doctor's assessment and diagnosis of the patient's condition.

        treatment_plan: Specific actions for diagnosis, treatment, and patient education based on today's assessment.

    Follow-up Instructions (Plan): Recommended timelines, monitoring, or next steps the patient should take after the visit.
      Use this Json format for the output:
    {
        "patient_name": " ",
        "patient_age": " ",
        "subjective": " ",
        "objective": " ",
        "assessment": " ",
        "treatment_plan": " "
    }"*"""

    audio_file = genai_client.files.upload(file=file_path)
    
    response = genai_client.models.generate_content(
        model="gemini-2.0-flash", 
        contents=[prompt, audio_file]
    )
    
    return response.text

def transcribe_word_for_word(file_path: str) -> str:
    """
    Get a word-for-word transcription of the conversation.
    
    Args:
        file_path (str): Path to the audio file
        
    Returns:
        str: Raw transcription text
    """
    load_dotenv()
    genai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    prompt = """
    Transcribe the following audio recording word-for-word, exactly as spoken.
    Include all filler words, pauses, and verbal cues.
    Format the transcription as a conversation with speaker labels:
    
    Doctor: [exact words]
    Patient: [exact words]
    
    Do not summarize or interpret, just transcribe exactly what is said.
    """

    audio_file = genai_client.files.upload(file=file_path)
    
    response = genai_client.models.generate_content(
        model="gemini-2.0-flash", 
        contents=[prompt, audio_file]
    )
    
    return response.text

if __name__ == "__main__":
    # Example usage
    structured_transcription = transcribe_audio("uploads/recording_20250426_145823.mp3")
    print("Structured Data:", structured_transcription)
    
    word_for_word = transcribe_word_for_word("uploads/recording_20250426_145823.mp3")
    print("\nWord-for-word Transcription:", word_for_word)
