import marked from 'marked';
import { highlightElement } from '../highlighter';

marked.setOptions({
    highlight: null,
    langPrefix: 'language-'
});

export function updatePreview(markdown: string, preview: HTMLElement) {
    preview.innerHTML = marked(markdown);
    preview.querySelectorAll('pre code').forEach(highlightElement);
}
