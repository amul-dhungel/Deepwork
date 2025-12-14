
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHorizontalRuleNode } from "../nodes/HorizontalRuleNode.jsx";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { COMMAND_PRIORITY_EDITOR, createCommand } from "lexical";
import { useEffect } from "react";

export const INSERT_HORIZONTAL_RULE_COMMAND = createCommand('INSERT_HORIZONTAL_RULE_COMMAND');

export default function HorizontalRulePlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            INSERT_HORIZONTAL_RULE_COMMAND,
            (type) => {
                const selection = editor.getEditorState().read(() => window.getSelection()); // hacky? No, useLexical logic better.
                // Actually, simple insert:
                const hr = $createHorizontalRuleNode();
                $insertNodeToNearestRoot(hr);
                return true;
            },
            COMMAND_PRIORITY_EDITOR,
        );
    }, [editor]);

    return null;
}
