
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
import { ExcalidrawNode, $createExcalidrawNode } from "../nodes/ExcalidrawNode";
import { PageBreakNode } from "../nodes/PageBreakNode";
import { HtmlSnippetNode, $createHtmlSnippetNode } from "../nodes/HtmlSnippetNode";

import ToolbarPlugin from "../plugins/ToolbarPlugin";
import FloatingToolbarPlugin from "../plugins/FloatingToolbarPlugin";
import HorizontalRulePlugin from "../plugins/HorizontalRulePlugin";
import ImagesPlugin from "../plugins/ImagesPlugin";
import CodeHighlightPlugin from "../plugins/CodeHighlightPlugin";
import ExcalidrawPlugin from "../plugins/ExcalidrawPlugin";
import TableActionMenuPlugin from "../plugins/TableActionMenuPlugin";
import DraggableBlockPlugin from "../plugins/DraggableBlockPlugin";
import PageBreakPlugin from "../plugins/PageBreakPlugin";

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
        ImageNode,
        ExcalidrawNode,
        PageBreakNode,
        HtmlSnippetNode
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
            console.log('📝 insertMarkdown called with:', markdownText.substring(0, 100));

            // STEP 1: Check for Raw HTML Snippet (Gift Card Mode)
            if (markdownText.includes('<div style=') || markdownText.includes('<div class="gift-card"')) {
                console.log('🎁 Detected HTML Snippet / Gift Card content');
                editor.update(() => {
                    const snippetNode = $createHtmlSnippetNode(markdownText);
                    $insertNodes([snippetNode]);
                    $insertNodes([$createParagraphNode()]);
                });
                return;
            }

            // STEP 2: Strip markdown code blocks if they wrap Excalidraw JSON
            let processedText = markdownText;

            // Check if contains excalidraw wrapped in code blocks
            if (markdownText.includes('excalidraw') && markdownText.includes('```')) {
                console.log('🔧 Preprocessing: Stripping code blocks...');
                // Remove ```json or ``` wrappers
                processedText = markdownText.replace(/```json\s*\n/g, '').replace(/```\s*\n/g, '').replace(/\n```/g, '').replace(/```/g, '');
            }

            // STEP 2: Detect Excalidraw JSON patterns
            const excalidrawPattern = /\{"type"\s*:\s*"excalidraw"/g;
            const matches = [...processedText.matchAll(excalidrawPattern)];

            if (matches.length > 0) {
                console.log(`🎨 Found ${matches.length} potential Excalidraw diagram(s)`);

                const diagrams = [];

                // Extract complete JSON objects for each match
                for (const match of matches) {
                    const startPos = match.index;
                    let braceCount = 0;
                    let endPos = -1;
                    let inString = false;
                    let escape = false;

                    // Parse JSON by counting braces
                    for (let i = startPos; i < processedText.length; i++) {
                        const char = processedText[i];

                        if (escape) {
                            escape = false;
                            continue;
                        }
                        if (char === '\\') {
                            escape = true;
                            continue;
                        }
                        if (char === '"') {
                            inString = !inString;
                            continue;
                        }
                        if (!inString) {
                            if (char === '{') braceCount++;
                            if (char === '}') {
                                braceCount--;
                                if (braceCount === 0) {
                                    endPos = i + 1;
                                    break;
                                }
                            }
                        }
                    }

                    if (endPos > 0) {
                        const jsonStr = processedText.substring(startPos, endPos);
                        try {
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.type === 'excalidraw' && Array.isArray(parsed.elements)) {
                                diagrams.push({ start: startPos, end: endPos, json: jsonStr });
                                console.log(`✅ Valid Excalidraw diagram with ${parsed.elements.length} elements`);
                            }
                        } catch (e) {
                            console.warn('⚠️ JSON parse failed:', e.message);
                        }
                    }
                }

                if (diagrams.length > 0) {
                    // STEP 3: Split content into text and diagram parts
                    const parts = [];
                    let lastEnd = 0;

                    for (const diagram of diagrams) {
                        // Add text before diagram
                        if (diagram.start > lastEnd) {
                            const text = processedText.substring(lastEnd, diagram.start).trim();
                            if (text) parts.push({ type: 'text', content: text });
                        }
                        // Add diagram
                        parts.push({ type: 'diagram', content: diagram.json });
                        lastEnd = diagram.end;
                    }

                    // Add remaining text after last diagram
                    if (lastEnd < processedText.length) {
                        const text = processedText.substring(lastEnd).trim();
                        if (text) parts.push({ type: 'text', content: text });
                    }

                    // STEP 4: Insert all parts into editor
                    editor.update(() => {
                        for (const part of parts) {
                            if (part.type === 'text') {
                                // Convert markdown to HTML
                                const html = marked.parse(part.content);
                                const dom = new DOMParser().parseFromString(html, "text/html");
                                const nodes = $generateNodesFromDOM(editor, dom);
                                $insertNodes(nodes);
                            } else if (part.type === 'diagram') {
                                // Create Excalidraw node with JSON string
                                const excalidrawNode = $createExcalidrawNode(part.content);
                                $insertNodes([excalidrawNode]);
                            }
                        }
                    });

                    console.log(`✅ Successfully inserted ${diagrams.length} diagram(s)`);
                    return;
                }
            } else {
                console.log('📄 No Excalidraw diagrams found, processing as regular markdown');
            }

            // FALLBACK: Standard markdown processing for non-diagram content
            const htmlContent = marked.parse(processedText);
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
                    <TableActionMenuPlugin />
                    <HorizontalRulePlugin />
                    <ImagesPlugin />
                    <ExcalidrawPlugin />
                    <PageBreakPlugin />
                    <CodeHighlightPlugin />
                    <TabIndentationPlugin />
                    <MarkdownShortcutPlugin transformers={MD_TRANSFORMERS} />

                    <OnChangePlugin onChange={handleOnChange} />
                    <FloatingToolbarPlugin />
                    <DraggableBlockPlugin />

                    <EditorRefPlugin ref={ref} />
                    <HtmlLoaderPlugin initialHtml={content} />
                </div>
            </div>
        </LexicalComposer>
    );
});

export default RichTextEditor;
