"""
Gemini API Debug Test - SSL Fix Version
"""
import os
import json
import urllib.request
import urllib.error
import ssl

def get_api_key():
    """Read API key from .env file"""
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
    print("GEMINI API DEBUG TEST (SSL Fix)")
    print("=" * 70)
    
    if not GOOGLE_API_KEY:
        print("❌ ERROR: GOOGLE_API_KEY not found in .env file")
        return False
    
    print(f"✓ API Key: {GOOGLE_API_KEY[:15]}...{GOOGLE_API_KEY[-5:]}")
    print(f"✓ Model: gemini-2.0-flash-lite")
    print()
    
    url = f"{GEMINI_API_URL}?key={GOOGLE_API_KEY}"
    
    payload = {
        "contents": [{
            "parts": [{"text": "Respond with: 'Gemini API is working correctly!'"}]
        }]
    }
    
    data = json.dumps(payload).encode('utf-8')
    
    print("🔄 Sending request to Gemini API...")
    print()
    
    try:
        # Create SSL context that doesn't verify certificates (for debugging)
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=30, context=ctx) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            print("✅ SUCCESS! HTTP 200 - API is responding")
            print()
            
            # Extract response
            content = result["candidates"][0]["content"]["parts"][0]["text"]
            
            print("📝 Gemini's Response:")
            print("-" * 70)
            print(content)
            print("-" * 70)
            print()
            
            # Check full response structure
            print("📊 Response Details:")
            print(f"   - Candidates: {len(result.get('candidates', []))}")
            print(f"   - Finish Reason: {result['candidates'][0].get('finishReason', 'N/A')}")
            
            return True
            
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP ERROR: {e.code}")
        error_body = e.read().decode('utf-8')
        print()
        print("Error Details:")
        print(error_body)
        print()
        
        if e.code == 400:
            print("💡 Bad Request - Check API endpoint or payload format")
        elif e.code == 403:
            print("💡 Forbidden - API Key may be invalid or disabled")
            print("   Go to: https://aistudio.google.com/app/apikey")
        elif e.code == 429:
            print("💡 Rate Limit Exceeded - Quota exhausted")
            
        return False
        
    except urllib.error.URLError as e:
        print(f"❌ URL ERROR: {e.reason}")
        return False
        
    except KeyError as e:
        print(f"❌ Response parsing error: Missing key {e}")
        print("Raw response:", json.dumps(result, indent=2))
        return False
        
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {type(e).__name__}")
        print(f"   {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print()
    success = test_gemini()
    print()
    print("=" * 70)
    if success:
        print("✅ FINAL RESULT: Gemini API is WORKING PERFECTLY!")
        print("   You can use Gemini in your application.")
    else:
        print("❌ FINAL RESULT: Gemini API test FAILED")
        print("   See error details above.")
    print("=" * 70)
