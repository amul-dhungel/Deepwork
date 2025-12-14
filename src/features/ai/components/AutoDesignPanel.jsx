import { useState, useEffect } from 'react';
import { Wand2, X, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { getSmartDesignRecommendations, autoFormatDocument } from '@/utils/smartDesignAI';
import './AutoDesignPanel.css';

const AutoDesignPanel = ({ content, onApplyFormat, isVisible }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [docType, setDocType] = useState('general');
    const [quality, setQuality] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showPanel, setShowPanel] = useState(false);

    useEffect(() => {
        if (content && content.length > 100) {
            analyzeDocument();
        }
    }, [content]);

    const analyzeDocument = async () => {
        setIsAnalyzing(true);
        try {
            const analysis = await getSmartDesignRecommendations(content);
            setRecommendations(analysis.recommendations);
            setDocType(analysis.docType);
            setQuality(analysis.quality);

            // Show panel if there are high-priority recommendations
            const hasHighPriority = analysis.recommendations.some(r => r.priority === 'high');
            if (hasHighPriority && !showPanel) {
                setShowPanel(true);
            }
        } catch (error) {
            console.error('Error analyzing document:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleApplyRecommendation = (action) => {
        const formatted = autoFormatDocument(content);
        onApplyFormat(formatted.suggestedFormat);
        setShowPanel(false);
    };

    const handleOneClickFormat = () => {
        const formatted = autoFormatDocument(content);
        onApplyFormat(formatted.suggestedFormat);
        setShowPanel(false);
    };

    if (!isVisible || recommendations.length === 0) return null;

    const getQualityColor = () => {
        if (!quality) return 'var(--text-secondary)';
        if (quality.score >= 90) return '#10b981';
        if (quality.score >= 75) return '#3b82f6';
        if (quality.score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    const getIcon = (icon) => {
        switch (icon) {
            case 'wand': return Wand2;
            case 'alert-circle': return AlertCircle;
            case 'check-circle': return CheckCircle;
            default: return Sparkles;
        }
    };

    return (
        <div className={`auto-design-panel ${showPanel ? 'visible' : 'collapsed'}`}>
            {showPanel ? (
                <>
                    <div className="panel-header">
                        <div className="panel-title">
                            <Sparkles className="gradient-text" size={20} />
                            <h3>Smart Design Assistant</h3>
                        </div>
                        <button
                            className="btn-icon"
                            onClick={() => setShowPanel(false)}
                            aria-label="Close"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="panel-content">
                        {quality && (
                            <div className="quality-score card">
                                <div className="score-header">
                                    <span className="score-label">Design Quality</span>
                                    <span
                                        className="score-value"
                                        style={{ color: getQualityColor() }}
                                    >
                                        {quality.score}/100
                                    </span>
                                </div>
                                <div className="score-grade" style={{ color: getQualityColor() }}>
                                    {quality.grade}
                                </div>
                            </div>
                        )}

                        <div className="recommendations-list">
                            {recommendations.map((rec, index) => {
                                const Icon = getIcon(rec.icon);
                                return (
                                    <div
                                        key={index}
                                        className={`recommendation-item ${rec.priority}`}
                                    >
                                        <div className="rec-icon">
                                            <Icon size={18} />
                                        </div>
                                        <div className="rec-content">
                                            <h4>{rec.title}</h4>
                                            <p>{rec.description}</p>
                                        </div>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleApplyRecommendation(rec.action)}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            className="btn btn-primary one-click-btn"
                            onClick={handleOneClickFormat}
                        >
                            <Wand2 size={18} />
                            Make it Professional
                        </button>

                        {quality && quality.suggestions.length > 0 && (
                            <div className="suggestions-box">
                                <h4>💡 Suggestions</h4>
                                <ul>
                                    {quality.suggestions.slice(0, 3).map((suggestion, index) => (
                                        <li key={index}>{suggestion}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <button
                    className="collapsed-trigger"
                    onClick={() => setShowPanel(true)}
                >
                    <Wand2 size={16} />
                    <span>{recommendations.length} design suggestions</span>
                </button>
            )}
        </div>
    );
};

export default AutoDesignPanel;
