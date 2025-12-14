import { useState, useEffect } from 'react';
import { BarChart3, FileText, Clock, Type } from 'lucide-react';
import { calculateStatistics } from '../../utils/aiHelpers';
import './Sidebar.css';

const Sidebar = ({ content, isOpen }) => {
    const [stats, setStats] = useState({
        words: 0,
        characters: 0,
        sentences: 0,
        paragraphs: 0,
        readingTime: 0,
        avgWordsPerSentence: 0
    });

    useEffect(() => {
        if (content) {
            const newStats = calculateStatistics(content);
            setStats(newStats);
        }
    }, [content]);

    if (!isOpen) return null;

    const statItems = [
        { icon: Type, label: 'Words', value: stats.words.toLocaleString() },
        { icon: FileText, label: 'Characters', value: stats.characters.toLocaleString() },
        { icon: BarChart3, label: 'Sentences', value: stats.sentences.toLocaleString() },
        { icon: FileText, label: 'Paragraphs', value: stats.paragraphs.toLocaleString() },
        { icon: Clock, label: 'Reading Time', value: `${stats.readingTime} min` },
    ];

    return (
        <div className="stats-sidebar slide-in-right">
            <div className="sidebar-header">
                <h3>Document Statistics</h3>
            </div>

            <div className="stats-grid">
                {statItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <div key={index} className="stat-item card">
                            <div className="stat-icon">
                                <Icon size={20} />
                            </div>
                            <div className="stat-info">
                                <div className="stat-value">{item.value}</div>
                                <div className="stat-label">{item.label}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="readability-info card">
                <h4>Readability</h4>
                <div className="readability-metric">
                    <span className="metric-label">Avg. words per sentence:</span>
                    <span className="metric-value">{stats.avgWordsPerSentence}</span>
                </div>
                <p className="readability-tip">
                    {stats.avgWordsPerSentence < 15 ? '✅ Easy to read' :
                        stats.avgWordsPerSentence < 20 ? '⚠️ Moderate' :
                            '⚠️ May be hard to read - consider shorter sentences'}
                </p>
            </div>
        </div>
    );
};

export default Sidebar;
