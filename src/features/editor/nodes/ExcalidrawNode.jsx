
import { DecoratorNode } from 'lexical';
import React, { Suspense } from 'react';

const ExcalidrawImage = React.lazy(() => import('../components/ExcalidrawImage'));

export class ExcalidrawNode extends DecoratorNode {
    __data;

    static getType() {
        return 'excalidraw';
    }

    static clone(node) {
        return new ExcalidrawNode(node.__data, node.__key);
    }

    static importJSON(serializedNode) {
        return new ExcalidrawNode(serializedNode.data);
    }

    exportJSON() {
        return {
            data: this.__data,
            type: 'excalidraw',
            version: 1,
        };
    }

    constructor(data = '[]', key) {
        super(key);
        this.__data = data;
    }

    createDOM(config) {
        const span = document.createElement('span');
        const theme = config.theme;
        const className = theme.image;
        if (className) {
            span.className = className;
        }
        return span;
    }

    updateDOM() {
        return false;
    }

    static importDOM() {
        return {
            span: (domNode) => {
                if (!domNode.hasAttribute('data-lexical-excalidraw-json')) {
                    return null;
                }
                return {
                    conversion: (domNode) => {
                        const data = domNode.getAttribute('data-lexical-excalidraw-json');
                        // console.log('🔍 importDOM received data:', data?.substring(0, 100) + '...');

                        if (data) {
                            // Decode HTML entities back to JSON
                            const decodedData = data
                                .replace(/&quot;/g, '"')
                                .replace(/&apos;/g, "'")
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&amp;/g, '&');

                            // console.log('✅ Decoded data:', decodedData.substring(0, 100) + '...');
                            return { node: new ExcalidrawNode(decodedData) };
                        }
                        return null;
                    },
                    priority: 1,
                };
            },
        };
    }

    getData() {
        return this.__data;
    }

    decorate() {
        // console.log('🎨 ExcalidrawNode.decorate() called');

        let elements = [];
        let files = {};
        let errorMessage = null;

        try {
            let parsedData = this.__data;

            // 1. If it's a string, parse it
            if (typeof parsedData === 'string') {
                // console.log('📝 Parsing string data...');
                parsedData = JSON.parse(parsedData);
            }

            // 2. Now handle the parsed object/array
            if (Array.isArray(parsedData)) {
                // Legacy format: just an array of elements
                // console.log('✅ Data is array (Legacy format)');
                elements = parsedData;
            } else if (typeof parsedData === 'object' && parsedData !== null) {
                // New format: { elements, files, ... } or potentially just a single element object (rare but possible in some flows)
                if (parsedData.elements && Array.isArray(parsedData.elements)) {
                    // console.log('✅ Data is state object with elements & files');
                    elements = parsedData.elements;
                    files = parsedData.files || {};
                } else {
                    // Fallback: Treat as a single element or unknown object content
                    // console.warn('⚠️ Data object unknown structure, wrapping as single element');
                    elements = [parsedData];
                }
            } else {
                throw new Error('Invalid data type: ' + typeof this.__data);
            }

            if (!Array.isArray(elements)) {
                console.warn('⚠️ Elements is not an array after processing, forcing empty array');
                elements = [];
            }
        } catch (e) {
            console.error("❌ Failed to parse Excalidraw data:", e);
            console.error("Raw data:", this.__data);
            errorMessage = `Error parsing diagram: ${e.message}`;
            elements = [];
        }

        if (errorMessage) {
            return (
                <div className="excalidraw-error" style={{
                    padding: '20px',
                    border: '2px solid #ff4444',
                    borderRadius: '8px',
                    backgroundColor: '#fff5f5',
                    color: '#cc0000',
                    margin: '20px 0'
                }}>
                    <strong>⚠️ Excalidraw Error:</strong> {errorMessage}
                </div>
            );
        }

        return (
            <Suspense fallback={<div className="excalidraw-loading">Loading Diagram...</div>}>
                <ExcalidrawImage
                    elements={elements}
                    files={files}
                    width="100%"
                    height="auto"
                />
            </Suspense>
        );
    }
}

export function $createExcalidrawNode(data) {
    return new ExcalidrawNode(data);
}

export function $isExcalidrawNode(node) {
    return node instanceof ExcalidrawNode;
}
