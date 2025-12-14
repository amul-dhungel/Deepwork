import { useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { generateReport } from '@/utils/aiHelpers';
import './ReportGenerator.css';

const ReportGenerator = ({ onGenerate }) => {
    const [formData, setFormData] = useState({
        topic: '',
        purpose: '',
        keyPoints: ['', '', ''],
        style: 'research',
        tone: 'formal'
    });
    const [isGenerating, setIsGenerating] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleKeyPointChange = (index, value) => {
        const newKeyPoints = [...formData.keyPoints];
        newKeyPoints[index] = value;
        setFormData(prev => ({ ...prev, keyPoints: newKeyPoints }));
    };

    const handleGenerate = async () => {
        if (!formData.topic || !formData.purpose) {
            alert('Please fill in at least the topic and purpose fields');
            return;
        }

        setIsGenerating(true);
        try {
            const content = await generateReport(formData);
            onGenerate(content);

            // Reset form
            setFormData({
                topic: '',
                purpose: '',
                keyPoints: ['', '', ''],
                style: 'research',
                tone: 'formal'
            });
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="report-generator">
            <div className="generator-intro">
                <h3>Generate Professional Reports</h3>
                <p>Provide details below and let AI create a comprehensive report for you.</p>
            </div>

            <div className="form-group">
                <label htmlFor="topic">Report Topic *</label>
                <input
                    id="topic"
                    type="text"
                    value={formData.topic}
                    onChange={(e) => handleInputChange('topic', e.target.value)}
                    placeholder="e.g., Climate Change Impact on Agriculture"
                />
            </div>

            <div className="form-group">
                <label htmlFor="purpose">Purpose *</label>
                <textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                    placeholder="Describe the main objective of this report..."
                    rows={3}
                />
            </div>

            <div className="form-group">
                <label>Key Points (Optional)</label>
                <p className="field-description">Add up to 3 key points you want to include</p>
                {formData.keyPoints.map((point, index) => (
                    <input
                        key={index}
                        type="text"
                        value={point}
                        onChange={(e) => handleKeyPointChange(index, e.target.value)}
                        placeholder={`Key point ${index + 1}`}
                    />
                ))}
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="style">Report Style</label>
                    <select
                        id="style"
                        value={formData.style}
                        onChange={(e) => handleInputChange('style', e.target.value)}
                    >
                        <option value="research">Research</option>
                        <option value="business">Business</option>
                        <option value="technical">Technical</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="tone">Tone</label>
                    <select
                        id="tone"
                        value={formData.tone}
                        onChange={(e) => handleInputChange('tone', e.target.value)}
                    >
                        <option value="formal">Formal</option>
                        <option value="casual">Casual</option>
                        <option value="academic">Academic</option>
                    </select>
                </div>
            </div>

            <button
                className="btn btn-primary generate-btn"
                onClick={handleGenerate}
                disabled={isGenerating || !formData.topic || !formData.purpose}
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="spinner-icon" size={18} />
                        Generating...
                    </>
                ) : (
                    <>
                        <Wand2 size={18} />
                        Generate Report
                    </>
                )}
            </button>
        </div>
    );
};

export default ReportGenerator;
