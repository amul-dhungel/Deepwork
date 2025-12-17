from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from dotenv import load_dotenv
import requests
import PyPDF2
try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False
    print("Warning: python-docx not installed. DOCX support disabled.")
from io import BytesIO
import time
import uuid
from werkzeug.utils import secure_filename
import concurrent.futures
import hmac
import hashlib
import base64
import json

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Import image generation service
try:
    from services.image_service import get_image_service
    HAS_IMAGE_SERVICE = True
except ImportError as e:
    print(f"Warning: Image service not available: {e}")
    HAS_IMAGE_SERVICE = False

app = Flask(__name__)
# Enable CORS manually to handle all cases robustly
# CORS(app) # Disable Flask-CORS to avoid conflicts

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
    else:
        response.headers['Access-Control-Allow-Origin'] = '*'
        
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Session-ID, Access-Control-Allow-Credentials'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

# Handle preflight requests explicitly
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    response = jsonify({'status': 'ok'})
    # Headers set by after_request
    return response

# Config
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Global simple session store (InMemory for now)
sessions = {}

def get_session(session_id):
    """Retrieve or create a session object."""
    if session_id not in sessions:
        sessions[session_id] = {
            "context": "",
            "images": [],
            "docs": [],
            "created_at": time.time()
        }
    return sessions[session_id]

# Removed premature app.run

# Models configuration
# Using verifiable available model
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# openai_client removed - using requests directly

GROK_API_KEY = os.getenv("GROK_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY")
# Placeholder for Llama (e.g. via Groq)
LLAMA_API_KEY = os.getenv("LLAMA_API_KEY", "")

# API Endpoints
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
GROK_API_URL = "https://api.x.ai/v1/chat/completions"
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
LLAMA_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MANUS_API_URL = "https://api.manus.ai/v1/tasks"
OLLAMA_API_URL = "http://localhost:11434/api/chat"
ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"



def call_gemini(prompt):
    if not GOOGLE_API_KEY:
        print("CRITICAL ERROR: GOOGLE_API_KEY is missing from environment variables.")
        raise Exception("GOOGLE_API_KEY not set. Please check your .env file.")
        
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    # Retry configuration
    max_retries = 3
    retry_delay = 2 

    for attempt in range(max_retries):
        try:
            print(f"Sending request to Gemini (Attempt {attempt+1})...")
            response = requests.post(
                f"{GEMINI_API_URL}?key={GOOGLE_API_KEY}",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                print("Gemini API request successful.")
                break
                
            elif response.status_code == 429:
                # Check for hard quota limit vs temporary rate limit
                error_body = response.text.lower()
                if "resource_exhausted" in error_body or "quota" in error_body:
                    print("CRITICAL: Gemini API Quota Exceeded.")
                    raise Exception("Quota Exceeded: Your Google Gemini API key has reached its usage limit. Please check your billing or wait 24 hours.")
                
                print(f"Rate Limit (429). Waiting {retry_delay}s...")
                time.sleep(retry_delay)
                retry_delay *= 2
                        
            elif response.status_code >= 500:
                 print(f"Server Error {response.status_code}. Retrying...")
                 time.sleep(retry_delay)
            else:
                print(f"Gemini API Error: {response.status_code} - {response.text}")
                # Don't retry client errors
                raise Exception(f"API Error {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"Network error communicating with Gemini: {e}")
            time.sleep(retry_delay)

    else:
         print("All retries failed.")
         raise Exception("Service unavailable after retries (Rate Limit or Network).")
        
    data = response.json()
    try:
        content = data["candidates"][0]["content"]["parts"][0]["text"]
        
        # 1. Strip Markdown Code Blocks
        import re
        content = re.sub(r'^```[a-zA-Z]*\n', '', content.strip()) 
        content = re.sub(r'\n```$', '', content.strip())
        
        # 2. Strip HTML/Body wrappers
        if "<body>" in content:
            content = content.split("<body>")[1]
            if "</body>" in content:
                content = content.split("</body>")[0]
        
        # Fallback cleanup
        content = content.replace("<html>", "").replace("</html>", "")
        content = content.replace("<!DOCTYPE html>", "")
            
        return content.strip()
    except (KeyError, IndexError):
        raise Exception("Invalid response format from Gemini API")

def call_openai(prompt, model="gpt-4o-mini"):
    if not OPENAI_API_KEY:
        raise Exception("OpenAI API Key not configured.")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {OPENAI_API_KEY}"
    }
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    
    try:
        print(f"Sending request to OpenAI ({model})...")
        response = requests.post(
            OPENAI_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            raise Exception(f"OpenAI Error {response.status_code}: {response.text}")
            
            
    except requests.exceptions.RequestException as e:
        print(f"Network error communicating with OpenAI: {e}")
        raise Exception(f"OpenAI Network Error: {str(e)}")

def call_grok(prompt):
    if not GROK_API_KEY:
        raise Exception("Grok API Key not configured.")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROK_API_KEY}"
    }
    
    payload = {
        "model": "grok-beta", 
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "temperature": 0.7
    }
    
    try:
        print(f"Sending request to Grok...")
        response = requests.post(
            GROK_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            raise Exception(f"Grok Error {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Network error communicating with Grok: {e}")
        raise Exception(f"Grok Network Error: {str(e)}")

def call_manus(prompt):
    MANUS_API_KEY = os.getenv("MANUS_API_KEY")
    if not MANUS_API_KEY:
         raise Exception("Manus API Key not found in environment.")

    headers = {
        "API_KEY": MANUS_API_KEY, 
        "Content-Type": "application/json",
        "accept": "application/json"
    }
    
    payload = {
        "prompt": prompt,
        "mode": "speed" 
    }
    
    try:
        print(f"Sending request to Manus...")
        response = requests.post(
            MANUS_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"Manus API Response: {data}") # Debug logging
            task_id = data.get('id') or data.get('taskId') or data.get('task_id') or 'Unknown'
            return f"Manus Task Started (ID: {task_id}). Check dashboard for results."
        else:
            raise Exception(f"Manus Error {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Network error communicating with Manus: {e}")
        raise Exception(f"Manus Network Error: {str(e)}")

    except requests.exceptions.RequestException as e:
        print(f"Network error communicating with Manus: {e}")
        raise Exception(f"Manus Network Error: {str(e)}")

def call_deepseek(prompt):
    if not DEEPSEEK_API_KEY:
        raise Exception("DeepSeek API Key not configured.")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
    }
    
    payload = {
        "model": "deepseek-chat", 
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "temperature": 0.7
    }
    
    try:
        print(f"Sending request to DeepSeek...")
        response = requests.post(
            DEEPSEEK_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            raise Exception(f"DeepSeek Error {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Network error communicating with DeepSeek: {e}")
        raise Exception(f"DeepSeek Network Error: {str(e)}")

def call_llama(prompt):
    # Llama 3 via Groq is a common interface. Assuming Groq style or similar. 
    # Placeholder implementation if key is missing.
    if not LLAMA_API_KEY:
         raise Exception("Llama/Groq API Key not found in environment (LLAMA_API_KEY).")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {LLAMA_API_KEY}"
    }
    
    payload = {
        "model": "llama3-70b-8192", 
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    
    try:
        print(f"Sending request to Llama (Groq)...")
        response = requests.post(
            LLAMA_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            raise Exception(f"Llama Error {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Network error communicating with Llama: {e}")
        raise Exception(f"Llama Network Error: {str(e)}")

def generate_zhipu_token(apikey: str, exp_seconds: int = 600):
    try:
        id, secret = apikey.split(".")
    except Exception as e:
        raise Exception("Invalid Zhipu API Key format.")

    payload = {
        "api_key": id,
        "exp": int(round(time.time() * 1000)) + exp_seconds * 1000,
        "timestamp": int(round(time.time() * 1000)),
    }

    headers_jwt = {
        "alg": "HS256",
        "sign_type": "SIGN"
    }
    
    def b64url(data):
        return base64.urlsafe_b64encode(data).rstrip(b'=')

    segments = []
    segments.append(b64url(json.dumps(headers_jwt).encode('utf-8')))
    segments.append(b64url(json.dumps(payload).encode('utf-8')))
    
    signing_input = b'.'.join(segments)
    signature = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
    
    segments.append(b64url(signature))
    return b'.'.join(segments).decode('utf-8')

def call_zhipu(prompt):
    if not ZHIPU_API_KEY:
        raise Exception("Zhipu API Key not configured.")
    
    token = generate_zhipu_token(ZHIPU_API_KEY)
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "glm-4-flash", # Often free/unlimited
        "messages": [{"role": "user", "content": prompt}],
        "stream": False
    }
    
    try:
        print(f"Sending request to Zhipu...")
        response = requests.post(
            ZHIPU_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            raise Exception(f"Zhipu Error {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Network error communicating with Zhipu: {e}")
        raise Exception(f"Zhipu Network Error: {str(e)}")

def call_ollama(prompt, stream=False):
    # No Auth required normally for localhost
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-v3.1:671b-cloud",  # Deep model for detailed, comprehensive responses
        "messages": [{"role": "user", "content": prompt}],
        "stream": stream
    }
    
    try:
        print(f"Sending request to Ollama (Local) [Stream={stream}]...")
        # Ensure timeout is sufficient for local generation (models take time to load/gen)
        # For streaming, we use stream=True in requests
        response = requests.post(
            OLLAMA_API_URL,
            headers=headers,
            json=payload,
            timeout=120,
            stream=stream
        )
        
        if response.status_code == 200:
            if stream:
                 # Generator for streaming
                 for line in response.iter_lines():
                    if line:
                        decoded_line = line.decode('utf-8')
                        try:
                            json_obj = json.loads(decoded_line)
                            if 'message' in json_obj and 'content' in json_obj['message']:
                                yield json_obj['message']['content']
                            if json_obj.get('done', False):
                                break
                        except json.JSONDecodeError:
                            continue
            else:
                data = response.json()
                return data["message"]["content"]
        else:
            raise Exception(f"Ollama Error {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Network error communicating with Ollama: {e}")
        raise Exception(f"Ollama Unreachable (Is it running?): {str(e)}")

def generate_ai_response_stream(prompt, provider="gemini"):
    """
    Generator function that streams response text chunks.
    Currently only implemented for Ollama/DeepSeek.
    """
    if provider == "ollama" or provider == "deepseek":
         return call_ollama(prompt, stream=True)
    elif provider == "mock":
         # Mock stream for testing
         def mock_generator():
             import time
             words = "This is a simulated streaming response from the backend.".split()
             for word in words:
                 time.sleep(0.1)
                 yield word + " "
         return mock_generator()
    else:
        # Fallback for non-streaming providers: wait and yield once
        full_text = generate_ai_response(prompt, provider)
        def one_shot_gen():
            yield full_text
        return one_shot_gen()

# Unified generator
def generate_ai_response(prompt, provider="gemini"):
    if provider == "openai":
        return call_openai(prompt)
    elif provider == "grok":
        return call_grok(prompt)
    elif provider == "manus":
        return call_manus(prompt)
    elif provider == "deepseek":
        return call_deepseek(prompt)
    elif provider == "llama":
        return call_llama(prompt)
    elif provider == "ollama":
        return call_ollama(prompt)
    elif provider == "zhipu":
        return call_zhipu(prompt)
    else:
        return call_gemini(prompt)

def check_provider_status(provider_name):
    """Test a provider with a minimal prompt to check for auth/quota errors."""
    try:
        if provider_name == "gemini":
             # Use a very short timeout for check
             # Gemini doesn't have a cheap 'check' endpoint easily without valid payload, 
             # but we can try a dry run or minimal gen.
             # Actually, best to just return 'ok' if we don't assume state, 
             # but user specifically wants to know about Credit Limits.
             # We must try a generation.
             call_gemini("Hi")
        elif provider_name == "openai":
             call_openai("Hi")
        elif provider_name == "grok":
             call_grok("Hi")
        elif provider_name == "manus":
             # Manus requires task, might be expensive/slow. 
             # Maybe skip or just check if Key is present?
             if not os.getenv("MANUS_API_KEY"): raise Exception("No Key")
        elif provider_name == "deepseek":
             call_deepseek("Hi")
        elif provider_name == "llama":
             call_llama("Hi")
        elif provider_name == "ollama":
             # Basic check if running
             requests.get("http://localhost:11434", timeout=2)
        elif provider_name == "zhipu":
             call_zhipu("Hi")
             
        return "ok"
    except Exception as e:
        msg = str(e)
        if "429" in msg or "Quota" in msg or "Exhausted" in msg:
             return "quota_exceeded"
        elif "402" in msg or "Insufficient Balance" in msg:
             return "usage_limit" 
        elif "403" in msg or "Permission" in msg:
             return "no_credits" 
        elif "Key" in msg and "missing" in msg:
             return "missing_key"
        elif "Connection" in msg or "refused" in msg or "Failed to establish" in msg:
             return "offline"
        return "error"

@app.route("/api/models/status", methods=["GET"])
def get_models_status():
    providers = ["gemini", "openai", "grok", "deepseek", "llama", "ollama", "zhipu", "manus"] 
    
    
    # Run checks in parallel
    results = {}
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_to_provider = {executor.submit(check_provider_status, p): p for p in providers}
        for future in concurrent.futures.as_completed(future_to_provider):
            p = future_to_provider[future]
            try:
                status = future.result()
                results[p] = status
            except Exception:
                results[p] = "error"
                
    return jsonify(results)

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok", 
        "service": "AI Word Assistant Backend (Flask + REST)",
        "active_sessions": len(sessions)
    })

@app.route("/api/generate_card_image", methods=["POST"])
def generate_card_image():
    """Generate AI image for card design"""
    if not HAS_IMAGE_SERVICE:
        return jsonify({"error": "Image generation service not available"}), 500
    
    data = request.json
    user_prompt = data.get('prompt', '')
    style = data.get('style', 'digital-art')
    
    if not user_prompt:
        return jsonify({"error": "Prompt is required"}), 400
    
    try:
        # Get image service and generate
        image_service = get_image_service()
        result = image_service.generate_image(user_prompt, style)
        
        if result.get('success'):
            return jsonify({
                'image_base64': result['image_base64'],
                'cached': result['cached'],
                'cost': result['cost']
            })
        else:
            return jsonify({
                'error': result.get('error', 'Image generation failed')
            }), 500
            
    except Exception as e:
        print(f"Image generation error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/uploads/<path:filename>')
def serve_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route("/api/upload", methods=["POST"])
def upload_files():
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        return jsonify({"error": "Missing X-Session-ID header"}), 400

    session = get_session(session_id) # Get session here

    if 'files' not in request.files:
        return jsonify({"error": "No files provided"}), 400

    files = request.files.getlist('files')
    new_text_content = ""
    new_images = []

    # New: Collect metadata for frontend references list
    uploaded_docs_metadata = []

    for file in files:
        original_filename = file.filename
        filename = secure_filename(original_filename)
        # Avoid collisions using uuid
        unique_name = f"{uuid.uuid4().hex[:8]}_{filename}"
        save_path = os.path.join(UPLOAD_FOLDER, unique_name)
        file.save(save_path)

        # File processing logic
        file_text = ""
        abstract_summary = "No abstract content detected."

        # Create URL (assuming localhost for now - in prod use actual domain)
        # Use request.host_url to be more dynamic
        base_url = request.host_url.rstrip('/')
        file_url = f"{base_url}/uploads/{unique_name}"

        # Metadata extraction
        year = "2024"
        author = "Unknown Author"
        title = filename

        if filename.lower().endswith('.pdf'):
            try:
                reader = PyPDF2.PdfReader(save_path)
                if reader.metadata:
                    if reader.metadata.get('/Author'):
                        author = reader.metadata.get('/Author')
                    if reader.metadata.get('/Title'):
                        title = reader.metadata.get('/Title')
                
                # extracting text from all pages
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        file_text += extracted + "\n"

                # Heuristic for abstract
                text_start = file_text[:2000]
                if "Abstract" in text_start:
                    parts = text_start.split("Abstract")
                    if len(parts) > 1:
                        abstract_summary = parts[1][:500].strip() + "..."
                else:
                    abstract_summary = file_text[:300].strip() + "..."

            except Exception as e:
                print(f"Error reading PDF {filename}: {e}")

        elif filename.lower().endswith('.txt'):
            try:
                with open(save_path, 'r', encoding='utf-8') as f:
                    file_text = f.read()
                    abstract_summary = file_text[:300].strip() + "..."
            except Exception as e:
                print(f"Error reading TXT {filename}: {e}")
        
        elif filename.lower().endswith('.docx'):
            if HAS_DOCX:
                try:
                    doc = Document(save_path)
                    # Extract Core Properties
                    if doc.core_properties.author:
                        author = doc.core_properties.author
                    if doc.core_properties.title:
                        title = doc.core_properties.title
                    
                    file_text = "\n".join([para.text for para in doc.paragraphs])
                    abstract_summary = file_text[:300].strip() + "..."
                except Exception as e:
                    print(f"Error reading DOCX {filename}: {e}")
                    file_text += f"[Error processing DOCX: {e}]\n"
                    abstract_summary = "Error processing DOCX."
            else:
                 file_text += "[DOCX support disabled on server]\n"
                 abstract_summary = "DOCX processing disabled."

        # Construct a real citation string to help Gemini
        citation = f"{author} ({year}). *{title}*."

        doc_metadata = {
            "name": original_filename,
            "author": author,
            "title": title,
            "citation": citation,
            "summary": abstract_summary,
            "size": os.path.getsize(save_path),
            "url": file_url 
        }
        uploaded_docs_metadata.append(doc_metadata)

        if file_text:
            # Inject metadata into the text stream so Gemini sees it right next to the content
            new_text_content += f"\n--- Start of Document ---\nMetadata: Filename='{original_filename}', Title='{title}', Author='{author}'\nContent:\n{file_text}\n--- End of Document ---\n"

        # Image handling
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
             new_images.append({
                "name": original_filename,
                "url": file_url
            })

    # Update Session
    session['context'] += new_text_content
    session['images'].extend(new_images)
    session['docs'].extend(uploaded_docs_metadata) # Store metadata in session too

    # Trim context if too large (simple optimized limit)
    # Reduced from 100k to 50k for speed
    MAX_CONTEXT_CHARS = 50000
    if len(session["context"]) > MAX_CONTEXT_CHARS:
        session["context"] = session["context"][-MAX_CONTEXT_CHARS:]
        
    return jsonify({
        "status": "success", 
        "message": f"Processed {len(files)} files",
        "context_length": len(session["context"]),
        "images": new_images,
        "documents": uploaded_docs_metadata,
        "session_id": session_id
    })

@app.route("/api/chat", methods=["POST"])
def chat_endpoint():
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        return jsonify({"error": "Missing X-Session-ID header"}), 400
        
    session = get_session(session_id)
    data = request.json
    message = data.get("message")
    
    # Use session context
    context = session.get("context", "")
    images = session.get("images", [])
    
    provider = data.get("modelProvider", "gemini")
    
    try:
        # Construct a prompt that knows about images
        image_context = "\n".join([f"Image '{img['name']}' available at: {img['url']}" for img in images])
        
        if context or image_context:
            prompt = f"""
            Context from uploaded documents:
            {context}
            
            Available Images:
            {image_context}
            
            User Question: {message}
            
            Instructions:
            - **Role**: Expert Research Assistant.
            - **Tone**: Professional, clear, and high-quality.
            - **Formatting**: Use detailed HTML.
              - `<h1>`, `<h2>` for structure.
              - `<p>` for paragraphs.
              - `<ul>/<li>` for lists.
              - `<table border="1" style="border-collapse: collapse; width: 100%;">` for data comparisons.
            - **Images**: If applicable, embed images using `<img src="URL" style="max-width:100%; height:auto;" />`.
            - **Accuracy**: Base answers strictly on the provided context if possible.
            """
        else:
            prompt = message
            
        response_text = generate_ai_response(prompt, provider)
        return jsonify({"reply": response_text})
    except Exception as e:
        error_msg = str(e)
        status_code = 500
        if "429" in error_msg or "Quota" in error_msg:
            status_code = 429
        elif "403" in error_msg:
            status_code = 403
            
        response = jsonify({"error": error_msg})
        response.status_code = status_code
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

@app.route("/api/generate", methods=["POST"])
def generate_report():
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        return jsonify({"error": "Missing X-Session-ID header"}), 400
        
    session = get_session(session_id)
    data = request.json
    
    # Extract options
    options = data.get('options', {})
    include_table = options.get('includeTable', False)
    include_mermaid = options.get('includeMermaid', False)
    include_toc = options.get('includeToC', False)
    
    topic = data.get("topic")
    purpose = data.get("purpose")
    tone = data.get("tone")
    key_points = data.get("key_points", [])

    # Construct the Prompt
    image_context = "\n".join([f"Image '{img['name']}' available at: {img['url']}" for img in session['images']])
    
    context_str = ""
    if session['context'] or image_context:
        context_str = f"\nUse these uploaded documents as context/source material:\n{session['context']}\n\nAvailable Images:\n{image_context}\n"
    
    prompt = f"""
    Act as an expert {data.get('role', 'Senior Data Analyst/Researcher')}. You are preparing a comprehensive professional report for {data.get('audience', 'Executive Stakeholders')}.

    **REPORT SPECIFICATIONS:**
    - **Primary Topic:** {topic}
    - **Core Objective:** {purpose if purpose else f"To provide a comprehensive analysis of {topic}"}
    - **Key Data/Content Requirements:** 
    {chr(10).join([f"  * {point}" for point in key_points]) if key_points else "  * Detailed analysis of key metrics\n  * Strategic insights\n  * Data-driven recommendations"}

    {context_str}

    **STRUCTURE & FORMATTING:**
    Generate a research report following this structure. 
    **Use Standard Markdown Formatting.**
    
    STRICT RESPONSE FORMATTING RULES (CRITICAL):
    1. **Output ONLY the report content.** Do not include "Here is your report" or similar.
    2. Start with `# Title`.
    3. Use `## Section` and `### Subsection`.
    4. Use `**bold**` for key terms.
    5. Use `- ` for bullet points.
    6. Use ` ```language ` for code blocks.
    7. **CRITICAL**: Insert **DOUBLE NEWLINES** between every section, paragraph, and header.

    Report Structure:
    1. **# Report Title**
    2. **## Executive Summary**
    3. **## Introduction**
    4. **## Findings & Analysis**
    5. **## Recommendations**
    6. **## Conclusion**

    **Content Requirements**:
    - Tone: {tone}
    - Perspective: Third-person professional.
    
    **SPECIAL INSTRUCTIONS:**
    { " - Include a Markdown Table for data comparison." if include_table else "" }
    { " - If asked to visualize, describe the diagram textually." if include_mermaid else "" }
    """

    provider = data.get("modelProvider", "gemini")

    try:
        response_text = generate_ai_response(prompt, provider)
        html_response = markdown_to_html(response_text)
        return jsonify({"content": html_response})
    except Exception as e:
        error_msg = str(e)
        status_code = 500
        if "429" in error_msg or "Quota" in error_msg:
            status_code = 429
        elif "403" in error_msg:
            status_code = 403
            
        response = jsonify({"error": error_msg})
        response.status_code = status_code
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

@app.route("/api/summarize", methods=["POST"])
def summarize_document():
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        return jsonify({"error": "Missing X-Session-ID header"}), 400
        
    session = get_session(session_id)
    data = request.json
    filename = data.get("filename")
    
    if not filename:
         return jsonify({"error": "Filename required"}), 400

    target_content = ""
    # Parse context to find specific document
    try:
        if session['context']:
            doc_blocks = session['context'].split("--- Start of Document ---")
            for block in doc_blocks:
                # robust check for the specific file
                if f"Filename='{filename}'" in block:
                    parts = block.split("Content:")
                    if len(parts) > 1:
                         target_content = parts[1].split("--- End of Document ---")[0]
                         break
    except Exception:
        pass

    if not target_content:
            return jsonify({"error": "Document content not found. Server may have restarted. Please re-upload your files."}), 404
            
    # Limit content for summary
    target_content = target_content[:30000] 
    
    prompt = f"""
    Task: Summarize the following academic/technical document.
    
    Instructions:
    1. Write a **comprehensive summary** (approx 3 paragraphs).
    2. Structure it precisely as:
       - **Objective**: What is the paper trying to achieve?
       - **Methodology**: How did they do it?
       - **Key Findings**: What were the results?
    3. Keep it professional and concise.
    
    Document Content:
    {target_content}
    """
    
    provider = data.get("modelProvider", "gemini")
    
    try:
        summary = generate_ai_response(prompt, provider)
        return jsonify({"summary": summary})
    except Exception as e:
        print(f"Summarization error: {e}")
        error_msg = str(e)
        status_code = 500
        if "429" in error_msg or "Quota" in error_msg:
            status_code = 429
        elif "403" in error_msg:
            status_code = 403
            
        return jsonify({"error": error_msg}), status_code

@app.route("/api/refine", methods=["POST"])
def refine_text():
    session_id = request.headers.get('X-Session-ID')
    if not session_id:
        return jsonify({"error": "Missing X-Session-ID header"}), 400
        
    data = request.json
    text = data.get("text")
    instruction = data.get("instruction")
    
    if not text or not instruction:
         return jsonify({"error": "Text and instruction required"}), 400

    prompt = f"""
    Task: Rewrite the following text based on the instruction.
    
    Instruction: {instruction}
    
    Text to Rewrite:
    "{text}"
    
    Constraints:
    - Return ONLY the rewritten text.
    - Do not add conversational filler ("Here is the rewritten text").
    - Maintain the original meaning unless asked to expand.
    """
    
    provider = data.get("modelProvider", "gemini")

    try:
        rewritten = generate_ai_response(prompt, provider)
        return jsonify({"content": rewritten})
    except Exception as e:
        print(f"Refine error: {e}")
        error_msg = str(e)
        status_code = 500
        if "429" in error_msg or "Quota" in error_msg:
            status_code = 429
        elif "403" in error_msg:
            status_code = 403
            
        return jsonify({"error": error_msg}), status_code

        return jsonify({"error": error_msg}), status_code

@app.route("/api/stream_chat", methods=["POST"])
def stream_chat():
    from flask import Response, stream_with_context
    data = request.json
    prompt = data.get("prompt")
    provider = data.get("modelProvider", "gemini")
    
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    # Enhanced formatting prompt for detailed, comprehensive responses with diagrams
    formatted_prompt = f"""
    SYSTEM INSTRUCTION: You are an expert professional writer and technical communicator.
    Your task is to create COMPREHENSIVE, DETAILED content that thoroughly addresses the user's request.
    
    CONTENT QUALITY REQUIREMENTS:
    - Be THOROUGH and DETAILED - provide in-depth explanations
    - Include relevant context, background, and examples
    - Use clear, professional language
    - Organize information logically with good flow
    - NO FILLER phrases like "Here is your report" - start directly with content
    
    FORMATTING RULES:
    1. **Markdown Structure**: Use `# Title`, `## Sections`, `### Subsections`
    2. **Lists**: Use `- Item` for unordered, `1.` for ordered
    3. **Tables**: Use markdown tables `| Col | Col |` for comparisons and data
    4. **Emphasis**: Use **bold** for key terms, *italic* for emphasis
    5. **Code**: Use `inline code` for technical terms
    
    DIAGRAMS - MULTIPLE DIAGRAMS ENCOURAGED:
    When the topic benefits from visual explanation, create MULTIPLE diagrams to show:
    - Overall architecture/system view
    - Component details
    - Process flows
    - Relationships between concepts
    
    Each diagram MUST:
    1. Output ONLY raw Excalidraw JSON - NO markdown wrappers, NO explanations
    2. Have CLEAR labels on every shape (centered inside)
    3. Use professional spacing (50px+ between elements)
    4. Use color coding: Blues (#a5d8ff) for primary, Green (#51cf66) for success/data, Yellow (#ffd43b) for warnings/highlights, Gray (#e9ecef) for secondary
    5. Be positioned separately (start each new diagram at y: 0 or y: 600+ to avoid overlap)
    
    DIAGRAM FORMAT:
    {{"type": "excalidraw", "version": 2, "source": "AI", "elements": [rectangles, ellipses, diamonds, arrows, text_labels]}}
    
    REQUIRED SHAPE PROPERTIES:
    {{"id": "shape_id", "type": "rectangle|ellipse|diamond", "x": 100, "y": 100, "width": 180, "height": 100, "angle": 0, "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeWidth": 2, "roughness": 1, "opacity": 100, "seed": 12345, "version": 1, "versionNonce": 12345, "isDeleted": false, "boundElements": null, "updated": 1, "link": null, "locked": false}}
    
    REQUIRED TEXT LABEL PROPERTIES (for all shapes):
    {{"id": "text_id", "type": "text", "x": 140, "y": 130, "width": 100, "height": 25, "angle": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "fillStyle": "solid", "strokeWidth": 1, "roughness": 0, "opacity": 100, "seed": 67890, "fontSize": 16, "fontFamily": 1, "text": "Component Name", "textAlign": "center", "verticalAlign": "middle", "baseline": 14, "version": 1, "versionNonce": 67890, "isDeleted": false, "containerId": null, "originalText": "Component Name", "lineHeight": 1.25}}
    
    CONTENT + DIAGRAMS FLOW:
    - Start with text introduction
    - Insert first diagram (overview)
    - Continue with detailed text
    - Insert additional diagrams as needed (components, flows, etc.)
    - End with summary text
    
    USER REQUEST: {prompt}
    """

    def generate():
        try:
            # First yield a "starting" signal
            yield json.dumps({"type": "start"}) + "\n"
            
            # Stream content
            for chunk in generate_ai_response_stream(formatted_prompt, provider):
                yield json.dumps({"type": "chunk", "content": chunk}) + "\n"
                
            # Final signal
            yield json.dumps({"type": "done"}) + "\n"
        except Exception as e:
            yield json.dumps({"type": "error", "error": str(e)}) + "\n"

    return Response(stream_with_context(generate()), mimetype='application/x-ndjson')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)
