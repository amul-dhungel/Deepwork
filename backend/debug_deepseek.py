import requests
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("DEEPSEEK_API_KEY")

def test_deepseek():
    if not API_KEY:
        print("No DEEPSEEK_API_KEY found.")
        return
        
    url = "https://api.deepseek.com/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    payload = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": "Hi"}],
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(response.status_code, response.text)
    except Exception as e:
        print(e)
        
if __name__ == "__main__":
    test_deepseek()
