import os
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

API_KEY = os.getenv("GOOGLE_API_KEY")
MODEL = "gemini-3-pro-preview"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

print(f"Testing Model: {MODEL}")
print(f"Key loaded: {bool(API_KEY)}")

headers = {"Content-Type": "application/json"}
payload = {
    "contents": [{"parts": [{"text": "Hello, explain AI formatting."}]}]
}

try:
    response = requests.post(f"{URL}?key={API_KEY}", headers=headers, json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
