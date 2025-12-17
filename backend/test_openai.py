"""
Test OpenAI API with the provided key
"""
import os
import json
import urllib.request
import urllib.error

def get_api_key():
    """Read OpenAI API key from .env file"""
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('OPENAI_API_KEY'):
                    return line.split('=', 1)[1].strip().strip('"').strip("'")
    except:
        pass
    return None

OPENAI_API_KEY = get_api_key()
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

def test_openai():
    print("="*70)
    print("OPENAI API TEST")
    print("="*70)
    
    if not OPENAI_API_KEY:
        print("❌ ERROR: OPENAI_API_KEY not found in .env file")
        return False
    
    print(f"✓ API Key found: {OPENAI_API_KEY[:20]}...{OPENAI_API_KEY[-10:]}")
    print(f"✓ Testing model: gpt-4o-mini (fast & cost-effective)")
    print()
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "user", "content": "Say 'OpenAI API is working!' if you receive this."}
        ],
        "temperature": 0.7
    }
    
    data = json.dumps(payload).encode('utf-8')
    
    print("🔄 Sending test request to OpenAI...")
    print()
    
    try:
        req = urllib.request.Request(
            OPENAI_API_URL,
            data=data,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {OPENAI_API_KEY}'
            }
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            print("✅ SUCCESS! OpenAI API is working")
            print()
            
            content = result["choices"][0]["message"]["content"]
            
            print("📝 OpenAI Response:")
            print("-"*70)
            print(content)
            print("-"*70)
            print()
            
            print("📊 Response Details:")
            print(f"   - Model: {result.get('model')}")
            print(f"   - Tokens Used: {result.get('usage', {}).get('total_tokens', 'N/A')}")
            print(f"   - Finish Reason: {result['choices'][0].get('finish_reason')}")
            
            return True
            
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP ERROR: {e.code}")
        error_body = e.read().decode('utf-8')
        print()
        print("Error Details:")
        print(error_body)
        print()
        
        if e.code == 401:
            print("💡 Unauthorized - API key is invalid")
        elif e.code == 429:
            print("💡 Rate limit exceeded or quota exhausted")
        elif e.code == 400:
            print("💡 Bad request - check payload format")
        
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
    success = test_openai()
    print()
    print("="*70)
    if success:
        print("✅ RESULT: OpenAI API is WORKING PERFECTLY!")
        print("   You can now use OpenAI in your application.")
    else:
        print("❌ RESULT: OpenAI API test FAILED")
        print("   Check error details above.")
    print("="*70)
