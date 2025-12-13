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

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes aggressively

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
            return f"Manus Task Started (ID: {data.get('id', 'Unknown')}). Check dashboard for results."
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

def call_ollama(prompt):
    # No Auth required normally for localhost
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "gemma3:4b", # As requested by user
        "messages": [{"role": "user", "content": prompt}],
        "stream": False
    }
    
    try:
        print(f"Sending request to Ollama (Local)...")
        # Ensure timeout is sufficient for local generation (models take time to load/gen)
        response = requests.post(
            OLLAMA_API_URL,
            headers=headers,
            json=payload,
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["message"]["content"]
        else:
            raise Exception(f"Ollama Error {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Network error communicating with Ollama: {e}")
        raise Exception(f"Ollama Unreachable (Is it running?): {str(e)}")

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
    providers = ["gemini", "openai", "grok", "deepseek", "llama", "ollama", "zhipu"] # Skip manus for now due to complexity
    
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
    MAX_CONTEXT_CHARS = 100000
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
    You are an expert academic and professional writer. 
    Role: Write a comprehensive {data.get('style', 'professional')} document about "{topic}".
    Tone: {tone}
    
    {context_str}

    Instructions:
    1. **Format**: Return ONLY the **inner HTML body content**. 
       - DO NOT include `<html>`, `<head>`, or `<body>` tags. 
       - DO NOT wrap in markdown code blocks (no ```).
    2. **Content Structure**: 
       - **Minimize Bullet Points**: Prefer detailed, well-written paragraphs for "Narrative Flow". Only use lists when absolutely necessary for sequential steps or distinct data points.
       - **NO Empty List Items**: Ensure every `<li>` contains text.
       - **Professional Indexing**: Use `<ol>` only for numbered priorities/steps. Use `<ul>` for non-ordered items.
    3. **Tags**:
       - `<h1>` for Main Title.
       - `<h2>` for Sections.
       - `<h3>` for Subsections.
       - `<p>` for paragraphs.
    4. **References**:
       - Include a **"References"** section at the end.
       - **Strict Rule**: Cite the documents provided in the context using the Author/Title metadata found at the start of each document block. 
       - If no author is listed, use "Anonymous".
     
    Specific Requirements:
    { " - CREATE A COMPARISON TABLE: Isolate key data points and present them in a standard HTML <table> with <thead> and <tbody>." if include_table else "" }
    { " - GENERATE A MERMAID DIAGRAM: Create a flowchart or sequence diagram using Mermaid syntax code block (```mermaid ... ```) to visualize the structure or process." if include_mermaid else "" }
    { " - TABLE OF CONTENTS: Include a Table of Contents at the beginning, linking to the sections." if include_toc else "" }
    
    Content Topic:
    {topic}
    """

    provider = data.get("modelProvider", "gemini")

    try:
        content = generate_ai_response(prompt, provider)
        return jsonify({"content": content})
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

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)
