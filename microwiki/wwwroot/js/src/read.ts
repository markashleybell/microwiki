import { Modal } from 'bootstrap';
import { deleteWithConfirmation, getDeleteConfirmationMessage } from './common';
import { highlightElement } from './components/highlighter';
import { dom } from 'mab-dom';

document.querySelectorAll('pre code').forEach(highlightElement);

export const moveDocumentButton = dom('#move-document-button');

export const moveDocumentModalElement = dom('#move-document-modal');
export const moveDocumentModal = new Modal(moveDocumentModalElement.get());

moveDocumentButton.on('click', e => {
    e.preventDefault();

    const a = (e.currentTarget as HTMLElement);

    fetch(`/wiki/movedocumentmodal?currentDocumentId=${a.getAttribute('data-id')}&currentDocumentTitle=${a.getAttribute('data-title')}`, { method: 'GET' })
        .then(async response => {
            const html = await response.text();
            moveDocumentModalElement.find('.modal-body').html(html);
            moveDocumentModal.show();
        }).catch(error => {
            // Handle error
        });
});

moveDocumentModalElement.onchild('a.document', 'click', e => {
    e.preventDefault();

    const a = (e.target as HTMLElement);

    const data = new FormData();
    data.append('id', moveDocumentButton.data('id'));
    data.append('newParentID', a.getAttribute('data-id'));

    fetch('/wiki/move', { method: 'POST', body: data })
        .then(async response => {
            const result = await response.json();
            window.location.href = result.newLocation;
        }).catch(error => {
            // Handle error
        });
});

dom('.delete-page').on('click', e => {
    e.preventDefault();

    const button = e.target as HTMLButtonElement;
    const fileName = button.getAttribute('data-pagetitle');

    const getMessage = () => getDeleteConfirmationMessage('page', fileName);

    deleteWithConfirmation(button.form, 'Delete Page', getMessage);
});
