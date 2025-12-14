import requests
import json
import sys

def test_stream():
    url = "http://localhost:8000/api/stream_chat"
    payload = {
        "prompt": "generate one simple table and a report on vaccination",
        "modelProvider": "ollama", 
        "options": {}
    }
    
    print(f"Testing Prompt: '{payload['prompt']}' via Ollama...")
    print("-" * 50)

    try:
        response = requests.post(url, json=payload, stream=True)
        response.raise_for_status()
        
        full_content = ""
        
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                try:
                    data = json.loads(decoded_line)
                    if data.get("type") == "chunk":
                        content = data.get("content", "")
                        print(content, end="", flush=True)
                        full_content += content
                    elif data.get("type") == "error":
                        print(f"\n[ERROR]: {data.get('error')}")
                except json.JSONDecodeError:
                    pass
                    
        print("\n" + "-" * 50)
        print("\n[COMPLETE]")
        
    except Exception as e:
        print(f"\nRequest Failed: {e}")

if __name__ == "__main__":
    test_stream()
