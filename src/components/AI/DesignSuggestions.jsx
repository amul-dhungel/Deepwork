import { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { getDesignSuggestions } from '../../utils/aiHelpers';
import './DesignSuggestions.css';

const DesignSuggestions = ({ onApplyDesign }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const suggestions = await getDesignSuggestions();
            setTemplates(suggestions);
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyTemplate = (template) => {
        setSelectedTemplate(template.id);
        onApplyDesign(template.styles);
    };

    if (isLoading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading design templates...</p>
            </div>
        );
    }

    return (
        <div className="design-suggestions">
            <div className="suggestions-intro">
                <h3>Design Templates</h3>
                <p>Choose a professional template to style your document</p>
            </div>

            <div className="templates-grid">
                {templates.map(template => (
                    <div
                        key={template.id}
                        className={`template-card card ${selectedTemplate === template.id ? 'selected' : ''}`}
                        onClick={() => handleApplyTemplate(template)}
                    >
                        {selectedTemplate === template.id && (
                            <div className="selected-badge">
                                <Check size={16} />
                            </div>
                        )}

                        <div className="template-preview">
                            <Palette size={32} style={{ color: template.styles.colorScheme.primary }} />
                        </div>

                        <div className="template-info">
                            <h4>{template.name}</h4>
                            <p className="template-description">{template.description}</p>

                            <div className="template-details">
                                <div className="detail-item">
                                    <span className="detail-label">Font:</span>
                                    <span className="detail-value">{template.styles.fontFamily.split(',')[0].replace(/'/g, '')}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Size:</span>
                                    <span className="detail-value">{template.styles.fontSize}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Spacing:</span>
                                    <span className="detail-value">{template.styles.lineHeight}</span>
                                </div>
                            </div>

                            <div className="color-palette">
                                <div
                                    className="color-swatch"
                                    style={{ backgroundColor: template.styles.colorScheme.primary }}
                                    title="Primary color"
                                />
                                <div
                                    className="color-swatch"
                                    style={{ backgroundColor: template.styles.colorScheme.text }}
                                    title="Text color"
                                />
                                <div
                                    className="color-swatch"
                                    style={{ backgroundColor: template.styles.colorScheme.background }}
                                    title="Background color"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="design-tips card">
                <h4>💡 Design Tips</h4>
                <ul>
                    <li>Use consistent heading styles throughout your document</li>
                    <li>Choose readable fonts and appropriate sizes</li>
                    <li>Maintain proper spacing for better readability</li>
                    <li>Use colors sparingly for emphasis</li>
                </ul>
            </div>
        </div>
    );
};

export default DesignSuggestions;
