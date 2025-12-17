import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef, useState, useCallback } from 'react';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW } from 'lexical';
import {
    $getTableCellNodeFromLexicalNode,
    $getTableNodeFromLexicalNodeOrThrow,
    $insertTableRow__EXPERIMENTAL,
    $insertTableColumn__EXPERIMENTAL,
    $deleteTableRow__EXPERIMENTAL,
    $deleteTableColumn__EXPERIMENTAL,
    TableCellNode,
    $isTableSelection,
} from '@lexical/table';
import { $getNodeByKey } from 'lexical';
import {
    TableIcon, Plus, Minus, Trash2,
    ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
    Merge, Split
} from 'lucide-react';
import '../components/TableActionMenu.css';

export default function TableActionMenuPlugin() {
    const [editor] = useLexicalComposerContext();
    const [menuPosition, setMenuPosition] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);
    const menuRef = useRef(null);

    const updateMenu = useCallback(() => {
        editor.getEditorState().read(() => {
            const selection = $getSelection();

            if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
                setMenuPosition(null);
                return;
            }

            const anchor = selection.anchor;
            const anchorNode = anchor.getNode();

            const tableCellNode = $getTableCellNodeFromLexicalNode(anchorNode);

            if (tableCellNode) {
                setSelectedCell(tableCellNode.getKey());

                // Get DOM element for positioning
                const cellElement = editor.getElementByKey(tableCellNode.getKey());
                if (cellElement) {
                    const rect = cellElement.getBoundingClientRect();
                    setMenuPosition({
                        top: rect.bottom + window.scrollY + 8,
                        left: rect.left + window.scrollX,
                    });
                }
            } else {
                setMenuPosition(null);
            }
        });
    }, [editor]);

    useEffect(() => {
        return editor.registerUpdateListener(() => {
            updateMenu();
        });
    }, [editor, updateMenu]);

    const executeTableAction = (action) => {
        editor.update(() => {
            if (!selectedCell) return;

            const cellNode = $getNodeByKey(selectedCell);
            if (!cellNode || !(cellNode instanceof TableCellNode)) return;

            const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);

            switch (action) {
                case 'insertRowAbove':
                    $insertTableRow__EXPERIMENTAL(false);
                    break;
                case 'insertRowBelow':
                    $insertTableRow__EXPERIMENTAL(true);
                    break;
                case 'insertColumnLeft':
                    $insertTableColumn__EXPERIMENTAL(false);
                    break;
                case 'insertColumnRight':
                    $insertTableColumn__EXPERIMENTAL(true);
                    break;
                case 'deleteRow':
                    $deleteTableRow__EXPERIMENTAL();
                    break;
                case 'deleteColumn':
                    $deleteTableColumn__EXPERIMENTAL();
                    break;
                case 'deleteTable':
                    tableNode.remove();
                    break;
            }
        });

        // Close menu after action
        setMenuPosition(null);
    };

    if (!menuPosition) return null;

    return (
        <div
            ref={menuRef}
            className="table-action-menu"
            style={{
                position: 'absolute',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                zIndex: 1000,
            }}
        >
            <div className="menu-section">
                <button
                    className="menu-item"
                    onClick={() => executeTableAction('insertRowAbove')}
                    title="Insert row above"
                >
                    <ArrowUp size={16} />
                    <span>Insert Row Above</span>
                </button>
                <button
                    className="menu-item"
                    onClick={() => executeTableAction('insertRowBelow')}
                    title="Insert row below"
                >
                    <ArrowDown size={16} />
                    <span>Insert Row Below</span>
                </button>
            </div>

            <div className="menu-divider"></div>

            <div className="menu-section">
                <button
                    className="menu-item"
                    onClick={() => executeTableAction('insertColumnLeft')}
                    title="Insert column left"
                >
                    <ArrowLeft size={16} />
                    <span>Insert Column Left</span>
                </button>
                <button
                    className="menu-item"
                    onClick={() => executeTableAction('insertColumnRight')}
                    title="Insert column right"
                >
                    <ArrowRight size={16} />
                    <span>Insert Column Right</span>
                </button>
            </div>

            <div className="menu-divider"></div>

            <div className="menu-section">
                <button
                    className="menu-item danger"
                    onClick={() => executeTableAction('deleteRow')}
                    title="Delete row"
                >
                    <Minus size={16} />
                    <span>Delete Row</span>
                </button>
                <button
                    className="menu-item danger"
                    onClick={() => executeTableAction('deleteColumn')}
                    title="Delete column"
                >
                    <Minus size={16} />
                    <span>Delete Column</span>
                </button>
                <button
                    className="menu-item danger"
                    onClick={() => executeTableAction('deleteTable')}
                    title="Delete entire table"
                >
                    <Trash2 size={16} />
                    <span>Delete Table</span>
                </button>
            </div>
        </div>
    );
}
