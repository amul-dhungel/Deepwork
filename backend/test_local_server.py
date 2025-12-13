import requests

def test_generate():
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/generate",
            json={
                "topic": "Test",
                "purpose": "Test",
                "modelProvider": "grok"
            },
            headers={"X-Session-ID": "test-session"}
        )
        print(f"Status: {response.status_code}")
        print(f"Body: {response.text}")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_generate()
