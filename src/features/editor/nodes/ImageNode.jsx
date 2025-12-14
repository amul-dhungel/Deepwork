
import {
    DecoratorNode,
} from 'lexical';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
    $getNodeByKey
} from 'lexical';
import { useEffect, useCallback, useRef } from 'react';

// Simple Image Component
function ImageComponent({ src, alt, nodeKey, width, height, maxWidth }) {
    const [editor] = useLexicalComposerContext();
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
    const imageRef = useRef(null);

    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
                ref={imageRef}
                src={src}
                alt={alt}
                style={{
                    maxWidth: maxWidth || '100%',
                    width: width || 'auto',
                    height: height || 'auto',
                    border: isSelected ? '2px solid #2563eb' : 'none',
                    cursor: 'default'
                }}
                className={isSelected ? 'editor-image focused' : 'editor-image'}
                draggable="false"
                onClick={() => setSelected(!isSelected)}
            />
        </div>
    );
}

export class ImageNode extends DecoratorNode {
    __src;
    __alt;
    __width;
    __height;
    __maxWidth;

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
            node.__key,
        );
    }

    static importJSON(serializedNode) {
        const { alt, height, maxWidth, src, width } = serializedNode;
        return $createImageNode({
            alt,
            height,
            maxWidth,
            src,
            width,
        });
    }

    exportJSON() {
        return {
            alt: this.__alt,
            height: this.__height,
            maxWidth: this.__maxWidth,
            src: this.__src,
            type: 'image',
            version: 1,
            width: this.__width,
        };
    }

    constructor(src, alt, maxWidth, width, height, key) {
        super(key);
        this.__src = src;
        this.__alt = alt;
        this.__maxWidth = maxWidth;
        this.__width = width || 'inherit';
        this.__height = height || 'inherit';
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
                nodeKey={this.__key}
            />
        );
    }
}

export function $createImageNode({ alt, height, maxWidth, src, width }) {
    return new ImageNode(src, alt, maxWidth, width, height);
}

export function $isImageNode(node) {
    return node instanceof ImageNode;
}
