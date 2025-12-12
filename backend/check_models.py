import os
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("Error: GOOGLE_API_KEY not found in .env")
    exit(1)

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GOOGLE_API_KEY}"
response = requests.get(url)

if response.status_code == 200:
    models = response.json().get('models', [])
    print("Available Models:")
    for m in models:
        print(f"- {m['name']}")
        if 'generateContent' in m.get('supportedGenerationMethods', []):
            print(f"  (Supports generateContent)")
else:
    print(f"Error listing models: {response.status_code} - {response.text}")
