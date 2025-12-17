import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image as ImageIcon, Send, Loader, ChevronDown, ChevronRight, X, Gift, BookOpen, GraduationCap, Search, UserPlus, Bot, User, Save, Trash2, LayoutTemplate, Library, Newspaper, MessageSquare } from 'lucide-react';
import './AgentSidebar.css';
import { generateContent, getModelStatus } from '@/features/ai/api/aiService';
import { uploadFiles } from '@/features/document/api/documentService';

const PRESET_AGENTS = [
    {
        id: 'gift-card',
        name: 'Graphic Designer Agent',
        icon: 'Gift',
        prompt: `You are a WORLD-CLASS Graphic Designer specializing in digital cards with RICH VISUAL ELEMENTS. Create STUNNING designs with illustrations, patterns, and decorative elements.

CRITICAL OUTPUT RULES:
1. Generate RAW HTML with INLINE CSS (NO markdown, NO \`\`\`html blocks)
2. Start DIRECTLY with <div style="...">
3. Use INLINE SVG for illustrations (Santa, trees, snowflakes, etc.)
4. Include decorative borders, patterns, and visual elements
5. Make it VISUALLY RICH and PROFESSIONAL

DESIGN CAPABILITIES:
✨ SVG Illustrations: Create custom drawings (Santa, snowmen, trees, gifts, etc.)
🎨 Patterns & Textures: Use SVG patterns for backgrounds
🖼️ Decorative Borders: Ornate frames and borders
⭐ Icons & Symbols: Stars, snowflakes, hearts, ribbons
🌈 Gradients & Colors: Rich, harmonious color palettes

REQUIRED STRUCTURE:
<div style="width: 700px; background: linear-gradient(...); padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); font-family: 'Georgia', serif; position: relative;">
  
  <!-- SVG Illustration Example -->
  <svg width="200" height="200" style="margin: 20px auto; display: block;">
    <!-- Draw Santa, snowflakes, trees, etc. using SVG paths -->
    <circle cx="100" cy="80" r="40" fill="#ffd4d4"/> <!-- Santa's face -->
    <circle cx="85" cy="75" r="5" fill="#000"/> <!-- Eye -->
    <circle cx="115" cy="75" r="5" fill="#000"/> <!-- Eye -->
    <path d="M 80 95 Q 100 105 120 95" stroke="#000" fill="none" stroke-width="2"/> <!-- Smile -->
    <!-- Add hat, body, etc. -->
  </svg>

  <!-- Decorative border pattern -->
  <div style="position: absolute; top: 0; left: 0; right: 0; height: 10px; background: repeating-linear-gradient(90deg, #ff0000 0px, #ff0000 20px, #00ff00 20px, #00ff00 40px);"></div>

  <h1 style="color: white; font-size: 48px; text-align: center; text-shadow: 3px 3px 6px rgba(0,0,0,0.3); margin: 20px 0;">Merry Christmas!</h1>
  
  <p style="color: rgba(255,255,255,0.95); font-size: 20px; text-align: center; line-height: 1.8;">Wishing you joy and happiness!</p>

  <!-- Decorative snowflakes using Unicode -->
  <div style="position: absolute; top: 20px; right: 20px; font-size: 30px; opacity: 0.7;">❄️ ⭐ ❄️</div>
</div>

VISUAL ELEMENTS TO USE:
- SVG shapes: circles, rectangles, paths for custom illustrations
- Patterns: stripes, dots, snowflakes
- Borders: ornate frames, decorative edges
- Symbols: ❄️ 🎄 🎁 ⭐ 🎅 🔔 🕯️
- Gradients: radial, linear, multi-stop
- Shadows: box-shadow, text-shadow for depth

Remember: Create VISUALLY RICH designs with ACTUAL ILLUSTRATIONS using SVG. NO explanations, just beautiful HTML!`,
        color: '#ec4899'
    },
    {
        id: 'poster',
        name: 'Poster Agent',
        icon: 'LayoutTemplate',
        prompt: "You are a Graphic Design Specialist focused on Posters. Create high-impact, visual descriptions for posters. Suggest bold typography, color palettes, and layout structures. Provide HTML/CSS prototypes for digital posters/flyers. Focus on hierarchy and visual appeal.",
        color: '#f59e0b'
    },
    {
        id: 'comic-book',
        name: 'Comic Book Agent',
        icon: 'MessageSquare',
        prompt: "You are a Comic Book Script Writer. Format your output as a professional comic script. Use 'Panel 1:', 'Panel 2:' structure. Describe visual action, camera angles, and character expressions vividly. Separate dialogue clearly: 'CHARACTER: (emotion) Dialogue'.",
        color: '#8b5cf6'
    },
    {
        id: 'book-author',
        name: 'Book Author Agent',
        icon: 'Library',
        prompt: "You are a Professional Book Author. Assist with outlining chapters, developing plot arcs, and writing long-form content. Focus on structure, pacing, and thematic consistency. If asked to write a chapter, ensure it flows logically from previous context.",
        color: '#6366f1'
    },
    {
        id: 'newspaper',
        name: 'Newspaper Agent',
        icon: 'Newspaper',
        prompt: "You are a Journalist. Write in a classic newspaper style: objective, inverted pyramid structure (most important info first). Use catchy headlines and subheadings. Maintain a neutral, informative tone suitable for a broad audience.",
        color: '#64748b'
    },
    {
        id: 'literature',
        name: 'Literature Agent',
        icon: 'BookOpen',
        prompt: "You are a Creative Writing Assistant. Your style is evocative, descriptive, and engaging. Focus on narrative flow, character development, and sensory details. Improve prose to be more literary.",
        color: '#d946ef'
    },
    {
        id: 'academic',
        name: 'Academic Agent',
        icon: 'GraduationCap',
        prompt: "You are an Academic Research Assistant. Your responses must be formal, objective, and well-structured. Use academic vocabulary. When making claims, cite plausible sources or indicate where citations are needed. Format output for research papers (APA style if not specified).",
        color: '#3b82f6'
    },
    {
        id: 'research',
        name: 'Research Agent',
        icon: 'Search',
        prompt: "You are a Research Analyst. extracting key insights, data points, and factual information. Be concise, bullet-point heavy, and focus on accuracy and data synthesis. Avoid fluff.",
        color: '#10b981'
    }
];

const IconMap = {
    Gift, BookOpen, GraduationCap, Search, UserPlus, Bot, User, LayoutTemplate, Library, Newspaper, MessageSquare
};

const AgentSidebar = ({ onInsertContent, onAddReference, sessionId, modelProvider, setModelProvider }) => {
    const [modelStatuses, setModelStatuses] = useState({});

    useEffect(() => {
        getModelStatus().then(statuses => setModelStatuses(statuses));
    }, []);

    const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'references'

    const [expandedSections, setExpandedSections] = useState({
        documents: true,
        images: true,
        commands: true,
        agents: true // New section
    });

    const [documents, setDocuments] = useState([]);
    const [images, setImages] = useState([]);
    const [command, setCommand] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [expandedDocs, setExpandedDocs] = useState({});

    // Agent selection state (internal - not using props)
    const [activeAgentId, setActiveAgentId] = useState('gift-card');

    const [customAgents, setCustomAgents] = useState(() => {
        const saved = localStorage.getItem('custom_agents');
        return saved ? JSON.parse(saved) : [];
    });
    const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
    const [newAgent, setNewAgent] = useState({ name: '', prompt: '' });

    // Save custom agents
    useEffect(() => {
        localStorage.setItem('custom_agents', JSON.stringify(customAgents));
    }, [customAgents]);

    const activeAgent = [...PRESET_AGENTS, ...customAgents].find(a => a.id === activeAgentId) || PRESET_AGENTS[0];

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

    // Image generation status
    const [generationStatus, setGenerationStatus] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    // ... (Existing document toggle and upload logic omitted for brevity, keeping it intact in actual merge if not touching) ...
    // Wait, replacing the whole file means I need to keep the logic. I will re-paste the logic carefully.

    // RE-INSTATING HELPER FUNCTIONS
    const toggleDocExpansion = async (index) => {
        setExpandedDocs(prev => {
            const newState = { ...prev, [index]: !prev[index] };
            return newState;
        });

        if (!expandedDocs[index]) {
            const doc = documents[index];
            if (!doc.detailedSummary) {
                try {
                    setDocuments(prev => {
                        const newDocs = [...prev];
                        newDocs[index] = { ...newDocs[index], isLoadingSummary: true };
                        return newDocs;
                    });

                    const { generateSummary } = await import('@/features/document/api/documentService');
                    const summary = await generateSummary(doc.name, modelProvider);

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
            setError("Session not ready. Please wait...");
            return;
        }
        if (files.length === 0) return;
        setIsProcessing(true);
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
                if (onAddReference) onAddReference(match[0]);
            }
        });
    };

    const [streamingContent, setStreamingContent] = useState('');

    const handleGenerate = async () => {
        if (!command.trim()) return;
        if (!sessionId) {
            setError("Session not initialized. Please refresh.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setStreamingContent('');

        try {
            const API_BASE = 'http://localhost:8000';

            // Standard agent prompt - NO image generation
            const finalPrompt = `[SYSTEM: ${activeAgent.prompt}]\n\n[USER REQUEST: ${command}]`;

            setGenerationStatus('Streaming response...');

            const response = await fetch(`${API_BASE}/api/stream_chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': sessionId
                },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    modelProvider: modelProvider,
                    options: generationOptions
                })
            });

            if (!response.ok) throw new Error(`Streaming failed: ${response.statusText}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.type === 'chunk') {
                            accumulatedText += json.content;
                            setStreamingContent(prev => prev + json.content);
                        } else if (json.type === 'replace') {
                            accumulatedText = json.content;
                            setStreamingContent(json.content);
                        } else if (json.type === 'error') {
                            throw new Error(json.error);
                        }
                    } catch (e) { }
                }
            }

            if (onInsertContent && accumulatedText.trim()) {
                onInsertContent(accumulatedText);
            }

            setGenerationStatus('');
        } catch (err) {
            console.error('Generation failed:', err);
            setError(err.message || "An error occurred during generation.");
            setGenerationStatus('');
        } finally {
            setIsProcessing(false);
            setIsGeneratingImage(false);
        }
    };

    const handleCreateAgent = () => {
        if (!newAgent.name || !newAgent.prompt) return;
        const agent = {
            id: `custom-${Date.now()}`,
            name: newAgent.name,
            icon: 'Bot',
            prompt: newAgent.prompt,
            color: '#64748b'
        };
        setCustomAgents(prev => [...prev, agent]);
        setActiveAgentId(agent.id);
        setIsAgentModalOpen(false);
        setNewAgent({ name: '', prompt: '' });
    };

    const handleDeleteAgent = (e, id) => {
        e.stopPropagation();
        if (window.confirm("Delete this agent?")) {
            setCustomAgents(prev => prev.filter(a => a.id !== id));
            if (activeAgentId === id) setActiveAgentId('gift-card');
        }
    };

    return (
        <div className="agent-sidebar">
            <div className="sidebar-header">
                <h2>AI Assistant</h2>
                <p className="sidebar-subtitle">
                    Acting as: <strong style={{ color: activeAgent.color }}>{activeAgent.name}</strong>
                </p>
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

                    {/* AGENT SELECTOR */}
                    <div className="agent-selector-section">
                        <div className="section-header" onClick={() => toggleSection('agents')}>
                            <Bot size={16} />
                            <span>Select Agent</span>
                            {expandedSections.agents ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                        {expandedSections.agents && (
                            <div className="agent-grid">
                                {[...PRESET_AGENTS, ...customAgents].map(agent => {
                                    const Icon = IconMap[agent.icon] || Bot;
                                    return (
                                        <div
                                            key={agent.id}
                                            className={`agent-card ${activeAgentId === agent.id ? 'active' : ''}`}
                                            onClick={() => setActiveAgentId(agent.id)}
                                            style={{ '--agent-color': agent.color, cursor: 'pointer' }}
                                        >
                                            <div className="agent-icon" style={{ backgroundColor: agent.color }}>
                                                <Icon size={18} color="white" />
                                            </div>
                                            <span className="agent-name">{agent.name}</span>
                                            {agent.id.startsWith('custom-') && (
                                                <button className="delete-agent-btn" onClick={(e) => handleDeleteAgent(e, agent.id)}>
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                                <div className="agent-card create-new" onClick={() => setIsAgentModalOpen(true)}>
                                    <div className="agent-icon" style={{ backgroundColor: '#e2e8f0' }}>
                                        <UserPlus size={18} color="#64748b" />
                                    </div>
                                    <span className="agent-name">Create Agent</span>
                                </div>
                            </div>
                        )}
                    </div>

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
                                {images.length > 0 && (
                                    <div className="image-previews">
                                        {images.map((img, idx) => (
                                            <div key={idx} className="mini-preview">Image {idx + 1}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Model Selector */}
                    <div style={{ marginBottom: '16px', padding: '0 16px', marginTop: '16px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                            AI Backend
                        </label>
                        <select
                            value={modelProvider}
                            onChange={(e) => setModelProvider(e.target.value)}
                            className="model-select"
                        >
                            <option value="ollama">🖥️ Ollama (Local)</option>
                            <option value="gemini">✨ Google Gemini</option>
                            <option value="openai">🤖 OpenAI (GPT-4)</option>
                        </select>
                    </div>

                    {/* Command Input */}
                    <div className="command-area">
                        <textarea
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            onPaste={handlePaste}
                            placeholder={`Ask ${activeAgent.name} to write something...`}
                            disabled={isProcessing}
                        />

                        {/* Report Generation Options - Only for Academic Agent */}
                        {activeAgentId === 'academic' && (
                            <div className="generation-options">
                                <span className="options-label">📊 Report Options:</span>
                                <div className="options-grid">
                                    <label className="option-checkbox">
                                        <input type="checkbox" checked={generationOptions.includeTable} onChange={() => toggleOption('includeTable')} />
                                        <span>Comparison Table</span>
                                    </label>
                                    <label className="option-checkbox">
                                        <input type="checkbox" checked={generationOptions.includeMermaid} onChange={() => toggleOption('includeMermaid')} />
                                        <span>Mermaid Diagram</span>
                                    </label>
                                    <label className="option-checkbox">
                                        <input type="checkbox" checked={generationOptions.includeToC} onChange={() => toggleOption('includeToC')} />
                                        <span>Table of Contents</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="action-buttons">
                            {isProcessing ? (
                                <button className="generate-btn loading-gradient" disabled style={{ cursor: 'wait', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Loader className="spin" size={18} />
                                    <span>{activeAgent.name} is Writing...</span>
                                </button>
                            ) : (
                                <button className="generate-btn" onClick={handleGenerate} disabled={!command.trim() || !modelProvider}>
                                    <span className="sparkle-icon">✨</span> Generate Draft
                                </button>
                            )}
                        </div>

                        {isProcessing && (
                            <div className="streaming-status" style={{ marginTop: '10px', fontSize: '0.8rem', color: '#64748b' }}>
                                Generating content... (Output will appear in editor)
                            </div>
                        )}

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

            {activeTab === 'references' && (
                // ... Reference Tab Implementation (Identical to before) ...
                <div className="sidebar-content references-tab">
                    <h3>Uploaded References (APA 7)</h3>
                    {documents.length === 0 ? (
                        <p className="empty-state">No documents uploaded yet.</p>
                    ) : (
                        <div className="references-list">
                            {documents.map((doc, idx) => (
                                <div key={idx} className="reference-item">
                                    <div className="reference-header" onClick={() => toggleDocExpansion(idx)}>
                                        <span className="apa-text">{doc.citation || `Author, A.A. (${new Date().getFullYear()}). *${doc.name}*.`}</span>
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
            )}

            {/* Bottom Status Bar */}
            <div className="model-selector-footer" style={{ padding: '12px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>ACTIVE MODEL</label>
                <div style={{ fontSize: '0.85rem', color: '#334155' }}>{modelProvider === 'ollama' ? 'Ollama (Local)' : modelProvider === 'gemini' ? 'Google Gemini' : 'OpenAI'}</div>
                <div style={{
                    position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)',
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: modelStatuses[modelProvider] === 'ok' ? '#22c55e' : (modelStatuses[modelProvider] ? '#ef4444' : '#94a3b8'),
                    boxShadow: '0 0 0 2px white'
                }} title="System Status" />
            </div>

            {/* CREATE AGENT MODAL */}
            {isAgentModalOpen && (
                <div className="agent-modal-overlay">
                    <div className="agent-modal">
                        <h3>Create New Agent</h3>
                        <div className="modal-field">
                            <label>Agent Name</label>
                            <input
                                value={newAgent.name}
                                onChange={e => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Pirate Captain"
                            />
                        </div>
                        <div className="modal-field">
                            <label>System Prompt / Persona</label>
                            <textarea
                                value={newAgent.prompt}
                                onChange={e => setNewAgent(prev => ({ ...prev, prompt: e.target.value }))}
                                placeholder="You are a..."
                                rows={5}
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setIsAgentModalOpen(false)}>Cancel</button>
                            <button className="save-btn" onClick={handleCreateAgent} disabled={!newAgent.name || !newAgent.prompt}>
                                <Save size={16} /> Create Agent
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentSidebar;
