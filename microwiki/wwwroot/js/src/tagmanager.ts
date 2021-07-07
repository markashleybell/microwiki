import { ITag, TagInput } from 'mab-bootstrap-taginput';
import { tagItemTemplate } from './common';

declare const _ALL_TAGS_MERGE: ITag[];

const tagMergeInputElements = document.getElementsByClassName('tag-input-merge');

for (const tagInputElement of tagMergeInputElements) {
    new TagInput<ITag>({
        input: (tagInputElement as HTMLElement),
        data: _ALL_TAGS_MERGE || [],
        getId: item => item.id,
        getLabel: item => item.label,
        allowNewTags: false,
        minCharsBeforeShowingSuggestions: 1,
        itemTemplate: tagItemTemplate
    });
}
