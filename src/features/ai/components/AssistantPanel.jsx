import { useState } from 'react';
import { X, Sparkles, FileText, BookOpen, Palette, Wand2, Upload } from 'lucide-react';
import ReportGenerator from './ReportGenerator';
import ReferenceManager from './ReferenceManager';
import DesignSuggestions from './DesignSuggestions';
import FileUpload from './FileUpload';
import './AssistantPanel.css';

const AssistantPanel = ({ isOpen, onClose, onInsertContent, onApplyDesign }) => {
    const [activeTab, setActiveTab] = useState('context');

    if (!isOpen) return null;

    const tabs = [
        { id: 'context', label: 'Context', icon: Upload }, // New Tab First
        { id: 'report', label: 'Generate Report', icon: FileText },
        { id: 'references', label: 'References', icon: BookOpen },
        { id: 'design', label: 'Design', icon: Palette },
    ];

    return (
        <>
            <div className="panel-overlay" onClick={onClose}></div>
            <div className="assistant-panel slide-in-right">
                <div className="panel-header">
                    <div className="panel-title">
                        <Sparkles className="panel-icon gradient-text" size={24} />
                        <h2>AI Assistant</h2>
                    </div>
                    <button className="btn-icon" onClick={onClose} aria-label="Close panel">
                        <X size={20} />
                    </button>
                </div>

                <div className="panel-tabs">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="panel-content">
                    {activeTab === 'context' && (
                        <FileUpload onUploadComplete={(result) => console.log('Files uploaded:', result)} />
                    )}
                    {activeTab === 'report' && (
                        <ReportGenerator onGenerate={onInsertContent} />
                    )}
                    {activeTab === 'references' && (
                        <ReferenceManager onInsertCitation={onInsertContent} />
                    )}
                    {activeTab === 'design' && (
                        <DesignSuggestions onApplyDesign={onApplyDesign} />
                    )}
                </div>
            </div>
        </>
    );
};

export default AssistantPanel;
