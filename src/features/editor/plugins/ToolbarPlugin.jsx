
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useState } from "react";
import {
    SELECTION_CHANGE_COMMAND,
    FORMAT_TEXT_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    $getSelection,
    $isRangeSelection,
    UNDO_COMMAND,
    REDO_COMMAND,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    $createParagraphNode,
    $insertNodes
} from "lexical";
import {
    $createHeadingNode,
    $createQuoteNode,
    $isHeadingNode
} from "@lexical/rich-text";
import {
    $setBlocksType,
    $patchStyleText
} from "@lexical/selection";
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    INSERT_CHECK_LIST_COMMAND,
    $isListNode,
    ListNode
} from "@lexical/list";
import {
    INSERT_TABLE_COMMAND
} from "@lexical/table";
import {
    $createCodeNode
} from "@lexical/code";
import { mergeRegister } from "@lexical/utils";
import {
    Bold, Italic, Underline, Strikethrough, Code,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Undo as UndoIcon, Redo as RedoIcon,
    ChevronDown, Type, Minus, Plus,
    List, ListOrdered, CheckSquare,
    Quote, Heading1, Heading2, Heading3,
    FileImage, Table as TableIcon, Minus as HRIcon,
    LayoutTemplate, PenTool, SeparatorHorizontal
} from 'lucide-react';

import DropDown, { DropDownItem } from "../ui/DropDown";
import Divider from "../ui/Divider";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "./HorizontalRulePlugin";
import { INSERT_IMAGE_COMMAND } from "./ImagesPlugin";
import { INSERT_EXCALIDRAW_COMMAND } from "./ExcalidrawPlugin";
import { INSERT_PAGE_BREAK_COMMAND } from "./PageBreakPlugin";
import { $createExcalidrawNode } from "../nodes/ExcalidrawNode";
import ImageUploadModal from "../components/ImageUploadModal";

import "../components/EditorToolbar.css";

const LowPriority = 1;

export default function ToolbarPlugin() {
    const [editor] = useLexicalComposerContext();
    const [showImageModal, setShowImageModal] = useState(false);
    const [toolbarState, setToolbarState] = useState({
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrikethrough: false,
        isCode: false,
        blockType: "paragraph",
        fontSize: "15px",
        fontFamily: "Arial",
    });
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const element = anchorNode.getKey() === "root" ? anchorNode : anchorNode.getTopLevelElementOrThrow();
            const elementKey = element.getKey();
            const elementDOM = editor.getElementByKey(elementKey);

            let blockType = element.getType();
            if ($isListNode(element)) {
                const parentList = element.getParent();
                if ($isListNode(parentList)) {
                    // Handle nested logic if strictly needed, usually element type is enough
                }
            }

            setToolbarState(prev => ({
                ...prev,
                isBold: selection.hasFormat("bold"),
                isItalic: selection.hasFormat("italic"),
                isUnderline: selection.hasFormat("underline"),
                isStrikethrough: selection.hasFormat("strikethrough"),
                isCode: selection.hasFormat("code"),
                blockType: blockType,
            }));
        }
    }, [editor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(updateToolbar);
            }),
            editor.registerCommand(SELECTION_CHANGE_COMMAND, () => { updateToolbar(); return false; }, LowPriority),
            editor.registerCommand(CAN_UNDO_COMMAND, (payload) => { setCanUndo(payload); return false; }, LowPriority),
            editor.registerCommand(CAN_REDO_COMMAND, (payload) => { setCanRedo(payload); return false; }, LowPriority)
        );
    }, [editor, updateToolbar]);

    const formatBlock = (type) => {
        if (type === 'paragraph') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createParagraphNode());
            });
        }
        else if (type === 'h1') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode('h1'));
            });
        }
        else if (type === 'h2') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode('h2'));
            });
        }
        else if (type === 'h3') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createHeadingNode('h3'));
            });
        }
        else if (type === 'quote') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createQuoteNode());
            });
        }
        else if (type === 'code') {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) $setBlocksType(selection, () => $createCodeNode());
            });
        }
        else if (type === 'bullet') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }
        else if (type === 'number') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }
        else if (type === 'check') {
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
        }
    };

    const insertImage = () => {
        setShowImageModal(true);
    };

    const handleImageInsert = (imageData) => {
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, imageData);
    };

    const insertTable = () => {
        editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: "3", rows: "3" });
    };

    const testExcalidraw = () => {
        // Test with your exact flowchart data
        const testData = JSON.stringify({
            "type": "excalidraw",
            "elements": [
                { "id": "start", "type": "ellipse", "x": 200, "y": 100, "width": 120, "height": 60, "strokeColor": "#000000", "backgroundColor": "#40c057", "fillStyle": "solid", "strokeWidth": 2, "roughness": 1, "opacity": 100 },
                { "id": "process1", "type": "rectangle", "x": 180, "y": 220, "width": 160, "height": 60, "strokeColor": "#000000", "backgroundColor": "#a5d8ff", "fillStyle": "solid", "strokeWidth": 2, "roughness": 1, "opacity": 100 },
                { "id": "decision1", "type": "diamond", "x": 180, "y": 340, "width": 160, "height": 100, "strokeColor": "#000000", "backgroundColor": "#ffec99", "fillStyle": "solid", "strokeWidth": 2, "roughness": 1, "opacity": 100 }
            ]
        });

        editor.update(() => {
            const excalidrawNode = $createExcalidrawNode(testData);
            $insertNodes([excalidrawNode]);
        });
    };

    const blockTypeMap = {
        'paragraph': 'Normal',
        'h1': 'Heading 1',
        'h2': 'Heading 2',
        'h3': 'Heading 3',
        'quote': 'Quote',
        'code': 'Code Block',
        'list': 'List',
    };

    return (
        <>
            <div className="toolbar">
                <button disabled={!canUndo} onClick={() => editor.dispatchCommand(UNDO_COMMAND)} className="toolbar-item"><UndoIcon size={18} /></button>
                <button disabled={!canRedo} onClick={() => editor.dispatchCommand(REDO_COMMAND)} className="toolbar-item"><RedoIcon size={18} /></button>
                <Divider />

                {/* Block Format */}
                <DropDown label={blockTypeMap[toolbarState.blockType] || "Normal"}>
                    <DropDownItem onClick={() => formatBlock('paragraph')} active={toolbarState.blockType === 'paragraph'}><span className="icon"><Type size={14} /></span> Normal</DropDownItem>
                    <DropDownItem onClick={() => formatBlock('h1')} active={toolbarState.blockType === 'h1'}><span className="icon"><Heading1 size={14} /></span> Heading 1</DropDownItem>
                    <DropDownItem onClick={() => formatBlock('h2')} active={toolbarState.blockType === 'h2'}><span className="icon"><Heading2 size={14} /></span> Heading 2</DropDownItem>
                    <DropDownItem onClick={() => formatBlock('h3')} active={toolbarState.blockType === 'h3'}><span className="icon"><Heading3 size={14} /></span> Heading 3</DropDownItem>
                    <DropDownItem onClick={() => formatBlock('bullet')}><span className="icon"><List size={14} /></span> Bullet List</DropDownItem>
                    <DropDownItem onClick={() => formatBlock('number')}><span className="icon"><ListOrdered size={14} /></span> Numbered List</DropDownItem>
                    <DropDownItem onClick={() => formatBlock('check')}><span className="icon"><CheckSquare size={14} /></span> Check List</DropDownItem>
                    <DropDownItem onClick={() => formatBlock('quote')} active={toolbarState.blockType === 'quote'}><span className="icon"><Quote size={14} /></span> Quote</DropDownItem>
                    <DropDownItem onClick={() => formatBlock('code')} active={toolbarState.blockType === 'code'}><span className="icon"><Code size={14} /></span> Code Block</DropDownItem>
                </DropDown>

                <Divider />

                {/* Font - Simplified */}
                <DropDown label={toolbarState.fontFamily} icon={<Type size={14} />}>
                    <DropDownItem onClick={() => editor.update(() => $patchStyleText($getSelection(), { 'font-family': 'Arial' }))}>Arial</DropDownItem>
                    <DropDownItem onClick={() => editor.update(() => $patchStyleText($getSelection(), { 'font-family': 'Times New Roman' }))}>Times New Roman</DropDownItem>
                    <DropDownItem onClick={() => editor.update(() => $patchStyleText($getSelection(), { 'font-family': 'Courier New' }))}>Courier New</DropDownItem>
                </DropDown>

                <div className="flex items-center gap-1 mx-1">
                    <button className="toolbar-item" onClick={() => {/* Decrease Font logic */ }}><Minus size={14} /></button>
                    <span className="text-sm px-1">15</span>
                    <button className="toolbar-item" onClick={() => {/* Increase Font logic */ }}><Plus size={14} /></button>
                </div>

                <Divider />

                <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")} className={"toolbar-item " + (toolbarState.isBold ? "active" : "")}><Bold size={18} /></button>
                <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")} className={"toolbar-item " + (toolbarState.isItalic ? "active" : "")}><Italic size={18} /></button>
                <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")} className={"toolbar-item " + (toolbarState.isUnderline ? "active" : "")}><Underline size={18} /></button>
                <button onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")} className={"toolbar-item " + (toolbarState.isCode ? "active" : "")}><Code size={18} /></button>

                <Divider />

                <button onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')} className="toolbar-item"><AlignLeft size={18} /></button>
                <button onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')} className="toolbar-item"><AlignCenter size={18} /></button>
                <button onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')} className="toolbar-item"><AlignRight size={18} /></button>
                <Divider />

                <button
                    onClick={() => editor.dispatchCommand(INSERT_EXCALIDRAW_COMMAND, undefined)}
                    className="toolbar-item"
                    title="Insert Diagram"
                >
                    <PenTool size={18} />
                </button>

                <button
                    onClick={testExcalidraw}
                    className="toolbar-item"
                    style={{ backgroundColor: '#40c057', color: 'white', fontWeight: 'bold' }}
                    title="TEST: Insert Sample Flowchart"
                >
                    🧪 TEST
                </button>

                <Divider />

                {/* INSERT MENU */}
                <DropDown label="Insert" icon={<LayoutTemplate size={14} />}>
                    <DropDownItem onClick={insertTable}>
                        <span className="icon"><TableIcon size={14} /></span> Table (3×3)
                    </DropDownItem>
                    <DropDownItem onClick={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}>
                        <span className="icon"><HRIcon size={14} /></span> Horizontal Rule
                    </DropDownItem>
                    <DropDownItem onClick={() => editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined)}>
                        <span className="icon"><SeparatorHorizontal size={14} /></span> Page Break
                    </DropDownItem>
                    <DropDownItem onClick={() => editor.dispatchCommand(INSERT_EXCALIDRAW_COMMAND, undefined)}>
                        <span className="icon"><PenTool size={14} /></span> Diagram (Manual)
                    </DropDownItem>
                    <DropDownItem onClick={insertImage}>
                        <span className="icon"><FileImage size={14} /></span> Insert Image
                    </DropDownItem>
                </DropDown>
            </div>

            <ImageUploadModal
                isOpen={showImageModal}
                onClose={() => setShowImageModal(false)}
                onInsert={handleImageInsert}
            />
        </>
    );
}
