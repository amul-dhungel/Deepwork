import React, { useEffect, useState } from 'react';
import { exportToSvg } from '@excalidraw/excalidraw';

export default function ExcalidrawImage({
    elements,
    appState = {},
    files = {},
    width = 'inherit',
    height = 'inherit',
    className = '',
}) {
    const [svg, setSvg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const setContent = async () => {
            console.log('🖼️ ExcalidrawImage rendering with elements:', elements);
            console.log('📊 Elements count:', elements?.length);

            if (!elements || elements.length === 0) {
                console.warn('⚠️ No elements provided to ExcalidrawImage');
                setLoading(false);
                setError('No diagram elements provided');
                return;
            }

            // setLoading(true); // Prevent flickering by keeping existing SVG while updating
            setError(null);

            try {
                // Pre-process files to convert URLs to DataURLs (Base64)
                // Excalidraw exportToSvg requires dataURL for images
                const processedFiles = { ...files };

                await Promise.all(Object.keys(processedFiles).map(async (fileId) => {
                    const file = processedFiles[fileId];
                    if (file && !file.dataURL && (file.url || file.link)) {
                        try {
                            const url = file.url || file.link;
                            console.log(`🖼️ Fetching image for Excalidraw: ${url}`);
                            const response = await fetch(url);
                            const blob = await response.blob();

                            await new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    file.dataURL = reader.result;
                                    file.mimeType = blob.type; // Update mimeType
                                    resolve();
                                };
                                reader.onerror = reject;
                                reader.readAsDataURL(blob);
                            });
                            // console.log(`✅ Loaded image ${fileId} from ${url}`);
                        } catch (err) {
                            console.error(`❌ Failed to load image ${fileId} from ${file.url || file.link}:`, err);
                            // Fallback: Excalidraw might show a placeholder if dataURL is missing
                        }
                    } else {
                        // console.log(`ℹ️ File ${fileId} already has dataURL or no URL to fetch`);
                    }
                }))

                    ;

                // Validate and sanitize elements before passing to Excalidraw
                const sanitizedElements = elements.map((el, index) => {
                    // Ensure all required properties exist with defaults
                    const sanitized = {
                        id: el.id || `element-${index}`,
                        type: el.type || 'rectangle',
                        x: typeof el.x === 'number' ? el.x : 0,
                        y: typeof el.y === 'number' ? el.y : 0,
                        width: typeof el.width === 'number' ? el.width : 100,
                        height: typeof el.height === 'number' ? el.height : 100,
                        angle: typeof el.angle === 'number' ? el.angle : 0,
                        strokeColor: el.strokeColor || '#1e1e1e',
                        backgroundColor: el.backgroundColor || 'transparent',
                        fillStyle: el.fillStyle || 'solid',
                        strokeWidth: typeof el.strokeWidth === 'number' ? el.strokeWidth : 2,
                        roughness: typeof el.roughness === 'number' ? el.roughness : 1,
                        opacity: typeof el.opacity === 'number' ? el.opacity : 100,
                        seed: typeof el.seed === 'number' ? el.seed : Math.floor(Math.random() * 100000),
                        version: el.version || 1,
                        versionNonce: el.versionNonce || Math.floor(Math.random() * 100000),
                        isDeleted: false,
                        boundElements: el.boundElements || null,
                        updated: el.updated || Date.now(),
                        link: el.link || null,
                        locked: el.locked || false,
                    };

                    // Add text-specific properties if it's a text element
                    if (el.type === 'text') {
                        sanitized.text = el.text || '';
                        sanitized.fontSize = typeof el.fontSize === 'number' ? el.fontSize : 20;
                        sanitized.fontFamily = typeof el.fontFamily === 'number' ? el.fontFamily : 1;
                        sanitized.textAlign = el.textAlign || 'center';
                        sanitized.verticalAlign = el.verticalAlign || 'middle';
                        sanitized.baseline = typeof el.baseline === 'number' ? el.baseline : 18;
                        sanitized.containerId = el.containerId || null;
                        sanitized.originalText = el.originalText || el.text || '';
                        sanitized.lineHeight = el.lineHeight || 1.25;
                    }

                    // Add arrow-specific properties if it's an arrow
                    if (el.type === 'arrow' || el.type === 'line') {
                        sanitized.points = el.points || [[0, 0], [100, 100]];
                        sanitized.lastCommittedPoint = el.lastCommittedPoint || null;
                        sanitized.startBinding = el.startBinding || null;
                        sanitized.endBinding = el.endBinding || null;
                        sanitized.startArrowhead = el.startArrowhead || null;
                        sanitized.endArrowhead = el.endArrowhead || 'arrow';
                    }

                    return sanitized;
                });

                console.log('🎨 Calling exportToSvg with processed files:', Object.keys(processedFiles));
                console.log('✨ Sanitized elements count:', sanitizedElements.length);

                const tempSvg = await exportToSvg({
                    elements: sanitizedElements,
                    appState: {
                        viewBackgroundColor: '#ffffff',
                        ...appState
                    },
                    files: processedFiles,
                });

                console.log('✅ SVG generated successfully');

                // Ensure fit
                tempSvg.setAttribute('width', '100%');
                tempSvg.setAttribute('height', '100%');
                tempSvg.style.maxWidth = "100%";

                setSvg(tempSvg);
                setLoading(false);
            } catch (error) {
                console.error("❌ Excalidraw Export Error:", error);
                console.error("Elements that failed:", elements);
                setError(error.message);
                setLoading(false);
            }
        };

        setContent();
        setContent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(elements), JSON.stringify(files), JSON.stringify(appState)]);

    if (loading) {
        return (
            <div
                className={`excalidraw-container ${className}`}
                style={{
                    width: width,
                    height: height,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: '20px 0',
                    padding: '40px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px'
                }}
            >
                <div style={{ textAlign: 'center', color: '#666' }}>
                    <div>🎨 Generating diagram...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className={`excalidraw-container ${className}`}
                style={{
                    width: width,
                    height: height,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: '20px 0',
                    padding: '40px',
                    backgroundColor: '#fff5f5',
                    border: '2px solid #ff4444',
                    borderRadius: '8px',
                    color: '#cc0000'
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div><strong>⚠️ Failed to render diagram</strong></div>
                    <div style={{ fontSize: '0.9em', marginTop: '8px' }}>{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`excalidraw-container ${className}`}
            style={{
                width: width,
                height: height,
                display: 'flex',
                justifyContent: 'center',
                margin: '20px 0'
            }}
            dangerouslySetInnerHTML={{ __html: svg ? svg.outerHTML : '' }}
        />
    );
}
