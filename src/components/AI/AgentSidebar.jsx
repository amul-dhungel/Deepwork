import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, Send, Loader, ChevronDown, ChevronRight, X } from 'lucide-react';
import './AgentSidebar.css';
import { uploadFiles, generateContent, getModelStatus } from '../../services/api';

const AgentSidebar = ({ onInsertContent, onAddReference, sessionId, modelProvider, setModelProvider }) => {
    const [modelStatuses, setModelStatuses] = useState({});

    useEffect(() => {
        getModelStatus().then(statuses => setModelStatuses(statuses));
    }, []);

    const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'references'

    const [expandedSections, setExpandedSections] = useState({
        documents: true,
        images: true,
        commands: true
    });

    const [documents, setDocuments] = useState([]);
    const [images, setImages] = useState([]);
    const [command, setCommand] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [expandedDocs, setExpandedDocs] = useState({});

    const [generationOptions, setGenerationOptions] = useState({
        includeTable: false,
        includeMermaid: false,
        includeToC: false
    });

    const toggleOption = (opt) => {
        setGenerationOptions(prev => ({
            ...prev,
            [opt]: !prev[opt]
        }));
    };

    const toggleDocExpansion = async (index) => {
        // Toggle expansion
        setExpandedDocs(prev => {
            const newState = { ...prev, [index]: !prev[index] };
            return newState;
        });

        // If expanding and no detailed summary exists, fetch it
        if (!expandedDocs[index]) { // Check if we are expanding (state update is async, so check inverted or current)
            // Wait, logic above toggles it strictly. The state update hasn't happened yet in this closure if we used function update? 
            // Actually, `expandedDocs` here is the *current* state before update. So if it WAS false (closed), we are opening it.
            // So `!expandedDocs[index]` is true means we are opening.

            const doc = documents[index];
            // Only fetch if we don't have it and we are opening
            if (!doc.detailedSummary) {
                try {
                    // Update UI to show loading state
                    setDocuments(prev => {
                        const newDocs = [...prev];
                        newDocs[index] = { ...newDocs[index], isLoadingSummary: true };
                        return newDocs;
                    });



                    // Dynamic import to avoid circular dependency issues if any, or just standard import usage
                    const { generateSummary } = await import('../../services/api');
                    const summary = await generateSummary(doc.name, modelProvider);

                    // Update doc with real summary
                    setDocuments(prev => {
                        const newDocs = [...prev];
                        newDocs[index] = {
                            ...newDocs[index],
                            summary: summary,
                            detailedSummary: true,
                            isLoadingSummary: false
                        };
                        return newDocs;
                    });
                } catch (err) {
                    console.error("Failed to summarize", err);
                    setDocuments(prev => {
                        const newDocs = [...prev];
                        newDocs[index] = {
                            ...newDocs[index],
                            isLoadingSummary: false,
                            summary: "Failed to load summary. " + err.message
                        };
                        return newDocs;
                    });
                }
            }
        }
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleFileDrop = async (e, type) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        await handleUpload(files, type);
    };

    const handleFileSelect = async (e, type) => {
        const files = Array.from(e.target.files);
        await handleUpload(files, type);
    };

    const handlePaste = async (e) => {
        const items = e.clipboardData.items;
        const pastedFiles = [];

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (file) pastedFiles.push(file);
            }
        }

        if (pastedFiles.length > 0) {
            e.preventDefault();
            if (!expandedSections.images) toggleSection('images');
            await handleUpload(pastedFiles, 'images');
        }
    };

    const handleUpload = async (files, type) => {
        if (!sessionId) {
            console.error("No session ID initialized.");
            setError("Session not ready. Please wait...");
            return;
        }

        if (files.length === 0) return;

        setIsProcessing(true); // Reuse loader for uploads too
        setError(null);

        try {
            const data = await uploadFiles(files);

            if (data.status === 'success') {
                if (type === 'images' && data.images) {
                    setImages(prev => [...prev, ...data.images]);
                } else {
                    if (data.documents) {
                        setDocuments(prev => [...prev, ...data.documents]);
                    } else {
                        // Fallback
                        const newDocs = files.map(f => ({ name: f.name, size: f.size }));
                        setDocuments(prev => [...prev, ...newDocs]);
                    }

                    if (data.text && onAddReference) {
                        extractReferences(data.text);
                    }
                }
            } else {
                throw new Error(data.error || 'Upload failed unknown reason');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            setError("Failed to upload files. please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const extractReferences = (text) => {
        const patterns = [
            /\[(\d+)\]\s+([^\n]+)/g,
            /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+\((\d{4})\)/g
        ];

        patterns.forEach(pattern => {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                if (onAddReference) {
                    onAddReference(match[0]);
                }
            }
        });
    };

    const handleGenerate = async () => {
        if (!command.trim()) return;
        if (!sessionId) {
            setError("Session not initialized. Please refresh.");
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const payload = {
                topic: command,
                purpose: 'user command',
                options: generationOptions,
                key_points: [],
                style: 'professional',
                tone: 'informative',
                modelProvider: modelProvider
            };

            const data = await generateContent(payload);

            if (data.content && onInsertContent) {
                onInsertContent(data.content);
            } else if (data.error) {
                throw new Error(data.error);
            } else {
                throw new Error("No content received from specific generation task.");
            }

            setCommand('');
        } catch (err) {
            console.error('Generation failed:', err);
            const msg = err.response?.data?.error || err.message || "An error occurred during generation.";
            setError(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="agent-sidebar">
            <div className="sidebar-header">
                <h2>AI Assistant</h2>
                <p className="sidebar-subtitle" style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Research & Writing Partner</p>
            </div>
            <div className="sidebar-tabs">
                <button
                    className={`tab-btn ${activeTab === 'compose' ? 'active' : ''}`}
                    onClick={() => setActiveTab('compose')}
                >
                    Compose
                </button>
                <button
                    className={`tab-btn ${activeTab === 'references' ? 'active' : ''}`}
                    onClick={() => setActiveTab('references')}
                >
                    References
                </button>
            </div>

            {activeTab === 'compose' && (
                <div className="sidebar-content scrollable-content">
                    {/* File Upload Area */}
                    <div
                        className={`upload-zone ${expandedSections.documents ? 'expanded' : ''}`}
                        onDrop={(e) => handleFileDrop(e, 'documents')}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <div className="section-header" onClick={() => toggleSection('documents')}>
                            <FileText size={16} />
                            <span>Context Documents</span>
                            {expandedSections.documents ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>

                        {expandedSections.documents && (
                            <div className="upload-content">
                                <input
                                    type="file"
                                    id="doc-upload"
                                    multiple
                                    accept=".pdf,.docx,.txt"
                                    onChange={(e) => handleFileSelect(e, 'documents')}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="doc-upload" className="upload-placeholder">
                                    <Upload size={24} />
                                    <p>Drop PDFs/DOCX here or click to browse</p>
                                    <small>{documents.length} files attached</small>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Image Upload Area */}
                    <div
                        className={`upload-zone ${expandedSections.images ? 'expanded' : ''}`}
                        onDrop={(e) => handleFileDrop(e, 'images')}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <div className="section-header" onClick={() => toggleSection('images')}>
                            <ImageIcon size={16} />
                            <span>Visual Context</span>
                            {expandedSections.images ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>

                        {expandedSections.images && (
                            <div className="upload-content">
                                <input
                                    type="file"
                                    id="img-upload"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handleFileSelect(e, 'images')}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="img-upload" className="upload-placeholder">
                                    <Upload size={24} />
                                    <p>Drop Images provided here</p>
                                    <small>{images.length} images attached</small>
                                </label>
                                {/* Preview Images */}
                                {images.length > 0 && (
                                    <div className="image-previews">
                                        {images.map((img, idx) => (
                                            <div key={idx} className="mini-preview">
                                                Image {idx + 1}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Command Input */}
                    <div className="command-area">
                        <textarea
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            onPaste={handlePaste}
                            placeholder="Describe what you want to write..."
                            disabled={isProcessing}
                        />

                        {/* Generation Options */}
                        <div className="generation-options">
                            <span className="options-label">Include in Draft:</span>
                            <div className="options-grid">
                                <label className="option-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={generationOptions.includeTable}
                                        onChange={() => toggleOption('includeTable')}
                                    />
                                    <span>Comparison Table</span>
                                </label>
                                <label className="option-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={generationOptions.includeMermaid}
                                        onChange={() => toggleOption('includeMermaid')}
                                    />
                                    <span>Mermaid Diagram</span>
                                </label>
                                <label className="option-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={generationOptions.includeToC}
                                        onChange={() => toggleOption('includeToC')}
                                    />
                                    <span>Table of Contents</span>
                                </label>
                            </div>
                        </div>

                        <button
                            className="generate-btn"
                            onClick={handleGenerate}
                            disabled={isProcessing || !command.trim()}
                        >
                            {isProcessing ? <Loader className="spin" /> : <Send size={18} />}
                            {isProcessing ? 'Generating...' : 'Generate Draft'}
                        </button>

                        {/* Error Message Display */}
                        {error && (
                            <div className="error-message" style={{ marginTop: '10px', padding: '10px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '0.9em' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <X size={16} style={{ cursor: 'pointer' }} onClick={() => setError(null)} />
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {
                activeTab === 'references' && (
                    <div className="sidebar-content references-tab">
                        <h3>Uploaded References (APA 7)</h3>
                        {documents.length === 0 ? (
                            <p className="empty-state">No documents uploaded yet.</p>
                        ) : (
                            <div className="references-list">
                                {documents.map((doc, idx) => (
                                    <div key={idx} className="reference-item">
                                        <div
                                            className="reference-header"
                                            onClick={() => toggleDocExpansion(idx)}
                                        >
                                            <span className="apa-text">
                                                {doc.citation || `Author, A.A. (${new Date().getFullYear()}). *${doc.name}*.`}
                                            </span>
                                            {expandedDocs[idx] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </div>

                                        {expandedDocs[idx] && (
                                            <div className="reference-abstract">
                                                <h4>AI Summary</h4>
                                                {doc.isLoadingSummary ? (
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                                        <Loader className="spin" size={14} /> Generating comprehensive summary...
                                                    </div>
                                                ) : (
                                                    <p>{doc.summary || "No abstract available for this document."}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }
            {/* Bottom Model Selector */}
            <div className="model-selector-footer" style={{
                padding: '12px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc'
            }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                    ACTIVE MODEL
                </label>
                <div className="custom-select-wrapper" style={{ position: 'relative' }}>
                    <select
                        value={modelProvider}
                        onChange={(e) => setModelProvider(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            paddingRight: '30px', /* space for icon */
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.9rem',
                            color: '#334155',
                            outline: 'none',
                            backgroundColor: 'white',
                            appearance: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="gemini">Google Gemini 2.0 {modelStatuses['gemini'] !== 'ok' && '(Limited)'}</option>
                        <option value="openai">OpenAI GPT-4o {modelStatuses['openai'] !== 'ok' && '(Limited)'}</option>
                        <option value="deepseek">DeepSeek V3 {modelStatuses['deepseek'] !== 'ok' && '(Limited)'}</option>
                        <option value="llama">Llama 3 (Groq) {modelStatuses['llama'] !== 'ok' && '(Limited)'}</option>
                        <option value="grok">Grok (xAI) {modelStatuses['grok'] !== 'ok' && '(Limited)'}</option>
                        <option value="zhipu">Zhipu AI (GLM-4) {modelStatuses['zhipu'] !== 'ok' && '(Limited)'}</option>
                        <option value="ollama">Ollama (Local) {modelStatuses['ollama'] !== 'ok' && '(Offline)'}</option>
                        <option value="manus">Manus AI</option>
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} />

                    {/* Status Dot */}
                    <div style={{
                        position: 'absolute',
                        right: '30px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: modelStatuses[modelProvider] === 'ok' ? '#22c55e' : (modelStatuses[modelProvider] ? '#ef4444' : '#94a3b8'),
                        boxShadow: '0 0 0 2px white'
                    }} title={
                        !modelStatuses[modelProvider] ? "Checking..." :
                            modelStatuses[modelProvider] === 'ok' ? "System Operational" :
                                modelStatuses[modelProvider] === 'offline' ? "System Offline (Connection Refused)" :
                                    modelStatuses[modelProvider] === 'quota_exceeded' ? "Quota Exceeded (Free Tier Limit)" :
                                        modelStatuses[modelProvider] === 'usage_limit' ? "Insufficient Balance (Add Credits)" :
                                            modelStatuses[modelProvider] === 'no_credits' ? "No Credits / Permission Denied" :
                                                "System Error"
                    } />
                </div>
                {modelStatuses[modelProvider] && modelStatuses[modelProvider] !== 'ok' && (
                    <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>
                            {modelStatuses[modelProvider] === 'offline' && "🔌 System Offline (Start App)"}
                            {modelStatuses[modelProvider] === 'quota_exceeded' && "⚠️ Quota Exceeded (Wait 24h)"}
                            {modelStatuses[modelProvider] === 'usage_limit' && "💳 Insufficient Balance"}
                            {modelStatuses[modelProvider] === 'no_credits' && "💳 No Credits Available"}
                            {modelStatuses[modelProvider] === 'missing_key' && "🔑 API Key Missing"}
                            {modelStatuses[modelProvider] === 'error' && "❌ Error Checking Status"}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentSidebar;
