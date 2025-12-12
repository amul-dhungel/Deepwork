// Document management utilities

export const saveDocument = (title, content, metadata = {}) => {
    const doc = {
        id: Date.now().toString(),
        title,
        content,
        metadata: {
            ...metadata,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            wordCount: content.split(/\s+/).length,
        }
    };

    // Save to localStorage
    const documents = getAllDocuments();
    documents.push(doc);
    localStorage.setItem('aiword_documents', JSON.stringify(documents));

    return doc;
};

export const updateDocument = (id, updates) => {
    const documents = getAllDocuments();
    const index = documents.findIndex(doc => doc.id === id);

    if (index !== -1) {
        documents[index] = {
            ...documents[index],
            ...updates,
            metadata: {
                ...documents[index].metadata,
                ...updates.metadata,
                updatedAt: new Date().toISOString()
            }
        };
        localStorage.setItem('aiword_documents', JSON.stringify(documents));
        return documents[index];
    }

    return null;
};

export const loadDocument = (id) => {
    const documents = getAllDocuments();
    return documents.find(doc => doc.id === id);
};

export const getAllDocuments = () => {
    const stored = localStorage.getItem('aiword_documents');
    return stored ? JSON.parse(stored) : [];
};

export const deleteDocument = (id) => {
    const documents = getAllDocuments();
    const filtered = documents.filter(doc => doc.id !== id);
    localStorage.setItem('aiword_documents', JSON.stringify(filtered));
};

// Export to different formats
export const exportToHTML = (content) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
    }
    p {
      margin-bottom: 1em;
    }
    ul, ol {
      margin-bottom: 1em;
      padding-left: 2em;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5em;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
  `.trim();

    return html;
};

export const exportToMarkdown = (htmlContent) => {
    // Simple HTML to Markdown conversion
    let markdown = htmlContent
        .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
        .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
        .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
        .replace(/<h4>(.*?)<\/h4>/g, '#### $1\n')
        .replace(/<h5>(.*?)<\/h5>/g, '##### $1\n')
        .replace(/<h6>(.*?)<\/h6>/g, '###### $1\n')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<b>(.*?)<\/b>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')
        .replace(/<i>(.*?)<\/i>/g, '*$1*')
        .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
        .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<li>(.*?)<\/li>/g, '- $1\n')
        .replace(/<\/?ul>/g, '')
        .replace(/<\/?ol>/g, '')
        .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)');

    return markdown.trim();
};

export const exportToText = (htmlContent) => {
    // Strip all HTML tags
    const text = htmlContent
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<\/p>/g, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();

    return text;
};

export const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportDocument = (content, title, format = 'html') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `${title || 'document'}_${timestamp}`;

    switch (format) {
        case 'html':
            downloadFile(exportToHTML(content), `${baseFilename}.html`, 'text/html');
            break;
        case 'markdown':
            downloadFile(exportToMarkdown(content), `${baseFilename}.md`, 'text/markdown');
            break;
        case 'txt':
            downloadFile(exportToText(content), `${baseFilename}.txt`, 'text/plain');
            break;
        default:
            console.error('Unsupported format:', format);
    }
};

export default {
    saveDocument,
    updateDocument,
    loadDocument,
    getAllDocuments,
    deleteDocument,
    exportToHTML,
    exportToMarkdown,
    exportToText,
    exportDocument,
    downloadFile
};
