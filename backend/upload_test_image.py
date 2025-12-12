import requests
import os

url = "http://localhost:8000/api/upload"
file_path = r"c:\Users\amul.dhungel\Downloads\Nishugrop\WordAssistantAI\src\assets\HERO_DTA_Architecture_v1.0.png"

if not os.path.exists(file_path):
    print(f"Error: File {file_path} not found.")
    exit(1)

with open(file_path, 'rb') as f:
    files = {'files': (os.path.basename(file_path), f, 'image/png')}
    response = requests.post(url, files=files)

print(response.status_code)
print(response.text)
