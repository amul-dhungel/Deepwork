import {
    Bold, Italic, Underline, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Quote,
    Heading1, Heading2, Heading3,
    Undo, Redo,
    Code, Link, Image,
    Square, Circle as CircleIcon, ArrowRight
} from 'lucide-react';
import './EditorToolbar.css';

const EditorToolbar = ({ editor }) => {
    if (!editor) {
        return null;
    }

    const toolbarGroups = [
        {
            name: 'history',
            items: [
                { icon: Undo, action: () => editor.chain().focus().undo().run(), label: 'Undo', disabled: !editor.can().undo() },
                { icon: Redo, action: () => editor.chain().focus().redo().run(), label: 'Redo', disabled: !editor.can().redo() },
            ]
        },
        {
            name: 'headings',
            items: [
                {
                    icon: Heading1,
                    action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
                    label: 'Heading 1',
                    isActive: () => editor.isActive('heading', { level: 1 })
                },
                {
                    icon: Heading2,
                    action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
                    label: 'Heading 2',
                    isActive: () => editor.isActive('heading', { level: 2 })
                },
                {
                    icon: Heading3,
                    action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
                    label: 'Heading 3',
                    isActive: () => editor.isActive('heading', { level: 3 })
                },
            ]
        },
        {
            name: 'formatting',
            items: [
                {
                    icon: Bold,
                    action: () => editor.chain().focus().toggleBold().run(),
                    label: 'Bold',
                    isActive: () => editor.isActive('bold')
                },
                {
                    icon: Italic,
                    action: () => editor.chain().focus().toggleItalic().run(),
                    label: 'Italic',
                    isActive: () => editor.isActive('italic')
                },
                {
                    icon: Underline,
                    action: () => editor.chain().focus().toggleUnderline().run(),
                    label: 'Underline',
                    isActive: () => editor.isActive('underline')
                },
                {
                    icon: Strikethrough,
                    action: () => editor.chain().focus().toggleStrike().run(),
                    label: 'Strikethrough',
                    isActive: () => editor.isActive('strike')
                },
            ]
        },
        {
            name: 'alignment',
            items: [
                {
                    icon: AlignLeft,
                    action: () => editor.chain().focus().setTextAlign('left').run(),
                    label: 'Align Left',
                    isActive: () => editor.isActive({ textAlign: 'left' })
                },
                {
                    icon: AlignCenter,
                    action: () => editor.chain().focus().setTextAlign('center').run(),
                    label: 'Align Center',
                    isActive: () => editor.isActive({ textAlign: 'center' })
                },
                {
                    icon: AlignRight,
                    action: () => editor.chain().focus().setTextAlign('right').run(),
                    label: 'Align Right',
                    isActive: () => editor.isActive({ textAlign: 'right' })
                },
                {
                    icon: AlignJustify,
                    action: () => editor.chain().focus().setTextAlign('justify').run(),
                    label: 'Justify',
                    isActive: () => editor.isActive({ textAlign: 'justify' })
                },
            ]
        },
        {
            name: 'lists',
            items: [
                {
                    icon: List,
                    action: () => editor.chain().focus().toggleBulletList().run(),
                    label: 'Bullet List',
                    isActive: () => editor.isActive('bulletList')
                },
                {
                    icon: ListOrdered,
                    action: () => editor.chain().focus().toggleOrderedList().run(),
                    label: 'Numbered List',
                    isActive: () => editor.isActive('orderedList')
                },
            ]
        },
        {
            name: 'blocks',
            items: [
                {
                    icon: Quote,
                    action: () => editor.chain().focus().toggleBlockquote().run(),
                    label: 'Quote',
                    isActive: () => editor.isActive('blockquote')
                },
                {
                    icon: Code,
                    action: () => editor.chain().focus().toggleCodeBlock().run(),
                    label: 'Code Block',
                    isActive: () => editor.isActive('codeBlock')
                },
            ]
        },
        // {
        //     name: 'tables',
        //     items: [
        //         {
        //             icon: () => <span>Tb</span>, // Placeholder icon or use a Lucide icon if available 
        //             action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
        //             label: 'Insert Table',
        //         },
        //         {
        //             icon: () => <span>+R</span>,
        //             action: () => editor.chain().focus().addRowAfter().run(),
        //             label: 'Add Row',
        //             disabled: !editor.can().addRowAfter()
        //         },
        //         {
        //             icon: () => <span>-R</span>,
        //             action: () => editor.chain().focus().deleteRow().run(),
        //             label: 'Delete Row',
        //             disabled: !editor.can().deleteRow()
        //         },
        //         {
        //             icon: () => <span>+C</span>,
        //             action: () => editor.chain().focus().addColumnAfter().run(),
        //             label: 'Add Col',
        //             disabled: !editor.can().addColumnAfter()
        //         },
        //         {
        //             icon: () => <span>-C</span>,
        //             action: () => editor.chain().focus().deleteColumn().run(),
        //             label: 'Delete Col',
        //             disabled: !editor.can().deleteColumn()
        //         },
        //     ]
        // },
    ];

    const shapeGroup = {
        name: 'shapes',
        items: [
            {
                icon: Square,
                action: () => editor.chain().focus().insertContent({ type: 'shape', attrs: { type: 'rectangle' } }).run(),
                label: 'Rectangle',
                isActive: () => editor.isActive('shape', { type: 'rectangle' })
            },
            {
                icon: CircleIcon,
                action: () => editor.chain().focus().insertContent({ type: 'shape', attrs: { type: 'circle' } }).run(),
                label: 'Circle',
                isActive: () => editor.isActive('shape', { type: 'circle' })
            },
            {
                icon: ArrowRight,
                action: () => editor.chain().focus().insertContent({ type: 'shape', attrs: { type: 'arrow' } }).run(),
                label: 'Arrow',
                isActive: () => editor.isActive('shape', { type: 'arrow' })
            },
        ]
    };

    toolbarGroups.splice(toolbarGroups.length - 1, 0, shapeGroup);

    return (
        <div className="editor-toolbar">
            {toolbarGroups.map((group, groupIndex) => (
                <div key={group.name} className="toolbar-group">
                    {group.items.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={index}
                                onClick={item.action}
                                disabled={item.disabled}
                                className={`btn-icon toolbar-btn ${item.isActive?.() ? 'active' : ''}`}
                                title={item.label}
                                type="button"
                            >
                                <Icon size={18} />
                            </button>
                        );
                    })}
                    {groupIndex < toolbarGroups.length - 1 && <div className="toolbar-divider" />}
                </div>
            ))}
        </div>
    );
};

export default EditorToolbar;
