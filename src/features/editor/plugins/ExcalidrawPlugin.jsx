
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes, COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical';
import { useEffect, useState } from 'react';
import { $createExcalidrawNode, ExcalidrawNode } from '../nodes/ExcalidrawNode';
import ExcalidrawModal from '../components/ExcalidrawModal';

export const INSERT_EXCALIDRAW_COMMAND = createCommand('INSERT_EXCALIDRAW_COMMAND');

export default function ExcalidrawPlugin() {
    const [editor] = useLexicalComposerContext();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // We can track which node we are editing. If null, we are creating new.
    // However, Lexical approach usually inserts a node, and the Node itself manages the UI 
    // or we update the node from here.
    // For simplicity:
    // 1. Insert new: opens modal -> save -> insert node.
    // 2. Edit existing: (Requires Interaction logic, potentially separate)

    // Let's first implement "Insert New".

    useEffect(() => {
        if (!editor.hasNodes([ExcalidrawNode])) {
            throw new Error('ExcalidrawPlugin: ExcalidrawNode not registered on editor');
        }

        return editor.registerCommand(
            INSERT_EXCALIDRAW_COMMAND,
            () => {
                setIsModalOpen(true);
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    const handleSave = (elements, files) => {
        editor.update(() => {
            const excalidrawNode = $createExcalidrawNode({ elements, files });
            $insertNodes([excalidrawNode]);
        });
        setIsModalOpen(false);
    };

    return (
        <ExcalidrawModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            initialElements={[]}
            initialFiles={{}}
        />
    );
}
