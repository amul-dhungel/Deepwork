import React, { useState } from 'react';
import { Upload, FileText, Image as ImageIcon, Send, Loader, ChevronDown, ChevronRight, X } from 'lucide-react';
import './AgentSidebar.css';
import { uploadFiles, generateContent } from '../../services/api';

const AgentSidebar = ({ onInsertContent, onAddReference, sessionId }) => {
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

    const toggleDocExpansion = (index) => {
        setExpandedDocs(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
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
                tone: 'informative'
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
                                                <h4>Abstract / Summary</h4>
                                                <p>{doc.summary || "No abstract available for this document. Content is used for AI generation."}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }
        </div>
    );
};

export default AgentSidebar;
