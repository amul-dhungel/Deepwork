import React, { useState } from 'react';
import { Plus, FileText, BookOpen } from 'lucide-react';
import './PageNavigator.css';

const PageNavigator = ({ pageCount, activePage, onAddPage, onDeletePage, onNavigate, references = [] }) => {
    const [activeTab, setActiveTab] = useState('pages');

    return (
        <div className="page-navigator">
            {/* Tabs */}
            <div className="nav-tabs">
                <button
                    className={`nav-tab ${activeTab === 'pages' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pages')}
                    title="Pages"
                >
                    <FileText size={16} />
                </button>
                <button
                    className={`nav-tab ${activeTab === 'references' ? 'active' : ''}`}
                    onClick={() => setActiveTab('references')}
                    title="References"
                >
                    <BookOpen size={16} />
                </button>
            </div>

            {/* Pages View */}
            {activeTab === 'pages' && (
                <div className="page-list">
                    {Array.from({ length: pageCount }, (_, idx) => (
                        <React.Fragment key={idx}>
                            <div
                                className={`page-thumb ${idx === activePage ? 'active' : ''}`}
                                onClick={() => onNavigate(idx)}
                            >
                                <div className="page-preview">
                                    <span className="page-number">{idx + 1}</span>
                                </div>
                            </div>

                            {/* Translucent + icon below each page */}
                            <button
                                className="add-page-icon"
                                onClick={onAddPage}
                                title="Add page after this"
                            >
                                <Plus size={14} />
                            </button>
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* References View */}
            {activeTab === 'references' && (
                <div className="reference-list">
                    <div className="reference-header">
                        <h3>References</h3>
                        <p className="reference-subtitle">From uploaded documents</p>
                    </div>
                    {references.length === 0 ? (
                        <div className="empty-references">
                            <BookOpen size={32} />
                            <p>No references yet</p>
                            <small>Upload documents to extract citations</small>
                        </div>
                    ) : (
                        <div className="references">
                            {references.map((ref, idx) => (
                                <div key={idx} className="reference-item">
                                    <span className="ref-number">[{idx + 1}]</span>
                                    <p className="ref-text">{ref}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PageNavigator;
