import requests
import os
from dotenv import load_dotenv

load_dotenv()

# User provided key
API_KEY = os.getenv("GROK_API_KEY")

def test_grok():
    if not API_KEY:
        print("Skipping Grok test: No GROK_API_KEY found.")
        return

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "grok-beta",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Explain quantum computing in one sentence."}
        ],
        "stream": False
    }
    
    try:
        response = requests.post("https://api.x.ai/v1/chat/completions", headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        print(response.json())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_grok()
