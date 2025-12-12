// Smart Auto-Design AI System

// Document type detection
export const detectDocumentType = (content) => {
    const text = content.toLowerCase();

    // Resume indicators
    if (text.includes('experience') && text.includes('education') && text.includes('skills')) {
        return 'resume';
    }

    // Letter indicators
    if ((text.includes('dear') || text.includes('sincerely')) && text.length < 2000) {
        return 'letter';
    }

    // Academic paper indicators
    if ((text.includes('abstract') || text.includes('introduction') || text.includes('methodology'))
        && (text.includes('conclusion') || text.includes('references'))) {
        return 'academic';
    }

    // Report indicators
    if ((text.includes('executive summary') || text.includes('overview'))
        && (text.includes('findings') || text.includes('recommendations'))) {
        return 'report';
    }

    // Business document
    if (text.includes('proposal') || text.includes('quarter') || text.includes('revenue')) {
        return 'business';
    }

    // Essay indicators
    if (text.includes('thesis') || text.includes('argument')) {
        return 'essay';
    }

    return 'general';
};

// Detect formatting opportunities with AI analysis
export const detectFormattingOpportunities = (htmlContent) => {
    const opportunities = [];

    // Parse HTML to plain text for analysis
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const lines = tempDiv.textContent.split('\n').filter(l => l.trim());

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        // Detect potential titles (short, at start, all caps or title case)
        if (index === 0 && trimmed.length < 100 && trimmed.length > 5) {
            const isAllCaps = trimmed === trimmed.toUpperCase();
            const startsWithCapital = /^[A-Z]/.test(trimmed);

            if (isAllCaps || (startsWithCapital && !trimmed.endsWith('.'))) {
                opportunities.push({
                    type: 'title',
                    line: index,
                    text: trimmed,
                    suggestion: 'Apply Title style',
                    confidence: isAllCaps ? 0.95 : 0.75,
                    action: 'title'
                });
            }
        }

        // Detect headings (short lines, title case, no period)
        if (trimmed.length < 80 && trimmed.length > 3 && !trimmed.endsWith('.')) {
            const words = trimmed.split(' ');
            const capitalizedWords = words.filter(w => /^[A-Z]/.test(w)).length;
            const ratio = capitalizedWords / words.length;

            if (ratio > 0.6 && words.length > 1 && words.length < 12) {
                opportunities.push({
                    type: 'heading',
                    line: index,
                    text: trimmed,
                    suggestion: 'Apply Heading 2 style',
                    confidence: 0.85,
                    action: 'heading2'
                });
            }
        }

        // Detect lists (starts with -, *, •, or 1., 2., etc.)
        if (/^[-*•]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
            opportunities.push({
                type: 'list',
                line: index,
                text: trimmed,
                suggestion: 'Convert to formatted list',
                confidence: 0.98,
                action: 'list'
            });
        }

        // Detect quotes (starts with " or ")
        if (/^[""]/.test(trimmed) || trimmed.includes('"')) {
            opportunities.push({
                type: 'quote',
                line: index,
                text: trimmed,
                suggestion: 'Apply blockquote style',
                confidence: 0.80,
                action: 'blockquote'
            });
        }

        // Detect code (contains multiple special chars, backticks, or code keywords)
        const codeIndicators = ['function', 'const', 'let', 'var', 'import', 'export', '{}', '()', '=>'];
        const hasCodeIndicators = codeIndicators.some(ind => trimmed.includes(ind));
        const hasBackticks = trimmed.includes('`');

        if (hasCodeIndicators || hasBackticks) {
            opportunities.push({
                type: 'code',
                line: index,
                text: trimmed,
                suggestion: 'Apply code block style',
                confidence: hasBackticks ? 0.95 : 0.70,
                action: 'codeblock'
            });
        }
    });

    return opportunities;
};

// Auto-format entire document intelligently
export const autoFormatDocument = (htmlContent) => {
    const docType = detectDocumentType(htmlContent);
    const opportunities = detectFormattingOpportunities(htmlContent);

    let formattedContent = htmlContent;

    // Apply document-type-specific formatting
    const typeFormats = {
        academic: {
            fontFamily: 'Times New Roman, serif',
            fontSize: '12pt',
            lineHeight: '2.0',
            margins: '1in',
            headingStyle: 'traditional'
        },
        business: {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11pt',
            lineHeight: '1.15',
            margins: '1in',
            headingStyle: 'bold'
        },
        resume: {
            fontFamily: 'Calibri, sans-serif',
            fontSize: '11pt',
            lineHeight: '1.15',
            margins: '0.75in',
            headingStyle: 'bold-large'
        },
        report: {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11pt',
            lineHeight: '1.5',
            margins: '1in',
            headingStyle: 'bold-color'
        },
        general: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '12pt',
            lineHeight: '1.6',
            margins: '1in',
            headingStyle: 'modern'
        }
    };

    return {
        content: formattedContent,
        docType,
        opportunities,
        suggestedFormat: typeFormats[docType] || typeFormats.general,
        autoApplied: []
    };
};

// Score document design quality
export const scoreDesignQuality = (htmlContent) => {
    let score = 100;
    const issues = [];
    const suggestions = [];

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Check for headings
    const hasH1 = tempDiv.querySelectorAll('h1').length > 0;
    const hasHeadings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;

    if (!hasHeadings) {
        score -= 20;
        issues.push('No heading structure');
        suggestions.push('Add headings to organize your content');
    }

    if (!hasH1) {
        score -= 10;
        issues.push('Missing main title');
        suggestions.push('Add a title (H1) to your document');
    }

    // Check for visual variety
    const hasBold = tempDiv.querySelectorAll('strong, b').length > 0;
    const hasItalic = tempDiv.querySelectorAll('em, i').length > 0;
    const hasLists = tempDiv.querySelectorAll('ul, ol').length > 0;

    if (!hasBold && !hasItalic) {
        score -= 15;
        issues.push('No text emphasis (bold/italic)');
        suggestions.push('Use bold or italic to emphasize key points');
    }

    if (!hasLists) {
        score -= 10;
        issues.push('No lists used');
        suggestions.push('Consider using bullet points for clarity');
    }

    // Check heading consistency
    const headings = Array.from(tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const headingLevels = headings.map(h => parseInt(h.tagName[1]));

    // Check for skipped levels (e.g., H1 -> H3)
    for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i] - headingLevels[i - 1] > 1) {
            score -= 5;
            issues.push('Inconsistent heading hierarchy');
            suggestions.push('Use heading levels sequentially (H1 → H2 → H3)');
            break;
        }
    }

    // Check paragraph length
    const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
    const longParagraphs = paragraphs.filter(p => p.textContent.split(' ').length > 150);

    if (longParagraphs.length > 0) {
        score -= 10;
        issues.push('Very long paragraphs detected');
        suggestions.push('Break up long paragraphs for better readability');
    }

    // Check for color usage (custom implementation would check actual colors)
    const hasColors = htmlContent.includes('color:') || htmlContent.includes('background');
    if (!hasColors) {
        score -= 5;
        suggestions.push('Consider adding subtle colors for visual interest');
    }

    return {
        score: Math.max(0, score),
        grade: score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Needs Improvement',
        issues,
        suggestions,
        hasHeadings,
        hasVisualVariety: hasBold || hasItalic || hasLists
    };
};

// Generate smart design recommendations
export const getSmartDesignRecommendations = async (content) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const docType = detectDocumentType(content);
    const quality = scoreDesignQuality(content);
    const opportunities = detectFormattingOpportunities(content);

    const recommendations = [];

    // Add opportunity-based recommendations
    const highConfidenceOps = opportunities.filter(op => op.confidence > 0.85);
    if (highConfidenceOps.length > 0) {
        recommendations.push({
            priority: 'high',
            title: 'Apply Detected Formatting',
            description: `I found ${highConfidenceOps.length} formatting opportunities`,
            action: 'apply_opportunities',
            icon: 'wand'
        });
    }

    // Add quality-based recommendations
    if (quality.score < 70) {
        recommendations.push({
            priority: 'high',
            title: 'Improve Document Structure',
            description: `Design quality: ${quality.grade}`,
            action: 'improve_structure',
            icon: 'alert-circle'
        });
    }

    // Add document-type recommendations
    const typeRecs = {
        academic: {
            title: 'Apply Academic Format',
            description: 'Use Times New Roman, 12pt, double-spaced',
            action: 'apply_academic'
        },
        business: {
            title: 'Apply Business Format',
            description: 'Use Arial, 11pt, professional spacing',
            action: 'apply_business'
        },
        resume: {
            title: 'Apply Resume Format',
            description: 'Use Calibri, optimized for ATS systems',
            action: 'apply_resume'
        },
        report: {
            title: 'Apply Report Format',
            description: 'Professional report styling with headers',
            action: 'apply_report'
        }
    };

    if (typeRecs[docType]) {
        recommendations.push({
            priority: 'medium',
            ...typeRecs[docType],
            icon: 'file-text'
        });
    }

    return {
        recommendations,
        docType,
        quality,
        opportunities: highConfidenceOps
    };
};

export default {
    detectDocumentType,
    detectFormattingOpportunities,
    autoFormatDocument,
    scoreDesignQuality,
    getSmartDesignRecommendations
};
