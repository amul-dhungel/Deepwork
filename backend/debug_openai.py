import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENAI_API_KEY")

def test_openai():
    if not API_KEY:
        print("Skipping OpenAI test: No OPENAI_API_KEY found.")
        return

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "Hello!"}],
        "temperature": 0.7
    }
    
    try:
        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        print(response.json())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_openai()
