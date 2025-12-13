import os
import requests
import time
from dotenv import load_dotenv

# Load env variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    print("FATAL: GOOGLE_API_KEY not found.")
    exit(1)

# Configuration to test
MODEL_NAME = "gemini-flash-latest"

API_VERSION = "v1beta"
BASE_URL = "https://generativelanguage.googleapis.com"
URL = f"{BASE_URL}/{API_VERSION}/models/{MODEL_NAME}:generateContent"

print(f"Testing Model: {MODEL_NAME}")
print(f"URL: {URL}")
print(f"Key (masked): {GOOGLE_API_KEY[:5]}...{GOOGLE_API_KEY[-5:]}")

headers = {
    "Content-Type": "application/json"
}

payload = {
    "contents": [{
        "parts": [{"text": "Hello, explain how 2+2=4 in one sentence."}]
    }]
}

try:
    print("\nSending POST request...")
    start_time = time.time()
    response = requests.post(
        f"{URL}?key={GOOGLE_API_KEY}",
        headers=headers,
        json=payload,
        timeout=30
    )
    duration = time.time() - start_time
    print(f"Request took: {duration:.2f}s")
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body:\n{response.text}")

    if response.status_code == 200:
        print("\nSUCCESS: API is working correctly.")
    else:
        print("\nFAILURE: API returned an error.")

except Exception as e:
    print(f"\nEXCEPTION ACQUIRED: {e}")
    import traceback
    traceback.print_exc()
