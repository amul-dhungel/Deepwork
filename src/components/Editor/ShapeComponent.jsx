import { NodeViewWrapper } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { Trash2, Move } from 'lucide-react';
import './ShapeComponent.css';

const ShapeComponent = ({ node, updateAttributes, deleteNode, selected, extension }) => {
    const [isResizing, setIsResizing] = useState(false);

    // Basic Resize Logic (Simplified for MVP)
    const handleResizeStart = (e, direction) => {
        e.preventDefault();
        e.stopPropagation();

        // logic to track mouse movement would go here
        // for now we'll just cycle sizes to demonstrate interactivity
        // Real implementation requires global mouse listeners
        const newWidth = node.attrs.width + (direction === 'se' ? 20 : -20);
        updateAttributes({ width: Math.max(50, newWidth), height: Math.max(50, node.attrs.height + 20) });
    };

    const shapes = {
        rectangle: (
            <rect
                x="2"
                y="2"
                width={node.attrs.width - 4}
                height={node.attrs.height - 4}
                fill={node.attrs.fill}
                stroke={node.attrs.stroke}
                strokeWidth={node.attrs.strokeWidth}
                rx="4"
            />
        ),
        circle: (
            <ellipse
                cx={node.attrs.width / 2}
                cy={node.attrs.height / 2}
                rx={(node.attrs.width - 4) / 2}
                ry={(node.attrs.height - 4) / 2}
                fill={node.attrs.fill}
                stroke={node.attrs.stroke}
                strokeWidth={node.attrs.strokeWidth}
            />
        ),
        arrow: (
            <path
                d={`M0,${node.attrs.height / 2} L${node.attrs.width - 20},${node.attrs.height / 2} M${node.attrs.width - 20},${node.attrs.height / 2 - 10} L${node.attrs.width},${node.attrs.height / 2} L${node.attrs.width - 20},${node.attrs.height / 2 + 10}`}
                fill="none"
                stroke={node.attrs.fill} // Arrows usually use stroke color as main color
                strokeWidth={Math.max(4, node.attrs.strokeWidth * 2)}
            />
        )
    };

    return (
        <NodeViewWrapper className={`shape-wrapper ${selected ? 'selected' : ''}`} style={{ justifyContent: node.attrs.align }}>
            <div
                className="shape-container"
                style={{ width: node.attrs.width, height: node.attrs.height }}
            >
                <svg width="100%" height="100%" viewBox={`0 0 ${node.attrs.width} ${node.attrs.height}`}>
                    {shapes[node.attrs.type] || shapes.rectangle}
                </svg>

                {selected && (
                    <>
                        <div className="resize-handle nw" />
                        <div className="resize-handle ne" />
                        <div className="resize-handle sw" />
                        <div className="resize-handle se" onMouseDown={(e) => handleResizeStart(e, 'se')} />

                        <div className="shape-controls">
                            <button onClick={deleteNode} className="delete-btn" title="Delete Shape">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </NodeViewWrapper>
    );
};

export default ShapeComponent;
