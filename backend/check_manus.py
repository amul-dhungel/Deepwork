import os
import requests
from dotenv import load_dotenv

# Load explicitly to ensure we get the latest file content
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

API_KEY = os.getenv("MANUS_API_KEY")
print(f"Loaded Key: {API_KEY[:10]}...{API_KEY[-4:] if API_KEY else 'None'}")

if not API_KEY:
    print("Error: Key not found in .env")
    exit(1)

# List of endpoints to test
test_endpoints = [
    ("Manus Tasks", "https://api.manus.ai/v1/tasks"),
]

# Note: Manus uses specific header "API_KEY" according to docs, not "Authorization"
headers = {
    "API_KEY": API_KEY,
    "Content-Type": "application/json",
    "accept": "application/json"
}

# Payload is required for POST
payload = {
    "prompt": "Hello world",
    "mode": "speed"
}

for name, url in test_endpoints:
    print(f"\nTesting {name} ({url})...")
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")
