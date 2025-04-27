from groq import Groq
from dotenv import load_dotenv
import os

def get_groq_response(prompt: str) -> str:
    load_dotenv()
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model="llama-3.3-70b-versatile",
        stream=False,
    )

    return chat_completion.choices[0].message.content

# Example usage
if __name__ == "__main__":
    response = get_groq_response("Explain the importance of fast language models")
    print(response)