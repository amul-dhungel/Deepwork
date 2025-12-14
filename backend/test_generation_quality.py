
import requests
import uuid
import json

BASE_URL = "http://localhost:8000"

def test_vaccination_report():
    print("\n--- Testing Generation Quality (Vaccination Report) ---")
    session_id = str(uuid.uuid4())
    headers = {'X-Session-ID': session_id, 'Content-Type': 'application/json'}
    
    payload = {
        "topic": "vaccination",
        "purpose": "report",
        "style": "professional",
        "tone": "informative",
        # Use Ollama since user said they use it, or gemini if available. 
        # User asked "check by yourself", I'll try 'ollama' as he set it up recently.
        # If ollama fails, I'll fall back to 'gemini' (but gemini was quota limited).
        # Let's try 'manus' ? No, manus is an agent.
        # I'll try 'ollama' first.
        "modelProvider": "ollama" 
    }
    
    try:
        print(f"Sending request to {BASE_URL}/api/generate...")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{BASE_URL}/api/generate", json=payload, headers=headers, timeout=120)
        
        if response.status_code == 200:
            data = response.json()
            content = data.get('content', '')
            print("\n--- RAW CONTENT START ---")
            print(content)
            print("--- RAW CONTENT END ---\n")
            
            # Simple Quality Checks
            checks = {
                "HTML Tags Present": "<p>" in content or "<h1>" in content,
                "No Markdown Headings": "# " not in content,
                "No Markdown Code Blocks": "```" not in content,
            }
            
            print("Quality Checks:")
            for k, v in checks.items():
                print(f"  {k}: {'PASS' if v else 'FAIL'}")
                
        else:
            print(f"Error: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_vaccination_report()
