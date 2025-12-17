"""
Test Gemini with alternative models to check quota
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

# Try different models
MODELS_TO_TEST = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash-exp",
    "gemini-pro",
]

def test_model(model_name):
    print(f"\n{'='*70}")
    print(f"Testing: {model_name}")
    print('='*70)
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GOOGLE_API_KEY}"
    
    payload = {
        "contents": [{
            "parts": [{"text": "Say 'Working!' if you receive this."}]
        }]
    }
    
    data = json.dumps(payload).encode('utf-8')
    
    try:
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
            content = result["candidates"][0]["content"]["parts"][0]["text"]
            
            print(f"✅ SUCCESS!")
            print(f"Response: {content}")
            return True
            
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP {e.code}")
        error_body = e.read().decode('utf-8')
        error_data = json.loads(error_body)
        
        if e.code == 429:
            print("   Quota exhausted for this model")
        elif e.code == 404:
            print("   Model not found/not available")
        elif e.code == 403:
            print("   Access forbidden (API key issue)")
        else:
            print(f"   Error: {error_data.get('error', {}).get('message', 'Unknown')[:100]}")
        
        return False
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    if not GOOGLE_API_KEY:
        print("❌ No API key found in .env")
        exit(1)
    
    print("="*70)
    print("TESTING MULTIPLE GEMINI MODELS")
    print("="*70)
    print(f"API Key: {GOOGLE_API_KEY[:15]}...{GOOGLE_API_KEY[-5:]}")
    
    working_models = []
    
    for model in MODELS_TO_TEST:
        if test_model(model):
            working_models.append(model)
    
    print(f"\n{'='*70}")
    print("SUMMARY")
    print('='*70)
    
    if working_models:
        print(f"✅ Working models: {', '.join(working_models)}")
    else:
        print("❌ No models working - all have quota issues or access problems")
        print("\nPossible reasons:")
        print("1. All free tier quotas exhausted for this project")
        print("2. API key needs billing enabled")
        print("3. New API key is from same project (shares quotas)")
        print("\n💡 Solution: Enable billing at https://console.cloud.google.com/billing")
