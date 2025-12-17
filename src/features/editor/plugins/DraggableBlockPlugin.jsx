import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { $getRoot, $createParagraphNode, $getNodeByKey, $getNearestNodeFromDOMNode } from 'lexical';
import './DraggableBlockPlugin.css';

const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block';

function DraggableBlockMenu({ anchorElem, editor, menuRef, targetNode }) {
    const [position, setPosition] = useState(null);

    useEffect(() => {
        const updatePos = () => {
            if (targetNode && anchorElem) {
                const rect = targetNode.getBoundingClientRect();
                const scrollY = window.scrollY;
                const scrollX = window.scrollX;

                setPosition({
                    top: rect.top + scrollY,
                    // Position handle to the left of the block, accounting for padding/gutter
                    // -44px places it nicely in the left gutter (24px handle + gap)
                    left: rect.left + scrollX - 44,
                    height: rect.height
                });
            }
        };

        updatePos();

        // Update position on scroll/resize
        window.addEventListener('resize', updatePos);
        document.addEventListener('scroll', updatePos, true);

        return () => {
            window.removeEventListener('resize', updatePos);
            document.removeEventListener('scroll', updatePos, true);
        };
    }, [targetNode, anchorElem]);

    const onDragStart = (event) => {
        event.dataTransfer.setDragImage(targetNode, 0, 0);
        event.dataTransfer.setData(DRAG_DATA_FORMAT, 'true');

        editor.update(() => {
            const lexicalNode = $getNearestNodeFromDOMNode(targetNode);
            if (lexicalNode) {
                event.dataTransfer.setData('text/plain', lexicalNode.getKey());
            }
        });

        // Add class slightly later to ensure ghost image is opaque
        setTimeout(() => {
            targetNode.classList.add('dragging');
        }, 0);
    };

    const onDragEnd = () => {
        targetNode.classList.remove('dragging');
    };

    const onPlusClick = (e) => {
        e.stopPropagation();
        editor.update(() => {
            const lexicalNode = $getNearestNodeFromDOMNode(targetNode);
            if (lexicalNode) {
                const newPara = $createParagraphNode();
                lexicalNode.insertAfter(newPara);
                newPara.select();
            }
        });
    };

    if (!position || !targetNode) return null;

    return createPortal(
        <div
            ref={menuRef}
            className="draggable-block-menu"
            style={{
                top: position.top,
                left: position.left,
                height: 24,
            }}
            draggable="true"
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="drag-plus-btn" onClick={onPlusClick} title="Add block below">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </div>
            <div className="drag-handle-icon" title="Drag to move">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" />
                    <circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" />
                </svg>
            </div>
        </div>,
        document.body
    );
}

export default function DraggableBlockPlugin() {
    const [editor] = useLexicalComposerContext();
    const [draggableBlockElem, setDraggableBlockElem] = useState(null);
    const [anchorElem, setAnchorElem] = useState(null);
    const menuRef = useRef(null);

    // Get the editor root element reliably
    useEffect(() => {
        return editor.registerRootListener((rootElement) => {
            setAnchorElem(rootElement);
        });
    }, [editor]);

    // Handle mouse movement to detect blocks
    useEffect(() => {
        const handler = (e) => {
            const target = e.target;

            // If hovering over the menu itself, keep it visible
            if (menuRef.current && menuRef.current.contains(target)) {
                return;
            }

            // Standard block detection
            let block = target.closest('p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, div[data-lexical-decorator]');

            // Gutter detection: if hovering padding/gutter, find nearest vertical block
            if (!block && anchorElem && anchorElem.contains(target)) {
                const blocks = anchorElem.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, div[data-lexical-decorator]');
                const mouseY = e.clientY;

                let closestBlock = null;
                let minDistance = Infinity;

                for (const b of blocks) {
                    const rect = b.getBoundingClientRect();
                    const centerY = rect.top + rect.height / 2;
                    const distance = Math.abs(mouseY - centerY);

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestBlock = b;
                    }
                }

                // Only snap if within reasonable distance (e.g. 100px)
                if (closestBlock && minDistance < 100) {
                    block = closestBlock;
                }
            }

            if (block && anchorElem && anchorElem.contains(block)) {
                setDraggableBlockElem(block);
            } else {
                setDraggableBlockElem(null);
            }
        };

        window.addEventListener('mousemove', handler);
        return () => window.removeEventListener('mousemove', handler);
    }, [anchorElem]);

    // Handle Drop
    useEffect(() => {
        if (!anchorElem) return;

        const handleDragOver = (event) => {
            event.preventDefault();
            // Use same logic to find drop target, including gutter
            let target = event.target.closest('p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, div[data-lexical-decorator]');

            // Fallback for gutter drop
            if (!target && anchorElem.contains(event.target)) {
                const blocks = anchorElem.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, div[data-lexical-decorator]');
                const mouseY = event.clientY;
                let closest = null;
                let minD = Infinity;

                for (const b of blocks) {
                    const rect = b.getBoundingClientRect();
                    const d = Math.abs(mouseY - (rect.top + rect.height / 2));
                    if (d < minD) { minD = d; closest = b; }
                }
                if (closest && minD < 100) target = closest;
            }

            if (target) {
                const rect = target.getBoundingClientRect();
                const isTop = event.clientY < rect.top + rect.height / 2;

                // Remove old lines
                const indicators = document.querySelectorAll('.drop-indicator-line');
                indicators.forEach(el => el.remove());

                // Draw new line
                const line = document.createElement('div');
                line.className = 'drop-indicator-line';
                line.style.top = isTop ? `${rect.top}px` : `${rect.bottom}px`;
                line.style.left = `${rect.left}px`;
                line.style.width = `${rect.width}px`;
                document.body.appendChild(line);
            }
        };

        const handleDrop = (event) => {
            event.preventDefault();
            document.querySelectorAll('.drop-indicator-line').forEach(el => el.remove());

            const dragKey = event.dataTransfer.getData('text/plain');

            // Find target (same logic)
            let target = event.target.closest('p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, div[data-lexical-decorator]');
            if (!target && anchorElem.contains(event.target)) {
                const blocks = anchorElem.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, div[data-lexical-decorator]');
                const mouseY = event.clientY;
                let closest = null;
                let minD = Infinity;
                for (const b of blocks) {
                    const rect = b.getBoundingClientRect();
                    const d = Math.abs(mouseY - (rect.top + rect.height / 2));
                    if (d < minD) { minD = d; closest = b; }
                }
                if (closest && minD < 100) target = closest;
            }

            if (dragKey && target) {
                editor.update(() => {
                    const nodeToMove = $getNodeByKey(dragKey);
                    const targetNode = $getNearestNodeFromDOMNode(target);

                    if (nodeToMove && targetNode && nodeToMove !== targetNode) {
                        const rect = target.getBoundingClientRect();
                        const isTop = event.clientY < rect.top + rect.height / 2;

                        if (isTop) {
                            targetNode.insertBefore(nodeToMove);
                        } else {
                            targetNode.insertAfter(nodeToMove);
                        }
                    }
                });
            }
        };

        anchorElem.addEventListener('dragover', handleDragOver);
        anchorElem.addEventListener('drop', handleDrop);

        return () => {
            // Cleanup listeners + lingering lines
            anchorElem.removeEventListener('dragover', handleDragOver);
            anchorElem.removeEventListener('drop', handleDrop);
            document.querySelectorAll('.drop-indicator-line').forEach(el => el.remove());
        };
    }, [editor, anchorElem]);

    if (!anchorElem || !draggableBlockElem) return null;

    return (
        <DraggableBlockMenu
            anchorElem={anchorElem}
            editor={editor}
            menuRef={menuRef}
            targetNode={draggableBlockElem}
        />
    );
}
