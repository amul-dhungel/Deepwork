import requests

url = "http://127.0.0.1:8000/api/stream_chat"
headers = {
    "Origin": "http://localhost:5186",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type,x-session-id"
}

try:
    print(f"Testing OPTIONS {url} with headers {headers}")
    response = requests.options(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response Headers:")
    for k, v in response.headers.items():
        print(f"{k}: {v}")
except Exception as e:
    print(f"Error: {e}")
