import { deleteWithConfirmation, getDeleteConfirmationMessage } from './common';
import { dom } from 'mab-dom';

dom('.delete-upload').on('click', e => {
    e.preventDefault();

    const button = e.target as HTMLButtonElement;
    const fileName = button.getAttribute('data-filename');

    const getMessage = () => getDeleteConfirmationMessage('file', fileName);

    deleteWithConfirmation(button.form, 'Delete File', getMessage);
});
