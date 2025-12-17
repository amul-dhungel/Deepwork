"""
Simple debug script to test Gemini API - no external dependencies
"""
import os
import json
import urllib.request
import urllib.error

# Get API key from environment (should be set when main.py loads .env)
# For standalone testing, you can hardcode it temporarily:
# GOOGLE_API_KEY = "your_key_here"

def get_api_key():
    """Try to read API key from .env file"""
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('GOOGLE_API_KEY'):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    except:
        pass
    return os.environ.get('GOOGLE_API_KEY')

GOOGLE_API_KEY = get_api_key()
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent"

def test_gemini():
    print("=" * 70)
    print("GEMINI API DEBUG TEST")
    print("=" * 70)
    
    if not GOOGLE_API_KEY:
        print("❌ ERROR: GOOGLE_API_KEY not found")
        print("   Check your .env file")
        return False
    
    print(f"✓ API Key found: {GOOGLE_API_KEY[:15]}...{GOOGLE_API_KEY[-5:]}")
    print(f"✓ Model: gemini-2.0-flash-lite")
    print()
    
    # Prepare request
    url = f"{GEMINI_API_URL}?key={GOOGLE_API_KEY}"
    
    payload = {
        "contents": [{
            "parts": [{"text": "Say 'Hello! Gemini API is working!' if you receive this."}]
        }]
    }
    
    data = json.dumps(payload).encode('utf-8')
    
    print("🔄 Sending test request...")
    print()
    
    try:
        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            print("✅ SUCCESS! Status: 200")
            print()
            
            try:
                content = result["candidates"][0]["content"]["parts"][0]["text"]
                print("📝 Gemini Response:")
                print("-" * 70)
                print(content)
                print("-" * 70)
                return True
            except (KeyError, IndexError) as e:
                print(f"⚠️  Unexpected response structure: {e}")
                print("Raw:", json.dumps(result, indent=2))
                return False
                
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP ERROR {e.code}")
        error_body = e.read().decode('utf-8')
        print(f"   {error_body}")
        
        if e.code == 400:
            print("   → Bad Request (check API URL/payload)")
        elif e.code == 403:
            print("   → API Key Invalid or Disabled")
        elif e.code == 429:
            print("   → Rate Limit / Quota Exceeded")
            
        return False
        
    except urllib.error.URLError as e:
        print(f"❌ CONNECTION ERROR: {e.reason}")
        return False
        
    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print()
    success = test_gemini()
    print()
    print("=" * 70)
    if success:
        print("✅ RESULT: Gemini API is WORKING!")
    else:
        print("❌ RESULT: Gemini API test FAILED")
    print("=" * 70)
