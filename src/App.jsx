import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/UI/Header';
import PageNavigator from './components/UI/PageNavigator';
import RichTextEditor from './components/Editor/RichTextEditor';
import AgentSidebar from './components/AI/AgentSidebar';
import { generateUUID } from './utils/helpers';
import { useTypewriter } from './hooks/useTypewriter';
import './App.css';

function App() {
  const [content, setContent] = useState(`
    <h1>Page 1</h1>
    <p>Start writing your document here...</p>
  `);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const [references, setReferences] = useState([]);

  // Session Management
  const [sessionId, setSessionId] = useState(null);

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
    const breaks = (newContent.match(/<hr class="page-break"/g) || []).length;
    setPageCount(breaks + 1);
  };

  const handleAgentInsert = (text) => {
    typeContent(text);
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
            />
          </div>

          <div className="sidebar-wrapper">
            <AgentSidebar
              onInsertContent={handleAgentInsert}
              onAddReference={handleAddReference}
              sessionId={sessionId}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;

