from backend.main import markdown_to_html

sample_md = """# Title
## Section 1
This is a paragraph with **bold** text.
- Item 1
- Item 2

```python
print("Hello")
```
"""

print("--- Markdown Input ---")
print(sample_md)
print("\n--- HTML Output ---")
try:
    html = markdown_to_html(sample_md)
    print(html)
except Exception as e:
    print(f"Error: {e}")
