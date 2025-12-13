import { useState, useEffect } from 'react';
import { Sparkles, List, MoveRight, Loader2 } from 'lucide-react';
import { refineText } from '../../services/api';
import './EditorBubbleMenu.css';

const EditorBubbleMenu = ({ editor, modelProvider }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: -9999, left: -9999, isVisible: false });
    const [selectionRects, setSelectionRects] = useState([]);

    // Handle updates to position the menu
    useEffect(() => {
        if (!editor) return;

        const updatePosition = () => {
            const { selection } = editor.state;
            const { empty, from, to } = selection;

            // Hide if selection is empty or editor not focused
            if (empty || !editor.isFocused) {
                setMenuPosition(prev => ({ ...prev, isVisible: false }));
                return;
            }

            // Calculate position
            try {
                // Get coordinates of the start of selection
                const startCoords = editor.view.coordsAtPos(from);
                const endCoords = editor.view.coordsAtPos(to);

                // Calculate center
                const left = (startCoords.left + endCoords.left) / 2;
                // Position above the line (approx 40px)
                const top = startCoords.top - 40;

                setMenuPosition({
                    top: top,
                    left: left,
                    isVisible: true
                });
            } catch (e) {
                // Fallback or ignore if coords fail (e.g. not in view)
                console.debug("Could not calculate bubble menu pos", e);
            }
        };

        // Listen to selection updates
        editor.on('selectionUpdate', updatePosition);
        editor.on('blur', updatePosition);
        editor.on('focus', updatePosition);

        return () => {
            editor.off('selectionUpdate', updatePosition);
            editor.off('blur', updatePosition);
            editor.off('focus', updatePosition);
        };
    }, [editor]);

    const handleRefine = async (instruction) => {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, ' ');

        if (!text) return;

        // Capture visual selection rects for animation (multi-line support)
        try {
            const domSelection = window.getSelection();
            console.log("DOM Selection:", domSelection);
            if (domSelection.rangeCount > 0) {
                const range = domSelection.getRangeAt(0);
                const rects = Array.from(range.getClientRects());
                console.log("Captured Rects:", rects);

                if (rects.length === 0) {
                    // Fallback to bounding rect if client rects failed
                    const rect = range.getBoundingClientRect();
                    setSelectionRects([rect]);
                } else {
                    setSelectionRects(rects);
                }
            }
        } catch (e) {
            console.error("Could not get selection rects", e);
        }

        setIsLoading(true);
        try {
            const result = await refineText(text, instruction, modelProvider);
            if (result && result.content) {
                editor.chain().focus().insertContentAt({ from, to }, result.content).run();
            }
        } catch (error) {
            console.error("Refinement failed:", error);
            alert("Failed to refine text. Please try again.");
        } finally {
            setIsLoading(false);
            setSelectionRects([]);
        }
    };

    if (!menuPosition.isVisible) {
        return null;
    }

    return (
        <>
            {/* Visual Highlight Overlay */}
            {isLoading && selectionRects.length > 0 && (
                <>
                    <style>
                        {`
                            .ProseMirror ::selection {
                                background: transparent !important;
                                color: inherit !important;
                            }
                        `}
                    </style>
                    {selectionRects.map((rect, idx) => (
                        <div
                            key={idx}
                            className="gemini-highlight-overlay"
                            style={{
                                position: 'fixed',
                                top: rect.top,
                                left: rect.left,
                                width: rect.width,
                                height: rect.height,
                                pointerEvents: 'none',
                                zIndex: 40
                            }}
                        />
                    ))}
                </>
            )}

            <div
                className="bubble-menu custom-bubble-pos"
                style={{
                    position: 'fixed',
                    top: `${menuPosition.top}px`,
                    left: `${menuPosition.left}px`,
                    transform: 'translateX(-50%)', // Center it
                    zIndex: 50,
                    // Ensure it doesn't go off screen
                    pointerEvents: 'auto'
                }}
            >
                {isLoading ? (
                    <div className="bm-loading">
                        <Loader2 className="spin" size={16} />
                        <span>Refining...</span>
                    </div>
                ) : (
                    <div className="bm-group">
                        <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleRefine("Rewrite this to improve flow and readability while maintaining the meaning.")}
                            className="bm-btn"
                            title="Maintain Flow"
                        >
                            <Sparkles size={16} />
                            <span>Flow</span>
                        </button>
                        <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleRefine("Convert this text into a concise bulleted list.")}
                            className="bm-btn"
                            title="Convert to Bullets"
                        >
                            <List size={16} />
                            <span>Bullets</span>
                        </button>
                        <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleRefine("Expand on this text, adding more detail and depth.")}
                            className="bm-btn"
                            title="Extend"
                        >
                            <MoveRight size={16} />
                            <span>Extend</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default EditorBubbleMenu;
