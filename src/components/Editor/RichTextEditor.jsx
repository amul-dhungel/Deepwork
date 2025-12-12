import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';

import ShapeExtension from '../../extensions/ShapeExtension';
import EditorToolbar from './EditorToolbar';
import FontControls from './FontControls';
import './RichTextEditor.css';
import { useEffect, forwardRef, useImperativeHandle } from 'react';

const RichTextEditor = forwardRef(({ content, onChange }, ref) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            // Underline, // Removed to fix duplicate warning
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            FontFamily,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Subscript,
            Superscript,
            Image.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'editor-image',
                },
            }),
            CharacterCount, // Added to fix crash
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'editor-table',
                },
            }),
            TableRow,
            TableHeader,
            TableCell,
            ShapeExtension,
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose-editor',
            },
        },
    });

    useImperativeHandle(ref, () => ({
        insertContent: (html) => {
            editor?.chain().focus().insertContent(html).run();
        },
        insertPageBreak: () => {
            editor?.chain().focus().insertContent('<hr class="page-break" />').run();
        }
    }));

    return (
        <div className="editor-wrapper">
            <EditorToolbar editor={editor} />
            <div className="editor-scroller">
                <EditorContent editor={editor} />
            </div>

            <div className="editor-footer">
                <span>{editor?.storage.characterCount.words()} words</span>
            </div>
        </div>
    );
});

export default RichTextEditor;
