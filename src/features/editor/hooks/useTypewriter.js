
import { useRef, useCallback } from 'react';

export const useTypewriter = (editorRef) => {
    const typingIntervalRef = useRef(null);
    const isTypingRef = useRef(false);

    const typeContent = useCallback((text) => {
        if (editorRef.current && text) {
            if (isTypingRef.current) {
                clearInterval(typingIntervalRef.current);
                isTypingRef.current = false;
            }

            // Improved parsing logic for safer insertion
            const blocks = text.split(/(?<=<\/h[1-6]>)|(?<=<\/p>)|(?<=<\/div>)|(?<=<\/ul>)|(?<=<\/ol>)|(?<=<hr[^>]*\/>)|(?<=<\/table>)/g)
                .filter(chunk => chunk && chunk.trim().length > 0);

            if (blocks.length === 0) {
                editorRef.current.insertContent(text);
                return;
            }

            isTypingRef.current = true;
            let blockIndex = 0;

            // Type each block
            typingIntervalRef.current = setInterval(() => {
                if (blockIndex < blocks.length) {
                    editorRef.current.insertContent(blocks[blockIndex]);
                    blockIndex++;
                } else {
                    clearInterval(typingIntervalRef.current);
                    isTypingRef.current = false;
                }
            }, 100);
        }
    }, [editorRef]);

    const cancelTyping = useCallback(() => {
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            isTypingRef.current = false;
        }
    }, []);

    return { typeContent, cancelTyping, isTyping: isTypingRef.current };
};
