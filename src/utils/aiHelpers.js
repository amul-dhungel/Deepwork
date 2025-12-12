// AI Mock Response Generators

const SAMPLE_REPORTS = {
    research: {
        title: "Research Report on {topic}",
        introduction: "This comprehensive research report examines {topic}, providing an in-depth analysis of current trends, methodologies, and findings in the field. The purpose of this investigation is to {purpose}.",
        body: [
            "## Background and Context\n\nThe study of {topic} has gained significant importance in recent years. Current research indicates several key areas of development that warrant detailed examination.\n\n## Methodology\n\nThis research employs a systematic approach combining quantitative and qualitative methods to ensure comprehensive coverage of {topic}.\n\n## Key Findings\n\nOur analysis reveals several critical insights:\n\n1. **Primary Discovery**: The investigation demonstrates clear patterns that suggest {key_point_1}\n2. **Secondary Observations**: Further analysis indicates {key_point_2}\n3. **Emerging Trends**: Contemporary developments show {key_point_3}\n\n## Discussion\n\nThe findings presented above have significant implications for both theoretical understanding and practical applications. The data suggests that {topic} continues to evolve in ways that challenge conventional wisdom.\n\n## Conclusion\n\nIn conclusion, this report has examined {topic} through multiple lenses, revealing both established principles and emerging opportunities. Future research should focus on addressing the gaps identified in this analysis."
        ],
        conclusion: "This research provides valuable insights into {topic} and establishes a foundation for future investigations in this domain."
    },
    business: {
        title: "Business Analysis: {topic}",
        introduction: "This business report provides a strategic analysis of {topic} with the objective to {purpose}. Our assessment covers market dynamics, competitive landscape, and actionable recommendations.",
        body: [
            "## Executive Summary\n\n{topic} represents a significant opportunity in today's business environment. This report outlines key strategies and recommendations based on comprehensive market analysis.\n\n## Market Overview\n\nThe current market landscape for {topic} shows strong growth potential with several key drivers influencing development.\n\n## Strategic Recommendations\n\n### Implementation Priorities\n\n1. **Short-term Actions**: {key_point_1}\n2. **Medium-term Strategy**: {key_point_2}\n3. **Long-term Vision**: {key_point_3}\n\n## Risk Assessment\n\nAs with any business initiative, careful consideration of potential risks ensures robust planning and mitigation strategies.\n\n## Financial Projections\n\nBased on current market conditions and proposed strategies, we project positive outcomes aligned with stated objectives.\n\n## Conclusion and Next Steps\n\nThe opportunities presented by {topic} require decisive action and strategic investment to realize full potential."
        ],
        conclusion: "This analysis demonstrates clear pathways for success in {topic}, providing actionable insights for immediate implementation."
    },
    technical: {
        title: "Technical Documentation: {topic}",
        introduction: "This technical document provides comprehensive details on {topic}, serving to {purpose}. It includes specifications, implementation guidelines, and best practices.",
        body: [
            "## Overview\n\n{topic} is a critical component that requires careful planning and execution. This documentation provides all necessary information for successful implementation.\n\n## Technical Specifications\n\n### System Requirements\n- Detailed specifications for {topic}\n- Performance benchmarks and standards\n- Compatibility considerations\n\n### Architecture\n\nThe architecture for {topic} follows industry best practices ensuring scalability, maintainability, and performance.\n\n## Implementation Guide\n\n### Setup Process\n\n1. **Initial Configuration**: {key_point_1}\n2. **Integration Steps**: {key_point_2}\n3. **Testing and Validation**: {key_point_3}\n\n## Best Practices\n\nSuccessful implementation of {topic} requires adherence to established best practices and coding standards.\n\n## Troubleshooting\n\nCommon issues and their resolutions are documented to facilitate smooth operation and maintenance.\n\n## Conclusion\n\nThis technical documentation provides a complete reference for {topic}, supporting both initial implementation and ongoing maintenance."
        ],
        conclusion: "Following these guidelines ensures successful deployment and operation of {topic}."
    }
};

const CITATION_FORMATS = {
    apa: {
        book: "{author} ({year}). {title}. {publisher}.",
        article: "{author} ({year}). {title}. {journal}, {volume}({issue}), {pages}.",
        website: "{author} ({year}). {title}. Retrieved from {url}"
    },
    mla: {
        book: "{author}. {title}. {publisher}, {year}.",
        article: "{author}. \"{title}.\" {journal}, vol. {volume}, no. {issue}, {year}, pp. {pages}.",
        website: "{author}. \"{title}.\" {website}, {year}, {url}."
    },
    chicago: {
        book: "{author}. {title}. {publisher}, {year}.",
        article: "{author}. \"{title}.\" {journal} {volume}, no. {issue} ({year}): {pages}.",
        website: "{author}. \"{title}.\" {website}. Accessed {date}. {url}."
    },
    ieee: {
        book: "{author}, {title}. {publisher}, {year}.",
        article: "{author}, \"{title},\" {journal}, vol. {volume}, no. {issue}, pp. {pages}, {year}.",
        website: "{author}, \"{title},\" {website}, {year}. [Online]. Available: {url}"
    }
};

const DESIGN_TEMPLATES = [
    {
        id: 'professional',
        name: 'Professional',
        description: 'Clean and corporate design',
        styles: {
            fontFamily: "'Inter', sans-serif",
            fontSize: '12pt',
            lineHeight: '1.6',
            headingFont: "'Inter', sans-serif",
            colorScheme: {
                primary: '#2563eb',
                text: '#1f2937',
                background: '#ffffff'
            }
        }
    },
    {
        id: 'academic',
        name: 'Academic',
        description: 'Traditional academic style',
        styles: {
            fontFamily: "'Times New Roman', serif",
            fontSize: '12pt',
            lineHeight: '2.0',
            headingFont: "'Times New Roman', serif",
            colorScheme: {
                primary: '#000000',
                text: '#000000',
                background: '#ffffff'
            }
        }
    },
    {
        id: 'modern',
        name: 'Modern Minimal',
        description: 'Contemporary minimalist design',
        styles: {
            fontFamily: "'Inter', sans-serif",
            fontSize: '11pt',
            lineHeight: '1.5',
            headingFont: "'Inter', sans-serif",
            colorScheme: {
                primary: '#8b5cf6',
                text: '#374151',
                background: '#fafafa'
            }
        }
    },
    {
        id: 'creative',
        name: 'Creative',
        description: 'Bold and expressive design',
        styles: {
            fontFamily: "'Poppins', sans-serif",
            fontSize: '11pt',
            lineHeight: '1.7',
            headingFont: "'Poppins', sans-serif",
            colorScheme: {
                primary: '#ec4899',
                text: '#1e293b',
                background: '#ffffff'
            }
        }
    }
];

// Generate AI report content
export const generateReport = async ({ topic, purpose, keyPoints, style = 'research', tone = 'formal' }) => {
    try {
        const response = await fetch('http://localhost:8000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic,
                purpose,
                key_points: keyPoints,
                style,
                tone
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate report');
        }

        const data = await response.json();
        return data.content;
    } catch (error) {
        console.warn('Backend unavailable, falling back to mock generation:', error);

        // Fallback: Use Mock Logic
        await new Promise(resolve => setTimeout(resolve, 1500));
        const template = SAMPLE_REPORTS[style] || SAMPLE_REPORTS.research;

        let content = `# ${template.title.replace('{topic}', topic)}\n\n`;
        content += `${template.introduction.replace('{topic}', topic).replace('{purpose}', purpose)}\n\n`;

        template.body.forEach(section => {
            let processedSection = section
                .replace(/{topic}/g, topic)
                .replace(/{purpose}/g, purpose)
                .replace(/{key_point_1}/g, keyPoints[0] || 'comprehensive analysis and review')
                .replace(/{key_point_2}/g, keyPoints[1] || 'detailed examination of core principles')
                .replace(/{key_point_3}/g, keyPoints[2] || 'forward-looking recommendations');

            content += processedSection + '\n\n';
        });

        content += `\n\n${template.conclusion.replace('{topic}', topic)}`;
        return content;
    }
};

// Generate content suggestions
export const generateContentSuggestions = async (currentContent) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const suggestions = [
        {
            type: 'improvement',
            title: 'Enhance Clarity',
            description: 'Consider breaking down complex sentences for better readability',
            icon: 'lightbulb'
        },
        {
            type: 'structure',
            title: 'Add Headings',
            description: 'Organize your content with descriptive section headings',
            icon: 'layout'
        },
        {
            type: 'expansion',
            title: 'Expand Section',
            description: 'This section could benefit from additional supporting details',
            icon: 'plus-circle'
        },
        {
            type: 'citation',
            title: 'Add References',
            description: 'Consider adding citations to support your claims',
            icon: 'book-open'
        }
    ];

    return suggestions;
};

// Format citation
export const formatCitation = (reference, format = 'apa') => {
    const formatTemplate = CITATION_FORMATS[format.toLowerCase()]?.[reference.type] || CITATION_FORMATS.apa.book;

    let citation = formatTemplate;
    Object.keys(reference).forEach(key => {
        citation = citation.replace(`{${key}}`, reference[key] || '');
    });

    return citation;
};

// Generate bibliography
export const generateBibliography = (references, format = 'apa') => {
    const sorted = [...references].sort((a, b) => {
        const authorA = a.author?.split(',')[0] || '';
        const authorB = b.author?.split(',')[0] || '';
        return authorA.localeCompare(authorB);
    });

    let bibliography = '# References\n\n';
    sorted.forEach(ref => {
        bibliography += formatCitation(ref, format) + '\n\n';
    });

    return bibliography;
};

// Get design suggestions
export const getDesignSuggestions = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return DESIGN_TEMPLATES;
};

// Apply design template
export const applyDesignTemplate = (templateId) => {
    const template = DESIGN_TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    return template.styles;
};

// Calculate document statistics
export const calculateStatistics = (content) => {
    const text = content.replace(/<[^>]*>/g, '').replace(/[#*_\[\]]/g, '');
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const characters = text.replace(/\s/g, '').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length;

    const avgWordsPerSentence = sentences > 0 ? Math.round(words.length / sentences) : 0;
    const readingTime = Math.ceil(words.length / 200); // Average reading speed: 200 wpm

    return {
        words: words.length,
        characters,
        charactersNoSpaces: characters,
        sentences,
        paragraphs,
        avgWordsPerSentence,
        readingTime
    };
};

// AI-powered text improvement
export const improveText = async (text, type = 'clarity') => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const improvements = {
        clarity: `${text} This revision enhances clarity and readability.`,
        conciseness: text.split(' ').slice(0, Math.max(5, text.split(' ').length * 0.7)).join(' '),
        formality: text.replace(/don't/g, 'do not').replace(/can't/g, 'cannot'),
        expansion: `${text} Furthermore, this concept can be explored in greater depth by considering additional perspectives and implications.`
    };

    return improvements[type] || text;
};

export default {
    generateReport,
    generateContentSuggestions,
    formatCitation,
    generateBibliography,
    getDesignSuggestions,
    applyDesignTemplate,
    calculateStatistics,
    improveText
};
