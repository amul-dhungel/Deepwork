import requests
import json

url = "http://127.0.0.1:8000/api/stream_chat"
headers = {
    "Origin": "http://localhost:5186",
    "Content-Type": "application/json",
    "X-Session-ID": "test-session"
}
payload = {
    "prompt": "Hello",
    "modelProvider": "mock" # Use mock to be fast and safe
}

try:
    print(f"Testing POST {url} with headers {headers}")
    response = requests.post(url, headers=headers, json=payload, stream=True)
    print(f"Status Code: {response.status_code}")
    for line in response.iter_lines():
        if line:
            print(f"Received: {line.decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
