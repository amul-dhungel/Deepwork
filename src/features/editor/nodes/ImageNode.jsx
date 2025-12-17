
import {
    DecoratorNode,
    $getNodeByKey
} from 'lexical';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { useEffect, useRef, useState } from 'react';

// Enhanced Image Component with Resize, Alignment, and Editable Caption
function ImageComponent({ src, alt, caption, nodeKey, width, height, maxWidth, alignment }) {
    const [editor] = useLexicalComposerContext();
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const [isResizing, setIsResizing] = useState(false);
    const [currentWidth, setCurrentWidth] = useState(width || 'auto');
    const [isEditingCaption, setIsEditingCaption] = useState(false);
    const [captionText, setCaptionText] = useState(caption || '');
    const imageRef = useRef(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    const onResizeStart = (e) => {
        e.preventDefault();
        setIsResizing(true);
        startXRef.current = e.clientX;
        startWidthRef.current = imageRef.current?.offsetWidth || 0;

        document.addEventListener('mousemove', onResizeMove);
        document.addEventListener('mouseup', onResizeEnd);
    };

    const onResizeMove = (e) => {
        const deltaX = e.clientX - startXRef.current;
        const newWidth = Math.max(100, startWidthRef.current + deltaX);
        setCurrentWidth(`${newWidth}px`);
    };

    const onResizeEnd = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', onResizeMove);
        document.removeEventListener('mouseup', onResizeEnd);

        // Update node with new width
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
                node.__width = currentWidth;
            }
        });
    };

    const handleCaptionSave = () => {
        setIsEditingCaption(false);
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if ($isImageNode(node)) {
                node.__caption = captionText;
            }
        });
    };

    const alignmentStyles = {
        left: { marginRight: 'auto', marginLeft: 0 },
        center: { marginRight: 'auto', marginLeft: 'auto' },
        right: { marginRight: 0, marginLeft: 'auto' },
        inline: { display: 'inline-block' }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
            margin: '1em 0',
            maxWidth: '100%'
        }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                    ref={imageRef}
                    src={src}
                    alt={alt}
                    style={{
                        maxWidth: maxWidth || '100%',
                        width: currentWidth || 'auto',
                        height: 'auto',
                        border: isSelected ? '2px solid #dc2626' : 'none',
                        cursor: isResizing ? 'ew-resize' : 'default',
                        borderRadius: '4px',
                        userSelect: 'none',
                        ...alignmentStyles[alignment || 'left']
                    }}
                    className={isSelected ? 'editor-image focused' : 'editor-image'}
                    draggable="false"
                    onClick={() => setSelected(!isSelected)}
                />

                {/* Resize Handle */}
                {isSelected && !isResizing && (
                    <div
                        onMouseDown={onResizeStart}
                        style={{
                            position: 'absolute',
                            right: '-4px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '12px',
                            height: '40px',
                            background: '#dc2626',
                            borderRadius: '4px',
                            cursor: 'ew-resize',
                            opacity: 0.8,
                            transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                    />
                )}
            </div>

            {/* Caption */}
            {isEditingCaption ? (
                <input
                    type="text"
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    onBlur={handleCaptionSave}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCaptionSave();
                        if (e.key === 'Escape') {
                            setCaptionText(caption || '');
                            setIsEditingCaption(false);
                        }
                    }}
                    autoFocus
                    style={{
                        marginTop: '0.5em',
                        padding: '4px 8px',
                        border: '1px solid #dc2626',
                        borderRadius: '4px',
                        fontSize: '0.9em',
                        fontStyle: 'italic',
                        textAlign: 'center',
                        width: '100%',
                        maxWidth: currentWidth
                    }}
                />
            ) : (
                (caption || isSelected) && (
                    <div
                        onDoubleClick={() => setIsEditingCaption(true)}
                        style={{
                            marginTop: '0.5em',
                            color: '#666',
                            fontSize: '0.9em',
                            fontStyle: 'italic',
                            textAlign: 'center',
                            cursor: isSelected ? 'text' : 'default',
                            padding: '4px',
                            borderRadius: '4px',
                            background: isSelected ? '#fef2f2' : 'transparent'
                        }}
                    >
                        {caption || (isSelected ? 'Double-click to add caption' : '')}
                    </div>
                )
            )}
        </div>
    );
}

export class ImageNode extends DecoratorNode {
    __src;
    __alt;
    __width;
    __height;
    __maxWidth;
    __caption;
    __alignment; // Added alignment field

    static getType() {
        return 'image';
    }

    static clone(node) {
        return new ImageNode(
            node.__src,
            node.__alt,
            node.__maxWidth,
            node.__width,
            node.__height,
            node.__caption,
            node.__alignment,
            node.__key,
        );
    }

    static importJSON(serializedNode) {
        const { alt, height, maxWidth, src, width, caption, alignment } = serializedNode;
        return $createImageNode({
            alt,
            height,
            maxWidth,
            src,
            width,
            caption,
            alignment
        });
    }

    exportJSON() {
        return {
            alt: this.__alt,
            caption: this.__caption,
            height: this.__height,
            maxWidth: this.__maxWidth,
            src: this.__src,
            type: 'image',
            version: 1,
            width: this.__width,
            alignment: this.__alignment || 'left'
        };
    }

    // Handle HTML Import (for Markdown -> HTML -> DOM flow)
    static importDOM() {
        return {
            img: (node) => ({
                conversion: (domNode) => {
                    return {
                        node: $createImageNode({
                            src: domNode.getAttribute('src'),
                            alt: domNode.getAttribute('alt'),
                            caption: domNode.getAttribute('data-caption')
                        })
                    };
                },
                priority: 1
            })
        };
    }

    constructor(src, alt, maxWidth, width, height, caption, alignment, key) {
        super(key);
        this.__src = src;
        this.__alt = alt;
        this.__maxWidth = maxWidth;
        this.__width = width || 'inherit';
        this.__height = height || 'inherit';
        this.__caption = caption;
        this.__alignment = alignment || 'left';
    }

    createDOM(config) {
        const span = document.createElement('span');
        const theme = config.theme;
        const className = theme.image;
        if (className !== undefined) {
            span.className = className;
        }
        return span;
    }

    updateDOM() {
        return false;
    }

    decorate() {
        return (
            <ImageComponent
                src={this.__src}
                alt={this.__alt}
                width={this.__width}
                height={this.__height}
                maxWidth={this.__maxWidth}
                caption={this.__caption}
                alignment={this.__alignment}
                nodeKey={this.__key}
            />
        );
    }
}

export function $createImageNode({ alt, height, maxWidth, src, width, caption, alignment }) {
    return new ImageNode(src, alt, maxWidth, width, height, caption, alignment);
}

export function $isImageNode(node) {
    return node instanceof ImageNode;
}
