import Dropzone from 'dropzone';
import { Modal, Tab } from 'bootstrap';
import { TagInput } from 'mab-bootstrap-taginput';
import { tagItemTemplate } from './common';
import {
    applyFormat,
    createCodeBlock,
    createEditor,
    createImage,
    createLink,
    getImageData,
    getLinkData,
    ICodeBlockProperties,
    IHtmlImageProperties,
    IHtmlLinkProperties,
    removeLink,
    updatePreview
} from './components/editor';
import { dom } from 'mab-dom';

declare const _ALL_TAGS: string[];

const editorElement = document.getElementById('Body') as HTMLTextAreaElement;

const editor = createEditor(editorElement);

editor.setOption('extraKeys', {
    'Tab': 'indentMore',
    'Shift-Tab': 'indentLess',
    'Ctrl-B': () => applyFormat(editor, 'bold'),
    'Ctrl-I': () => applyFormat(editor, 'italic'),
    'Home': 'goLineLeft',
    'End': 'goLineRight'
});

const tagInputElements = document.getElementsByClassName('tag-input');

for (const tagInputElement of tagInputElements) {
    const tagInput = new TagInput<string>({
        input: (tagInputElement as HTMLElement),
        data: _ALL_TAGS || [],
        getId: item => item,
        getLabel: item => item,
        newItemFactory: label => Promise.resolve(label),
        itemTemplate: tagItemTemplate
    });
}

// TODO: Refactor modal code
const linkModalElement = dom('#editor-link-modal');
const linkModal = new Modal(linkModalElement.get(0));

linkModalElement.onchild('.btn-success', 'click', () => {
    const text = linkModalElement.find('[name=link-text]').val();
    const url = linkModalElement.find('[name=link-url]').val();
    const title = linkModalElement.find('[name=link-title]').val();

    const data: IHtmlLinkProperties = { linkText: text, href: url };

    if (title) {
        data.linkTitle = title;
    }

    createLink(editor, data);

    linkModal.hide();
});

linkModalElement.onchild('.btn-danger', 'click', () => {
    removeLink(editor);

    linkModal.hide();
});

linkModalElement.on('shown.bs.modal', e => {
    const textInput = linkModalElement.find('[name=link-text]');

    if (textInput.val().trim() !== '') {
        linkModalElement.find('[name=link-url]').focus();
    } else {
        textInput.focus();
    }
});

linkModalElement.on('hidden.bs.modal', e => {
    editor.focus();
});

const codeBlockModalElement = dom('#editor-code-block-modal');
const codeBlockModal = new Modal(codeBlockModalElement.get(0));

codeBlockModalElement.onchild('.btn-success', 'click', () => {
    const language = codeBlockModalElement.find('select[name="code-block-language"]').val();

    const data: ICodeBlockProperties = { language: language };

    createCodeBlock(editor, data);

    codeBlockModal.hide();
});

codeBlockModalElement.on('hidden.bs.modal', e => {
    editor.focus();
});

const imageModalElement = dom('#editor-image-modal');
const imageModal = new Modal(imageModalElement.get(0));

imageModalElement.onchild('.btn-success', 'click', () => {
    const url = imageModalElement.find('[name=image-url]').val();
    const alt = imageModalElement.find('[name=image-alt]').val();

    const data: IHtmlImageProperties = { alt: alt, url: url };

    createImage(editor, data);

    imageModal.hide();
});

imageModalElement.on('shown.bs.modal', e => {
    imageModalElement.find('[name=image-url]').focus();
});

imageModalElement.on('hidden.bs.modal', e => {
    editor.focus();
});

function resetLinkModalFields() {
    linkModalElement.find('[name=link-text]').val(null);
    linkModalElement.find('[name=link-url]').val(null);
    linkModalElement.find('[name=link-title]').val(null);
}

function resetImageModalFields() {
    imageModalElement.find('[name=image-alt]').val(null);
    imageModalElement.find('[name=image-url]').val(null);
}

export function format(key: string) {
    if (key === 'link') {
        resetLinkModalFields();

        const linkData = getLinkData(editor);

        if (linkData) {
            linkModalElement.find('[name=link-text]').val(linkData.linkText);
            linkModalElement.find('[name=link-url]').val(linkData.href);
            linkModalElement.find('[name=link-title]').val(linkData.linkTitle);
        } else {
            linkModalElement.find('[name=link-text]').val(editor.getSelection());
        }

        linkModal.show();
    } else if (key === 'image') {
        resetImageModalFields();

        const imageData = getImageData(editor);

        if (imageData) {
            imageModalElement.find('[name=image-alt]').val(imageData.alt);
            imageModalElement.find('[name=image-url]').val(imageData.url);
        } else {
            imageModalElement.find('[name=image-alt]').val(editor.getSelection());
        }

        imageModal.show();
    } else if (key === 'codeBlock') {
        codeBlockModal.show();
    } else {
        applyFormat(editor, key);
    }
}

dom('.cm-format-button').on('click', e => {
    e.preventDefault();

    const button = e.target as HTMLElement;

    const formatName = button.getAttribute('data-format');

    format(formatName);
});

// TODO: Figure out how to fit this in
const tabElements = [].slice.call(document.querySelectorAll('a[data-toggle="tab"]'));

tabElements.forEach(el => {
    const tab = new Tab(el);

    el.addEventListener('click', (e: Event) => {
        e.preventDefault();
        tab.show();
    })
})

dom('a[data-toggle="tab"]').on('show.bs.tab', e => {
    const tab = e.target as HTMLElement;

    if (tab.id === 'preview-tab') {
        const tabSelector = tab.getAttribute('href');

        const tabContent = document.querySelector(tabSelector) as HTMLElement;

        const val = editor.getValue();

        updatePreview(val, tabContent);
    }
});

Dropzone.autoDiscover = false;

var zone = new Dropzone('.editor-dropzone', {
    paramName: 'UploadedFile',
    previewTemplate: '<div class="dz-preview dz-file-preview"></div>'
});

zone.on('success', (file: any, response: any) => {
    const data: IHtmlImageProperties = { alt: null, url: response.uploadedFileName };

    createImage(editor, data);
});

editor.on('drop', function (data, e) {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        const file = files[0] as Dropzone.DropzoneFile;
        zone.addFile(file);
    }
});

document.onpaste = function (event) {
    var items = event.clipboardData.items;

    for (let k in items) {
        var item = items[k];
        if (item.kind === 'file') {
            var tmp = item.getAsFile() as Dropzone.DropzoneFile;
            zone.addFile(tmp);
        }
    }
};
