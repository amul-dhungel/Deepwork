import { DecoratorNode, $getNodeByKey } from 'lexical';
import React, { useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export class HtmlSnippetNode extends DecoratorNode {
    static getType() {
        return 'html-snippet';
    }

    static clone(node) {
        return new HtmlSnippetNode(node.__html, node.__key);
    }

    static importJSON(serializedNode) {
        return $createHtmlSnippetNode(serializedNode.html);
    }

    constructor(html, key) {
        super(key);
        this.__html = html;
    }

    exportJSON() {
        return {
            html: this.__html,
            type: 'html-snippet',
            version: 1,
        };
    }

    createDOM() {
        const div = document.createElement('div');
        div.className = 'html-snippet-wrapper';
        return div;
    }

    updateDOM() {
        return false;
    }

    decorate() {
        return <HtmlSnippetComponent html={this.__html} nodeKey={this.getKey()} />;
    }
}

function HtmlSnippetComponent({ html, nodeKey }) {
    const ref = useRef(null);
    const [editor] = useLexicalComposerContext();
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (ref.current && !isEditing) {
            ref.current.innerHTML = html;

            // Make text elements editable on click
            const textElements = ref.current.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
            textElements.forEach(el => {
                // Only make leaf text nodes editable
                if (el.children.length === 0 || (el.children.length === 1 && el.children[0].nodeType === 3)) {
                    el.contentEditable = 'true';
                    el.style.cursor = 'text';
                    el.style.outline = 'none';

                    // Visual feedback on focus
                    el.addEventListener('focus', () => {
                        el.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
                        el.style.borderRadius = '4px';
                    });

                    el.addEventListener('blur', () => {
                        el.style.boxShadow = 'none';
                        // Update node with new HTML
                        editor.update(() => {
                            const node = $getNodeByKey(nodeKey);
                            if ($isHtmlSnippetNode(node)) {
                                const newHtml = ref.current.innerHTML;
                                const writable = node.getWritable();
                                writable.__html = newHtml;
                            }
                        });
                    });
                }
            });
        }
    }, [html, editor, nodeKey, isEditing]);

    return (
        <div
            className="html-snippet-container"
            style={{
                margin: '20px 0',
                border: '2px dashed transparent',
                padding: '15px',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                position: 'relative'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
        >
            <div
                ref={ref}
                style={{ userSelect: 'text' }}
            />
            <div style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                fontSize: '10px',
                color: '#9ca3af',
                background: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                opacity: 0.7
            }}>
                Click text to edit
            </div>
        </div>
    );
}

export function $createHtmlSnippetNode(html) {
    return new HtmlSnippetNode(html);
}

export function $isHtmlSnippetNode(node) {
    return node instanceof HtmlSnippetNode;
}
