
import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { marked } from "marked";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableNode, TableCellNode, TableRowNode, $createTableNode, $createTableRowNode, $createTableCellNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $insertNodes, $createParagraphNode, $createTextNode } from "lexical";

import { EditorTheme } from "./EditorTheme";
import { GlimmerNode } from "../extensions/GlimmerNode";
import { HorizontalRuleNode } from "../nodes/HorizontalRuleNode";
import { ImageNode, $createImageNode, $isImageNode } from "../nodes/ImageNode";

import ToolbarPlugin from "../plugins/ToolbarPlugin";
import FloatingToolbarPlugin from "../plugins/FloatingToolbarPlugin";
import HorizontalRulePlugin from "../plugins/HorizontalRulePlugin";
import ImagesPlugin from "../plugins/ImagesPlugin";
import CodeHighlightPlugin from "../plugins/CodeHighlightPlugin";

import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";

import "./RichTextEditor.css";

const MARKDOWN_TABLE = {
    dependencies: [TableNode, TableRowNode, TableCellNode],
    export: (node) => null, // Export logic can be added if needed
    // Regex to match GFM Table: Optional leading whitespace + Header + Separator + Body
    // Improved to handle leading newlines and varied row content
    regExp: /^\s*\|([^\n]+)\|\s*\n\s*\|([-:| ]+)\|\s*\n((?:\|[^\n]+\|\s*\n?)*)/,
    replace: (parentNode, _1, match) => {
        console.log("Detecting Table Match:", match); // DEBUG LOG to confirm detection
        // match[0] is the full match including leading whitespace
        // match[1] is Header Row Content
        // match[2] is Separator Row Content
        // match[3] is Body Content

        const tableNode = $createTableNode();

        // Helper to process a line into a row
        const addRow = (lineText, isHeader) => {
            const rowNode = $createTableRowNode();
            const cleanLine = lineText.trim();
            if (!cleanLine) return;

            const cells = cleanLine.split('|');
            if (cleanLine.startsWith('|')) cells.shift();
            if (cleanLine.endsWith('|')) cells.pop();

            cells.forEach(cellText => {
                const cellNode = $createTableCellNode(isHeader ? 1 : 0);
                const p = $createParagraphNode();
                p.append($createTextNode(cellText.trim()));
                cellNode.append(p);
                rowNode.append(cellNode);
            });
            tableNode.append(rowNode);
        };

        // 1. Add Header
        addRow(match[1], true);

        // 2. Add Body Rows
        const bodyLines = match[3].trim().split(/\r?\n/);
        bodyLines.forEach(line => addRow(line, false));

        parentNode.append(tableNode);
    },
    type: 'element',
};

const IMAGE = {
    dependencies: [ImageNode],
    export: (node) => {
        if (!$isImageNode(node)) {
            return null;
        }
        return `![${node.__alt}](${node.__src})`;
    },
    importRegExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))/,
    regExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))$/,
    replace: (textNode, match) => {
        const [, alt, src] = match;
        const imageNode = $createImageNode({
            alt,
            src,
            maxWidth: 800,
        });
        textNode.replace(imageNode);
    },
    trigger: ')',
    type: 'text-match',
};

// Combine default transformers with Custom Table and Image support
const MD_TRANSFORMERS = [MARKDOWN_TABLE, IMAGE, ...TRANSFORMERS];

function Placeholder() {
    return <div className="editor-placeholder">Start writing your document here...</div>;
}

const editorConfig = {
    namespace: "WordAssistantEditor",
    theme: EditorTheme,
    onError(error) {
        throw error;
    },
    nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        AutoLinkNode,
        LinkNode,
        GlimmerNode,
        HorizontalRuleNode,
        ImageNode
    ],
};

import { $convertFromMarkdownString } from "@lexical/markdown";

// Plugin to handle ref methods
const EditorRefPlugin = forwardRef((props, ref) => {
    const [editor] = useLexicalComposerContext();

    useImperativeHandle(ref, () => ({
        insertContent: (html) => {
            editor.update(() => {
                const parser = new DOMParser();
                const dom = parser.parseFromString(html, "text/html");
                const nodes = $generateNodesFromDOM(editor, dom);
                $insertNodes(nodes);
            });
        },
        insertMarkdown: (markdownText) => {
            // Use 'marked' for robust GFM -> HTML conversion
            const htmlContent = marked.parse(markdownText);

            // Then insert via Lexical HTML Converter
            editor.update(() => {
                const parser = new DOMParser();
                const dom = parser.parseFromString(htmlContent, "text/html");
                const nodes = $generateNodesFromDOM(editor, dom);
                $insertNodes(nodes);
            });
        },
        insertHtml: (htmlString) => {
            editor.update(() => {
                const parser = new DOMParser();
                const dom = parser.parseFromString(htmlString, "text/html");
                const nodes = $generateNodesFromDOM(editor, dom);
                $insertNodes(nodes);
            });
        },
        insertPageBreak: () => {
            editor.update(() => {
                const p = $createParagraphNode();
                $insertNodes([p]);
            });
        }
    }));

    return null;
});

// Plugin to load initial content
function HtmlLoaderPlugin({ initialHtml }) {
    const [editor] = useLexicalComposerContext();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!isLoaded && initialHtml) {
            editor.update(() => {
                const head = $getRoot().getFirstChild();
                if (head) return; // Already has content?

                const parser = new DOMParser();
                const dom = parser.parseFromString(initialHtml, "text/html");
                const nodes = $generateNodesFromDOM(editor, dom);
                $getRoot().select();
                $insertNodes(nodes);
            });
            setIsLoaded(true);
        }
    }, [editor, initialHtml, isLoaded]);

    return null;
}

const RichTextEditor = forwardRef(({ content, onChange, modelProvider }, ref) => {

    const handleOnChange = (editorState, editor) => {
        editorState.read(() => {
            const htmlString = $generateHtmlFromNodes(editor, null);
            if (onChange) {
                onChange(htmlString);
            }
        });
    };

    return (
        <LexicalComposer initialConfig={editorConfig}>
            <div className="editor-shell">
                <ToolbarPlugin />
                <div className="editor-container">
                    <RichTextPlugin
                        contentEditable={<ContentEditable className="editor-input" />}
                        placeholder={<Placeholder />}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <AutoFocusPlugin />
                    <ListPlugin />
                    <CheckListPlugin />
                    <LinkPlugin />
                    <TablePlugin />
                    <HorizontalRulePlugin />
                    <ImagesPlugin />
                    <CodeHighlightPlugin />
                    <TabIndentationPlugin />
                    <MarkdownShortcutPlugin transformers={MD_TRANSFORMERS} />

                    <OnChangePlugin onChange={handleOnChange} />
                    <FloatingToolbarPlugin />

                    <EditorRefPlugin ref={ref} />
                    <HtmlLoaderPlugin initialHtml={content} />
                </div>
            </div>
        </LexicalComposer>
    );
});

export default RichTextEditor;
