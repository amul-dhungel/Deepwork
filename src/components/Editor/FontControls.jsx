import { useState } from 'react';
import {
    ChevronDown, Type, Palette, Highlighter,
    Superscript, Subscript, X
} from 'lucide-react';
import './FontControls.css';

const FontControls = ({ editor }) => {
    const [showFontMenu, setShowFontMenu] = useState(false);
    const [showSizeMenu, setShowSizeMenu] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showHighlightPicker, setShowHighlightPicker] = useState(false);

    if (!editor) return null;

    const fonts = [
        'Aptos',
        'Aptos (Body)',
        'Calibri',
        'Calibri (Body)',
        'Arial',
        'Times New Roman',
        'Georgia',
        'Verdana',
        'Segoe UI',
        'Cambria',
        'Consolas',
        'Courier New',
        'Comic Sans MS',
        'Trebuchet MS'
    ];

    const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];

    const colors = [
        '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
        '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
        '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
        '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
        '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0'
    ];

    const getCurrentFontFamily = () => {
        if (!editor) return 'Aptos';
        const attrs = editor.getAttributes('textStyle');
        return attrs.fontFamily || 'Aptos';
    };

    const setFontFamily = (font) => {
        editor.chain().focus().setFontFamily(font).run();
        setShowFontMenu(false);
    };

    const setFontSize = (size) => {
        editor.chain().focus().setMark('textStyle', { fontSize: `${size}pt` }).run();
        setShowSizeMenu(false);
    };

    const setTextColor = (color) => {
        editor.chain().focus().setColor(color).run();
        setShowColorPicker(false);
    };

    const setHighlight = (color) => {
        editor.chain().focus().setHighlight({ color }).run();
        setShowHighlightPicker(false);
    };

    const clearFormatting = () => {
        editor.chain().focus().clearNodes().unsetAllMarks().run();
    };

    return (
        <div className="font-controls">
            {/* Font Family Dropdown */}
            <div className="control-group">
                <button
                    className="font-dropdown-btn btn"
                    onClick={() => setShowFontMenu(!showFontMenu)}
                >
                    <Type size={16} />
                    <span className="font-name">{getCurrentFontFamily()}</span>
                    <ChevronDown size={14} />
                </button>

                {showFontMenu && (
                    <>
                        <div className="dropdown-overlay" onClick={() => setShowFontMenu(false)} />
                        <div className="font-dropdown">
                            {fonts.map(font => (
                                <button
                                    key={font}
                                    className={`font-option ${getCurrentFontFamily() === font ? 'active' : ''}`}
                                    onClick={() => setFontFamily(font)}
                                    style={{ fontFamily: font }}
                                >
                                    {font}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Font Size Dropdown */}
            <div className="control-group">
                <button
                    className="size-dropdown-btn btn"
                    onClick={() => setShowSizeMenu(!showSizeMenu)}
                >
                    <span>12</span>
                    <ChevronDown size={14} />
                </button>

                {showSizeMenu && (
                    <>
                        <div className="dropdown-overlay" onClick={() => setShowSizeMenu(false)} />
                        <div className="size-dropdown">
                            {sizes.map(size => (
                                <button
                                    key={size}
                                    className="size-option"
                                    onClick={() => setFontSize(size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="toolbar-divider" />

            {/* Text Color */}
            <div className="control-group">
                <button
                    className="btn-icon"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    title="Text Color"
                >
                    <Palette size={18} />
                </button>

                {showColorPicker && (
                    <>
                        <div className="dropdown-overlay" onClick={() => setShowColorPicker(false)} />
                        <div className="color-picker">
                            <div className="color-grid">
                                {colors.map(color => (
                                    <button
                                        key={color}
                                        className="color-swatch"
                                        style={{ backgroundColor: color }}
                                        onClick={() => setTextColor(color)}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Highlight Color */}
            <div className="control-group">
                <button
                    className="btn-icon"
                    onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                    title="Highlight Color"
                >
                    <Highlighter size={18} />
                </button>

                {showHighlightPicker && (
                    <>
                        <div className="dropdown-overlay" onClick={() => setShowHighlightPicker(false)} />
                        <div className="color-picker">
                            <div className="color-grid">
                                <button
                                    className="color-swatch no-highlight"
                                    onClick={() => editor.chain().focus().unsetHighlight().run()}
                                    title="No highlight"
                                >
                                    <span>✕</span>
                                </button>
                                {colors.slice(10).map(color => (
                                    <button
                                        key={color}
                                        className="color-swatch"
                                        style={{ backgroundColor: color }}
                                        onClick={() => setHighlight(color)}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="toolbar-divider" />

            {/* Superscript / Subscript */}
            <button
                className={`btn-icon ${editor.isActive('superscript') ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                title="Superscript"
            >
                <Superscript size={18} />
            </button>

            <button
                className={`btn-icon ${editor.isActive('subscript') ? 'active' : ''}`}
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                title="Subscript"
            >
                <Subscript size={18} />
            </button>

            <div className="toolbar-divider" />

            {/* Clear Formatting */}
            <button
                className="btn-icon"
                onClick={clearFormatting}
                title="Clear Formatting"
            >
                <X size={18} />
            </button>
        </div>
    );
};

export default FontControls;
