"""
Debug script to test Gemini API connection and response
"""
import os
import sys
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent"

def test_gemini_api():
    print("=" * 60)
    print("GEMINI API DEBUG TEST")
    print("=" * 60)
    
    # Check if API key exists
    if not GOOGLE_API_KEY:
        print("❌ ERROR: GOOGLE_API_KEY not found in .env file")
        print("   Please add your API key to the .env file:")
        print("   GOOGLE_API_KEY=your_api_key_here")
        return False
    
    print(f"✓ API Key found: {GOOGLE_API_KEY[:10]}...{GOOGLE_API_KEY[-5:]}")
    print(f"✓ Using model: gemini-2.0-flash-lite")
    print()
    
    # Prepare request
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [{
            "parts": [{"text": "Hello! Please respond with 'Gemini API is working!' if you receive this."}]
        }]
    }
    
    print("🔄 Sending test request to Gemini API...")
    print(f"   URL: {GEMINI_API_URL}")
    print()
    
    try:
        response = requests.post(
            f"{GEMINI_API_URL}?key={GOOGLE_API_KEY}",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        print(f"📥 Response Status: {response.status_code}")
        print()
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS! Gemini API is responding correctly!")
            print()
            print("Response Structure:")
            print(f"  - Candidates: {len(data.get('candidates', []))}")
            
            try:
                content = data["candidates"][0]["content"]["parts"][0]["text"]
                print()
                print("📝 Gemini Response:")
                print("-" * 60)
                print(content)
                print("-" * 60)
                return True
                
            except (KeyError, IndexError) as e:
                print(f"⚠️  Warning: Unexpected response structure: {e}")
                print("Raw response:")
                print(data)
                return False
                
        elif response.status_code == 400:
            print("❌ BAD REQUEST (400)")
            print("   Response:", response.text)
            return False
            
        elif response.status_code == 403:
            print("❌ FORBIDDEN (403) - API Key Issue")
            print("   Your API key may be invalid or disabled")
            print("   Response:", response.text)
            return False
            
        elif response.status_code == 429:
            print("❌ RATE LIMIT EXCEEDED (429)")
            print("   You've hit the API quota/rate limit")
            print("   Response:", response.text)
            return False
            
        else:
            print(f"❌ ERROR: {response.status_code}")
            print("   Response:", response.text)
            return False
            
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT: Request took longer than 30 seconds")
        return False
        
    except requests.exceptions.ConnectionError as e:
        print(f"❌ CONNECTION ERROR: {e}")
        print("   Check your internet connection")
        return False
        
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {type(e).__name__}")
        print(f"   {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print()
    success = test_gemini_api()
    print()
    print("=" * 60)
    if success:
        print("✅ RESULT: Gemini API is working correctly!")
    else:
        print("❌ RESULT: Gemini API test failed - see errors above")
    print("=" * 60)
    print()
    
    sys.exit(0 if success else 1)
