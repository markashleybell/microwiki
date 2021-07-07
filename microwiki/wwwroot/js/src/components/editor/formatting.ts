import * as CodeMirror from 'codemirror';

/* BEGIN Private Interfaces */

interface ICodeMirrorSelection {
    line: number;
    lineText: string;
    start: CodeMirror.Position;
    end: CodeMirror.Position;
    selectedText: string;
}

interface IFormattingOperation {
    [key: string]: (cm: CodeMirror.Editor, format: IEditorFormat, data?: any) => void;
    apply: (cm: CodeMirror.Editor, format: IEditorFormat, data?: any) => void;
    remove: (cm: CodeMirror.Editor, format: IEditorFormat, data?: any) => void;
}

interface IFormattingOperations {
    [key: string]: IFormattingOperation;
    inline: IFormattingOperation;
    block: IFormattingOperation;
}

/* END Private Interfaces */

/* BEGIN Public Interfaces */

export interface IEditorFormat {
    type: string;
    token?: string;
    before: string;
    after?: string;
    re?: RegExp;
    placeholder: string;
}

export interface IEditorFormats {
    [key: string]: IEditorFormat;
    h1: IEditorFormat;
    h2: IEditorFormat;
    h3: IEditorFormat;
    bold: IEditorFormat;
    italic: IEditorFormat;
    strikethrough: IEditorFormat;
    code: IEditorFormat;
    ol: IEditorFormat;
    ul: IEditorFormat;
    link: IEditorFormat;
    codeBlock: IEditorFormat;
    image: IEditorFormat;
}

export interface IEditorFormatTokens {
    [key: string]: string;
    'header-1': string;
    'header-2': string;
    'header-3': string;
    strong: string;
    em: string;
    strikethrough: string;
    comment: string;
}

export interface IHtmlLinkProperties {
    linkText: string;
    href: string;
    linkTitle?: string;
}

export interface IHtmlImageProperties {
    alt: string;
    url: string;
}

export interface ICodeBlockProperties {
    language: string;
}

export interface ICursorFormat {
    [key: string]: boolean;
    link: boolean;
    link_label: boolean;
    link_href: boolean;
    h1: boolean;
    h2: boolean;
    h3: boolean;
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    code: boolean;
    ol: boolean;
    ul: boolean;
}

export interface ICursorState {
    token: CodeMirror.Token;
    format: ICursorFormat;
}

/* END Public Interfaces */

/* BEGIN Private Constants */

const operations: IFormattingOperations = {
    inline: {
        apply: inlineApply,
        remove: inlineRemove
    },
    block: {
        apply: blockApply,
        remove: blockRemove
    }
};

/* END Private Constants */

/* BEGIN Public Constants */

export const EditorFormats: IEditorFormats = {
    h1: { type: 'block', token: 'header-1', before: '#', re: /^#\s+/, placeholder: 'Heading' },
    h2: { type: 'block', token: 'header-2', before: '##', re: /^##\s+/, placeholder: 'Heading' },
    h3: { type: 'block', token: 'header-3', before: '###', re: /^###\s+/, placeholder: 'Heading' },
    bold: { type: 'inline', token: 'strong', before: '**', after: '**', placeholder: 'bold text' },
    italic: { type: 'inline', token: 'em', before: '_', after: '_', placeholder: 'italic text' },
    strikethrough: { type: 'inline', token: 'strikethrough', before: '~~', after: '~~', placeholder: 'deleted text' },
    code: { type: 'inline', token: 'code', before: '`', after: '`', placeholder: 'inline code' },
    ol: { type: 'block', before: '1.', re: /^\d+\.\s+/, placeholder: 'List' },
    ul: { type: 'block', before: '*', re: /^[\*\-]\s+/, placeholder: 'List' },
    link: { type: 'inline', before: '[', after: ')', placeholder: 'link text' },
    codeBlock: { type: 'inline', before: '```{LANG}\n', after: '\n```', placeholder: 'code' },
    image: { type: 'inline', before: '![', after: ')', placeholder: 'image' },
};

export const EditorFormatTokens: IEditorFormatTokens = {
    'header-1': 'h1',
    'header-2': 'h2',
    'header-3': 'h3',
    'strong': 'bold',
    'em': 'italic',
    'strikethrough': 'strikethrough',
    'comment': 'code'
};

/* END Public Constants */

/* BEGIN Private Functions */

function createEmptyCursorState(): ICursorState {
    return {
        token: null,
        format: {
            link: false,
            link_label: false,
            link_href: false,
            h1: false,
            h2: false,
            h3: false,
            bold: false,
            italic: false,
            strikethrough: false,
            code: false,
            ol: false,
            ul: false
        }
    };
}

function getCmSelection(cm: CodeMirror.Editor): ICodeMirrorSelection {
    const start = cm.getCursor('start');
    const line = start.line;
    return {
        line: line,
        lineText: cm.getLine(line),
        start: start,
        end: cm.getCursor('end'),
        selectedText: cm.getSelection()
    };
}

function moveCmSelection(cm: CodeMirror.Editor, selection: ICodeMirrorSelection, moveStartBy: number, moveEndBy: number): void {
    setCmSelection(cm, selection, selection.start.ch + moveStartBy, selection.end.ch + moveEndBy);
}

function setCmSelection(cm: CodeMirror.Editor, selection: ICodeMirrorSelection, start: number, end: number): void {
    const newStart = {
        line: selection.line,
        ch: start
    };

    const newEnd = {
        line: selection.line,
        ch: end
    };

    cm.setSelection(newStart, newEnd);
}

function replaceCmLine(cm: CodeMirror.Editor, selection: ICodeMirrorSelection, replacement: string): void {
    cm.replaceRange(replacement, { line: selection.line, ch: 0 }, { line: selection.line, ch: selection.lineText.length + 1 });
}

function findFormattingRange(selection: ICodeMirrorSelection, format: IEditorFormat): [number, number] {
    let startPos = selection.start.ch;

    while (startPos) {
        if (selection.lineText.substr(startPos, format.before.length) === format.before) {
            break;
        }
        startPos--;
    }

    let endPos = selection.end.ch;

    while (endPos <= selection.lineText.length) {
        if (selection.lineText.substr(endPos, format.after.length) === format.after) {
            break;
        }
        endPos++;
    }

    return [startPos, endPos];
}

function getCursorState(cm: CodeMirror.Editor) {
    const pos = cm.getCursor('start');
    const cs = createEmptyCursorState();
    const token = cs.token = cm.getTokenAt(pos);

    if (!token.type) {
        return cs;
    }

    const tokens = token.type.split(' ');

    tokens.forEach(t => {
        if (EditorFormatTokens[t]) {
            cs.format[EditorFormatTokens[t]] = true;
            return;
        }
        switch (t) {
            case 'link':
                cs.format.link = true;
                cs.format.link_label = true;
                break;
            case 'string':
                cs.format.link = true;
                cs.format.link_href = true;
                break;
            case 'variable-2':
                const text = cm.getLine(pos.line);
                if (/^\s*\d+\.\s/.test(text)) {
                    cs.format.ol = true;
                } else {
                    cs.format.ul = true;
                }
                break;
        }
    });

    return cs;
}

/* END Private Functions */

/* BEGIN Public Functions */

export function inlineApply(cm: CodeMirror.Editor, format: IEditorFormat) {
    const sel = getCmSelection(cm);

    cm.replaceSelection(format.before + sel.selectedText + format.after);

    moveCmSelection(cm, sel, format.before.length, format.after.length);

    cm.focus();
}

export function inlineRemove(cm: CodeMirror.Editor, format: IEditorFormat) {
    const sel = getCmSelection(cm);

    const [startPos, endPos] = findFormattingRange(sel, format);

    const start = sel.lineText.slice(0, startPos);
    const mid = sel.lineText.slice(startPos + format.before.length, endPos);
    const end = sel.lineText.slice(endPos + format.after.length);

    replaceCmLine(cm, sel, start + mid + end);

    setCmSelection(cm, sel, start.length, (start + mid).length);

    cm.focus();
}

export function blockApply(cm: CodeMirror.Editor, format: IEditorFormat) {
    const sel = getCmSelection(cm);

    const text = `${format.before} ${(sel.lineText.length ? sel.lineText : format.placeholder)}`;

    replaceCmLine(cm, sel, text);

    setCmSelection(cm, sel, format.before.length + 1, text.length);

    cm.focus();
}

export function blockRemove(cm: CodeMirror.Editor, format: IEditorFormat) {
    const sel = getCmSelection(cm);

    // TODO: Why do this with regex only in this case?
    const text = sel.lineText.replace(format.re, '');

    cm.replaceRange(text, { line: sel.line, ch: 0 }, { line: sel.line, ch: sel.lineText.length + 1 });

    setCmSelection(cm, sel, 0, text.length);

    cm.focus();
}

export function linkApply(cm: CodeMirror.Editor, data: IHtmlLinkProperties) {
    cm.replaceSelection('[' + data.linkText + '](' + data.href + (data.linkTitle ? ' "' + data.linkTitle + '"' : '') + ')');

    cm.focus();
}

export function linkRemove(cm: CodeMirror.Editor) {
    const sel = getCmSelection(cm);

    const [startPos, endPos] = findFormattingRange(sel, EditorFormats.link);

    const start = sel.lineText.slice(0, startPos);
    const mid = sel.lineText.slice(startPos, endPos + 1);
    const end = sel.lineText.slice(endPos + 1);

    const linkText = mid.replace(/\[(.*?)\]\(.*?\)/, '$1');

    replaceCmLine(cm, sel, start + linkText + end);

    cm.setCursor({ line: sel.line, ch: start.length });

    cm.focus();
}

export function codeBlockApply(cm: CodeMirror.Editor, data: ICodeBlockProperties) {
    const format: IEditorFormat = Object.assign({}, EditorFormats.codeBlock);

    format.before = format.before.replace(/\{LANG\}/gi, data.language);

    inlineApply(cm, format);
}

export function imageApply(cm: CodeMirror.Editor, data: IHtmlImageProperties) {
    cm.replaceSelection('![' + (data.alt || '') + '](' + data.url + ')');

    cm.focus();
}

export function applyFormat(cm: CodeMirror.Editor, key: string, data?: any) {
    const cs = getCursorState(cm);
    // console.log(cs);
    const format = EditorFormats[key];
    operations[format.type][(cs.format[key] ? 'remove' : 'apply')](cm, format, data);
}

export function getLinkData(cm: CodeMirror.Editor): IHtmlLinkProperties {
    const pos = cm.getCursor('start');
    const token = cm.getTokenAt(pos);

    let data: IHtmlLinkProperties = null;

    if (token.type && (token.type.indexOf('link') > -1 || token.type.indexOf('url') > -1)) {
        const startPoint = cm.getCursor('start');
        const endPoint = cm.getCursor('end');
        const line = cm.getLine(startPoint.line);

        let startPos = startPoint.ch;
        while (startPos) {
            startPos--;
            if (line.charAt(startPos) === '[') {
                break;
            }
        }

        let endPos = endPoint.ch;
        while (endPos <= line.length) {
            if (line.charAt(endPos) === ')') {
                break;
            }
            endPos++;
        }

        const linkMarkdown = line.slice(startPos, endPos + 1);

        const linkPattern = /\[(.*?)\]\(([^\s]*)(?:\s+"(.*?)")?\)/m;
        const match = linkPattern.exec(linkMarkdown);

        if (match) {
            // matched text: match[0]
            // match start: match.index
            // capturing group n: match[n]

            data = {
                linkText: match[1],
                href: match[2]
            };

            if (match[3]) {
                data.linkTitle = match[3];
            }
        }

        cm.setSelection({ line: startPoint.line, ch: startPos }, { line: startPoint.line, ch: endPos + 1 });
    }

    return data;
}

export function createLink(cm: CodeMirror.Editor, properties: IHtmlLinkProperties) {
    linkApply(cm, properties);
}

export function removeLink(cm: CodeMirror.Editor) {
    linkRemove(cm);
}

export function createCodeBlock(cm: CodeMirror.Editor, properties: ICodeBlockProperties) {
    codeBlockApply(cm, properties);
}

export function getImageData(cm: CodeMirror.Editor): IHtmlImageProperties {
    const pos = cm.getCursor('start');
    const token = cm.getTokenAt(pos);

    let data: IHtmlImageProperties = null;

    if (token.type && (token.type.indexOf('image') > -1 || token.type.indexOf('url') > -1)) {
        const startPoint = cm.getCursor('start');
        const endPoint = cm.getCursor('end');
        const line = cm.getLine(startPoint.line);

        let startPos = startPoint.ch;
        while (startPos) {
            startPos--;
            if (line.charAt(startPos) === '!') {
                break;
            }
        }

        let endPos = endPoint.ch;
        while (endPos <= line.length) {
            if (line.charAt(endPos) === ')') {
                break;
            }
            endPos++;
        }

        const imageMarkdown = line.slice(startPos, endPos + 1);

        const imagePattern = /!\[([^\s]*)\]\(([^\)]+)\)/m;
        const match = imagePattern.exec(imageMarkdown);

        if (match) {
            // matched text: match[0]
            // match start: match.index
            // capturing group n: match[n]

            data = {
                alt: match[1],
                url: match[2]
            };
        }

        cm.setSelection({ line: startPoint.line, ch: startPos }, { line: startPoint.line, ch: endPos + 1 });
    }

    return data;
}

export function createImage(cm: CodeMirror.Editor, properties: IHtmlImageProperties) {
    imageApply(cm, properties);
}

/* END Public Functions */
