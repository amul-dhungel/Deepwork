
import {
    $createParagraphNode,
    $isNodeSelection,
    DecoratorNode,
} from 'lexical';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
} from 'lexical';
import { useEffect, useCallback } from 'react';

function HorizontalRuleComponent({ nodeKey }) {
    const [editor] = useLexicalComposerContext();
    const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);

    const onDelete = useCallback(
        (payload) => {
            if (isSelected && $isNodeSelection(payload)) {
                const event = payload;
                event.preventDefault();
                const node = $getNodeByKey(nodeKey);
                if ($isHorizontalRuleNode(node)) {
                    node.remove();
                    return true;
                }
            }
            return false;
        },
        [isSelected, nodeKey]
    );

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                CLICK_COMMAND,
                (event) => {
                    const hrElem = editor.getElementByKey(nodeKey);
                    if (event.target === hrElem) {
                        if (!event.shiftKey) {
                            clearSelection();
                        }
                        setSelected(!isSelected);
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                KEY_DELETE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                KEY_BACKSPACE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, isSelected, onDelete, setSelected, clearSelection, nodeKey]);

    useEffect(() => {
        const hrElem = editor.getElementByKey(nodeKey);
        if (hrElem !== null) {
            hrElem.className = isSelected ? 'editor-hr selected' : 'editor-hr';
        }
    }, [editor, isSelected, nodeKey]);

    return <hr className={isSelected ? 'editor-hr selected' : 'editor-hr'} />;
}

export class HorizontalRuleNode extends DecoratorNode {
    static getType() {
        return 'horizontalrule';
    }

    static clone(node) {
        return new HorizontalRuleNode(node.__key);
    }

    static importJSON(serializedNode) {
        return $createHorizontalRuleNode();
    }

    exportJSON() {
        return {
            type: 'horizontalrule',
            version: 1,
        };
    }

    createDOM(config) {
        const element = document.createElement('div');
        element.style.display = 'contents';
        return element;
    }

    getTextContent() {
        return '\n';
    }

    updateDOM() {
        return false;
    }

    decorate() {
        return <HorizontalRuleComponent nodeKey={this.__key} />;
    }
}

export function $createHorizontalRuleNode() {
    return new HorizontalRuleNode();
}

export function $isHorizontalRuleNode(node) {
    return node instanceof HorizontalRuleNode;
}
