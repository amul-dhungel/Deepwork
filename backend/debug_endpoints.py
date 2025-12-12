import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    try:
        r = requests.get(f"{BASE_URL}/api/health")
        print(f"Health Check: {r.status_code}")
        print(r.text)
    except Exception as e:
        print(f"Health Check Failed: {e}")

def test_generate():
    try:
        payload = {
            "topic": "Test",
            "purpose": "Debug",
            "tone": "Neutral"
        }
        headers = {"X-Session-ID": "debug-session"}
        r = requests.post(f"{BASE_URL}/api/generate", json=payload, headers=headers)
        print(f"Generate Check: {r.status_code}")
        print(r.text)
    except Exception as e:
        print(f"Generate Check Failed: {e}")

if __name__ == "__main__":
    test_health()
    test_generate()
