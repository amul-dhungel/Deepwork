
import React, { useState, useEffect, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import "@excalidraw/excalidraw/index.css";
import { X, Save } from 'lucide-react';
import './ExcalidrawModal.css';

export default function ExcalidrawModal({
    initialElements = [],
    initialFiles = {},
    isOpen,
    onClose,
    onSave
}) {
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);

    // Update scene when modal opens
    useEffect(() => {
        if (isOpen && excalidrawAPI) {
            excalidrawAPI.updateScene({
                elements: initialElements || [],
                appState: {
                    ...excalidrawAPI.getAppState(),
                    isLoading: false,
                }
            });

            if (initialFiles) {
                excalidrawAPI.addFiles(Object.values(initialFiles));
            }
        }
    }, [isOpen, excalidrawAPI, initialElements, initialFiles]);

    const handleSave = useCallback(() => {
        if (!excalidrawAPI) return;
        const elements = excalidrawAPI.getSceneElements();
        const files = excalidrawAPI.getFiles();
        onSave(elements, files);
        onClose();
    }, [excalidrawAPI, onSave, onClose]);

    if (!isOpen) return null;

    return (
        <div className="excalidraw-modal-overlay">
            <div className="excalidraw-modal-content">
                <div className="excalidraw-modal-header">
                    <h3>Excalidraw Editor</h3>
                    <div className="excalidraw-modal-actions">
                        <button className="btn-secondary" onClick={onClose} title="Cancel">
                            <X size={18} /> Cancel
                        </button>
                        <button className="btn-primary" onClick={handleSave} title="Save">
                            <Save size={18} /> Save Diagram
                        </button>
                    </div>
                </div>
                <div className="excalidraw-canvas-wrapper">
                    <Excalidraw
                        excalidrawAPI={(api) => setExcalidrawAPI(api)}
                        initialData={{
                            elements: initialElements,
                            files: initialFiles,
                            appState: { viewBackgroundColor: "#ffffff" }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
