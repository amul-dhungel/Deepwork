import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { $createPageBreakNode } from '../nodes/PageBreakNode';

export const INSERT_PAGE_BREAK_COMMAND = createCommand('INSERT_PAGE_BREAK_COMMAND');

export default function PageBreakPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            INSERT_PAGE_BREAK_COMMAND,
            () => {
                const pageBreakNode = $createPageBreakNode();
                $insertNodeToNearestRoot(pageBreakNode);
                return true;
            },
            COMMAND_PRIORITY_EDITOR,
        );
    }, [editor]);

    return null;
}
