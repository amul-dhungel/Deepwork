
import requests
import json
import sys

def debug_stream():
    url = "http://127.0.0.1:8000/api/stream_chat"
    
    # Payload similar to what frontend sends
    payload = {
        "prompt": "Draw a architectural diagram of a 3-tier web application using Excalidraw.",
        "context_str": "",
        "session_id": "debug_session_123",
        "modelProvider": "ollama" # FORCE OLLAMA
    }
    
    print(f"Sending Request to {url}...")
    
    try:
        response = requests.post(url, json=payload, stream=True)
        
        full_content = ""
        
        print("\n--- STREAM START ---\n")
        
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
                        print(f"\nERROR in stream: {data['error']}")
                except json.JSONDecodeError:
                    print(f"\nJSON Decode Error on line: {decoded_line}")
                    
        print("\n\n--- STREAM END ---\n")
        
        print(f"Total Length: {len(full_content)}")
        if "[object Object]" in full_content:
            print("DETECTED '[object Object]' in output!")
        else:
            print("No '[object Object]' found.")
            
        return full_content
        
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return None

if __name__ == "__main__":
    debug_stream()
