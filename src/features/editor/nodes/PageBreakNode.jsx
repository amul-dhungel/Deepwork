import { DecoratorNode } from 'lexical';

export class PageBreakNode extends DecoratorNode {
    static getType() {
        return 'page-break';
    }

    static clone(node) {
        return new PageBreakNode(node.__key);
    }

    static importJSON(serializedNode) {
        return $createPageBreakNode();
    }

    exportJSON() {
        return {
            type: 'page-break',
            version: 1,
        };
    }

    createDOM() {
        const div = document.createElement('div');
        div.className = 'page-break';
        div.contentEditable = 'false';
        div.innerHTML = `
            <div class="page-break-line"></div>
            <div class="page-break-label">Page Break</div>
        `;
        return div;
    }

    updateDOM() {
        return false;
    }

    decorate() {
        return null;
    }

    isInline() {
        return false;
    }

    isKeyboardSelectable() {
        return true;
    }
}

export function $createPageBreakNode() {
    return new PageBreakNode();
}

export function $isPageBreakNode(node) {
    return node instanceof PageBreakNode;
}
