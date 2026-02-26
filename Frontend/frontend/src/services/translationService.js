import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/translate';

/**
 * Service to handle dynamic translation using the AI backend
 */
export const translationService = {
    /**
     * Translates a list of strings
     */
    translateBatch: async (texts, sourceLanguage, targetLanguage) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/batch`, {
                texts,
                source_language: sourceLanguage,
                target_language: targetLanguage,
            });
            return response.data.translations;
        } catch (error) {
            console.error('Translation failed:', error);
            throw error;
        }
    },

    /**
     * Crawls the DOM and translates all human-readable text
     */
    translateWholePage: async (targetLanguage) => {
        // 0. Wait for React to finish rendering initial pass
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log(`🚀 AI Engine: Scanning page for ${targetLanguage}...`);

        const sourceLanguage = 'english';

        // Internal helper to translate a set of nodes
        const processNodes = async (nodes) => {
            const validNodes = nodes.filter(n => {
                const val = n.nodeValue.trim();
                // Skip empty, numbers-only, or already translated (non-Latin) strings
                return val.length > 1 && !/^\d+$/.test(val) && !/[^\x00-\x7F]/.test(val);
            });

            if (validNodes.length === 0) return;

            const BATCH_SIZE = 15;
            for (let i = 0; i < validNodes.length; i += BATCH_SIZE) {
                const batch = validNodes.slice(i, i + BATCH_SIZE);
                const texts = batch.map(n => n.nodeValue.trim());
                try {
                    const translations = await translationService.translateBatch(texts, sourceLanguage, targetLanguage);
                    translations.forEach((t, idx) => {
                        if (batch[idx] && t) batch[idx].nodeValue = t;
                    });
                } catch (e) {
                    console.warn('Batch translation skipped');
                }
            }
        };

        // 1. Initial Scan
        const textNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                const val = node.nodeValue.trim();
                if (!val || val.length < 2 || /^\d+$/.test(val)) return NodeFilter.FILTER_REJECT;
                const parent = node.parentElement;
                if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'CANVAS', 'SVG', 'CODE', 'TEXTAREA'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        let node = walker.nextNode();
        while (node) {
            textNodes.push(node);
            node = walker.nextNode();
        }

        await processNodes(textNodes);

        // 2. Setup MutationObserver for dynamic React content
        if (window._translationObserver) window._translationObserver.disconnect();

        window._translationObserver = new MutationObserver((mutations) => {
            const newNodes = [];
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(addedNode => {
                    if (addedNode.nodeType === Node.TEXT_NODE) {
                        newNodes.push(addedNode);
                    } else if (addedNode.nodeType === Node.ELEMENT_NODE) {
                        const subWalker = document.createTreeWalker(addedNode, NodeFilter.SHOW_TEXT);
                        let subNode = subWalker.nextNode();
                        while (subNode) {
                            newNodes.push(subNode);
                            subNode = subWalker.nextNode();
                        }
                    }
                });
            });
            if (newNodes.length > 0) {
                processNodes(newNodes);
            }
        });

        window._translationObserver.observe(document.body, { childList: true, subtree: true });
        console.log('✨ AI Engine: Active & Monitoring for changes');
    }
};
