import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("ZHIPU_API_KEY")

def test_zhipu():
    print(f"Testing Key against Zhipu AI (BigModel) - V4 Endpoint...")
    
    if not API_KEY:
        print("Skipping: No ZHIPU_API_KEY found.")
        return

    url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
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
        print(f"Error: {e}")

if __name__ == "__main__":
    test_zhipu()
