import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ShapeComponent from '../components/Editor/ShapeComponent';

export default Node.create({
    name: 'shape',

    group: 'block',

    atom: true,

    draggable: true,

    addAttributes() {
        return {
            type: {
                default: 'rectangle',
            },
            width: {
                default: 100,
            },
            height: {
                default: 100,
            },
            fill: {
                default: '#3b82f6',
            },
            stroke: {
                default: '#2563eb',
            },
            strokeWidth: {
                default: 2,
            },
            align: {
                default: 'center',
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div-shape',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div-shape', mergeAttributes(HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ShapeComponent);
    },
});
