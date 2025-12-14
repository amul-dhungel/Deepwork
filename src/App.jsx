import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/layout/Header';
import PageNavigator from './features/document/components/PageNavigator';
import RichTextEditor from './features/editor/components/RichTextEditor';
import AgentSidebar from './features/ai/components/AgentSidebar';
import { generateUUID } from './utils/helpers';
import { useTypewriter } from './features/editor/hooks/useTypewriter';
import './App.css';

function App() {
  const [content, setContent] = useState(`
    <div class="page-node">
      <h1>Page 1</h1>
      <p>Start writing your document here...</p>
    </div>
  `);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const [references, setReferences] = useState([]);

  // Session Management
  const [sessionId, setSessionId] = useState(null);

  // AI Model Provider State
  const [modelProvider, setModelProvider] = useState('gemini');

  useEffect(() => {
    let storedSession = localStorage.getItem('word_ai_session_id');
    if (!storedSession) {
      storedSession = generateUUID();
      localStorage.setItem('word_ai_session_id', storedSession);
    }
    setSessionId(storedSession);
  }, []);

  const editorRef = useRef(null);
  const { typeContent, cancelTyping, isTyping } = useTypewriter(editorRef);

  const handleContentChange = (newContent) => {
    setContent(newContent);
    // Count number of <div class="page-node"> or <page> in the output
    // Tiptap exportHTML usually outputs the renderHTML tag.
    // Let's count the occurrences of class="page-node"
    const pages = (newContent.match(/class="page-node"/g) || []).length;
    setPageCount(pages || 1);
  };

  const handleAgentInsert = (text) => {
    // Direct Lexical Markdown Parsing as requested
    if (editorRef.current && editorRef.current.insertMarkdown) {
      editorRef.current.insertMarkdown(text);
    } else { // Fallback to typeContent directly as typewriterRef is not defined
      typeContent(text);
    };
  };

  const handleAddPage = () => {
    if (editorRef.current) {
      editorRef.current.insertPageBreak();
      setPageCount(prev => prev + 1);
    }
  };

  const handleDeletePage = (pageIndex) => {
    if (pageCount <= 1) return;

    const confirmed = window.confirm(`Delete page ${pageIndex + 1}?`);
    if (confirmed && editorRef.current) {
      setPageCount(prev => Math.max(1, prev - 1));
    }
  };

  const handleNavigate = (pageIndex) => {
    setActivePage(pageIndex);
  };

  const handleAddReference = (ref) => {
    setReferences(prev => [...prev, ref]);
  };

  return (
    <ThemeProvider>
      <div className="app-container">
        <Header />
        <div className="main-content">
          <PageNavigator
            pageCount={pageCount}
            activePage={activePage}
            onAddPage={handleAddPage}
            onDeletePage={handleDeletePage}
            onNavigate={handleNavigate}
            references={references}
          />

          <div className="editor-workspace">
            <RichTextEditor
              ref={editorRef}
              content={content}
              onChange={handleContentChange}
              modelProvider={modelProvider}
            />
          </div>

          <div className="sidebar-wrapper">
            <AgentSidebar
              onInsertContent={handleAgentInsert}
              onAddReference={handleAddReference}
              sessionId={sessionId}
              modelProvider={modelProvider}
              setModelProvider={setModelProvider}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;

