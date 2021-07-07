import hljs from 'highlight.js/lib/core';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import powershell from 'highlight.js/lib/languages/powershell';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('css', css);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('ps', powershell);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);

const supportedLanguages: string[] = hljs.listLanguages();

export function highlightElement(el: HTMLElement) {
    el.classList.add('hljs');
    if (el.matches('[class^=language]')) {
        el.innerHTML = hljs.highlightAuto(el.innerText, supportedLanguages).value;
    }
}
