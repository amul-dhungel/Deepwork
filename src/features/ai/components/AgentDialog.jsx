import React, { useState } from 'react';
import { X, Upload, Send, File as FileIcon, Image as ImageIcon, Loader, Plus } from 'lucide-react';
import './AgentDialog.css';

const AgentDialog = ({ onInsertContent, isOpen, onClose }) => {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);

    // Drag & Drop
    const handleDrop = async (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        await uploadFiles(files);
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        await uploadFiles(files);
    };

    const uploadFiles = async (files) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.status === 'success') {
                const newFiles = files.map(f => ({ name: f.name, type: f.type }));
                setUploadedFiles(prev => [...prev, ...newFiles]);
                if (data.images && data.images.length > 0) {
                    console.log("Uploaded images:", data.images);
                }
            }
        } catch (error) {
            console.error("Upload failed:", error);
        }
    };

    const handleGenerate = async () => {
        if (!input) return;
        setIsProcessing(true);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: input,
                    purpose: "user command",
                    key_points: [],
                    style: "professional",
                    tone: "neutral"
                })
            });

            const data = await response.json();
            if (onInsertContent) {
                onInsertContent(data.content);
            }
            setInput('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="agent-dialog-container">
            <div className="agent-header">
                <h3>Page Assistant</h3>
                <button className="close-btn" onClick={onClose}><X size={16} /></button>
            </div>

            <div
                className="agent-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                {uploadedFiles.length === 0 ? (
                    <div className="drop-placeholder">
                        <Upload size={24} className="text-gray-400" />
                        <p>Drop file context here</p>
                        <small>or click to upload</small>
                    </div>
                ) : (
                    <div className="file-list">
                        {uploadedFiles.map((f, i) => (
                            <div key={i} className="file-chip">
                                {f.type.includes('image') ? <ImageIcon size={12} /> : <FileIcon size={12} />}
                                <span>{f.name}</span>
                            </div>
                        ))}
                        <button className="add-more" onClick={() => document.getElementById('dialog-upload').click()}>
                            <Plus size={14} />
                        </button>
                    </div>
                )}
                <input
                    type="file"
                    id="dialog-upload"
                    multiple
                    hidden
                    onChange={handleFileSelect}
                />
            </div>

            <div className="agent-input-area">
                <textarea
                    placeholder="Ex: 'Summarize this PDF' or 'Use the chart image here'"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
                />
                <button
                    className="send-btn"
                    onClick={handleGenerate}
                    disabled={isProcessing}
                >
                    {isProcessing ? <Loader className="spin" size={18} /> : <Send size={18} />}
                </button>
            </div>
        </div>
    );
};

export default AgentDialog;
