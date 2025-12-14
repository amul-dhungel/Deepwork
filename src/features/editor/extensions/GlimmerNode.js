
import { ElementNode } from "lexical";
import { addClassNamesToElement } from "@lexical/utils";

export class GlimmerNode extends ElementNode {
    static getType() {
        return "glimmer";
    }

    static clone(node) {
        return new GlimmerNode(node.__key);
    }

    createDOM(config) {
        const element = document.createElement("span");
        addClassNamesToElement(element, "ai-glimmer-text");
        return element;
    }

    updateDOM(prevNode, dom, config) {
        return false;
    }

    canInsertTextAfter() {
        return false;
    }

    canInsertTextBefore() {
        return false;
    }

    isInline() {
        return true;
    }
}

export function $createGlimmerNode() {
    return new GlimmerNode();
}

export function $isGlimmerNode(node) {
    return node instanceof GlimmerNode;
}
