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
# Models configuration
# Reverting to Gemini Flash Latest (Most Stable) as requested
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"

def call_gemini(prompt):
    if not GOOGLE_API_KEY:
        raise Exception("GOOGLE_API_KEY not set")
        
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
    retry_delay = 5 

    for attempt in range(max_retries):
        try:
            response = requests.post(
                f"{GEMINI_API_URL}?key={GOOGLE_API_KEY}",
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                break
                
            elif response.status_code == 429:
                print(f"Rate Limit (429). Attempt {attempt+1}/{max_retries}")
                time.sleep(retry_delay)
                retry_delay *= 2
                        
            elif response.status_code >= 500:
                 print(f"Server Error {response.status_code}. Retrying...")
                 time.sleep(retry_delay)
            else:
                print(f"Gemini Error: {response.status_code} - {response.text}")
                # Don't retry client errors
                raise Exception(f"API Error: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"Network error: {e}")
            time.sleep(retry_delay)

    else:
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

        if filename.lower().endswith('.pdf'):
            try:
                reader = PyPDF2.PdfReader(save_path)
                # extracting text from all pages
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        file_text += extracted + "\n"

                # Heuristic for abstract: First 500 chars or text between "Abstract" and "Introduction"
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
                    file_text = "\n".join([para.text for para in doc.paragraphs])
                    abstract_summary = file_text[:300].strip() + "..."
                except Exception as e:
                    print(f"Error reading DOCX {filename}: {e}")
                    file_text += f"[Error processing DOCX: {e}]\n"
                    abstract_summary = "Error processing DOCX."
            else:
                 file_text += "[DOCX support disabled on server]\n"
                 abstract_summary = "DOCX processing disabled."

        # Simple metadata construction
        year = "2024" # Mock year or extract regex
        author = "Unknown Author" # Mock
        citation = f"{author} ({year}). *{original_filename}*. Retrieved from WordAssistantAI."

        doc_metadata = {
            "name": original_filename,
            "citation": citation,
            "summary": abstract_summary,
            "size": os.path.getsize(save_path),
            "url": file_url # Add URL for direct access if needed
        }
        uploaded_docs_metadata.append(doc_metadata)

        if file_text:
            new_text_content += f"\n--- Document: {original_filename} ---\n{file_text}"

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
            
        response_text = call_gemini(prompt)
        return jsonify({"reply": response_text})
    except Exception as e:
        error_msg = str(e)
        status_code = 500
        if "Status 429" in error_msg:
            status_code = 429
            
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
       - Include a **"References"** section at the end with mock academic citations.
       - Use <b>bold</b> for key concepts.
     
    Specific Requirements:
    { " - CREATE A COMPARISON TABLE: Isolate key data points and present them in a standard HTML <table> with <thead> and <tbody>." if include_table else "" }
    { " - GENERATE A MERMAID DIAGRAM: Create a flowchart or sequence diagram using Mermaid syntax code block (```mermaid ... ```) to visualize the structure or process." if include_mermaid else "" }
    { " - TABLE OF CONTENTS: Include a Table of Contents at the beginning, linking to the sections." if include_toc else "" }
    
    Content Topic:
    {topic}
    """

    try:
        content = call_gemini(prompt)
        return jsonify({"content": content})
    except Exception as e:
        error_msg = str(e)
        status_code = 500
        if "Status 429" in error_msg:
            status_code = 429
            
        response = jsonify({"error": error_msg})
        response.status_code = status_code
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000, debug=True)
