import os
import time
import hmac
import hashlib
import base64
import json
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("ZHIPU_API_KEY")

def generate_token(apikey: str, exp_seconds: int = 600):
    try:
        id, secret = apikey.split(".")
    except Exception as e:
        raise Exception("Invalid API Key format", e)

    payload = {
        "api_key": id,
        "exp": int(round(time.time() * 1000)) + exp_seconds * 1000,
        "timestamp": int(round(time.time() * 1000)),
    }

    headers = {
        "alg": "HS256",
        "sign_type": "SIGN"
    }
    
    def b64url(data):
        return base64.urlsafe_b64encode(data).rstrip(b'=')

    segments = []
    segments.append(b64url(json.dumps(headers).encode('utf-8')))
    segments.append(b64url(json.dumps(payload).encode('utf-8')))
    
    signing_input = b'.'.join(segments)
    signature = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
    
    segments.append(b64url(signature))
    return b'.'.join(segments).decode('utf-8')

def test_zhipu():
    print("Testing Zhipu AI with native JWT generation...")
    if not API_KEY:
        print("Skipping: No ZHIPU_API_KEY found.")
        return

    try:
        token = generate_token(API_KEY)
    except Exception as e:
        print(f"Token Generation Error: {e}")
        return

    url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "glm-4-flash",
        "messages": [{"role": "user", "content": "Hello"}],
        "stream": False
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(response.text)
    except Exception as e:
        print(f"Request Error: {e}")

if __name__ == "__main__":
    test_zhipu()
