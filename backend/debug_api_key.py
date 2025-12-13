import requests
import os
from dotenv import load_dotenv

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

def test_gemini():
    if not GOOGLE_API_KEY:
        print("No GOOGLE_API_KEY")
        return

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={GOOGLE_API_KEY}"
    payload = {"contents": [{"parts": [{"text": "Hello"}]}]}
    try:
        response = requests.post(url, json=payload)
        print(response.status_code)
    except Exception as e:
        print(e)

if __name__ == "__main__":
    test_gemini()
