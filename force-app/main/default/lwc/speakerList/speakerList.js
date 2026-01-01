import { LightningElement, api, wire, track } from 'lwc';
import searchSpeakers from '@salesforce/apex/SpeakerController.searchSpeakers';

export default class SpeakerList extends LightningElement {

    @api name;
    @api speciality;

    @track speakers = [];
    @track showNoData = false;

    columns = [
        { label: 'Name', fieldName: 'Name' },
        { label: 'Email', fieldName: 'Email__c', type: 'email' },
        { label: 'Speciality', fieldName: 'Speciality__c' },
        {
            type: 'button',
            typeAttributes: {
                label: 'Book Session',
                name: 'book',
                variant: 'brand'
            }
        }
    ];

    @wire(searchSpeakers, {
        name: '$name',
        speciality: '$speciality'
    })
    wiredSpeakers({ data, error }) {
        if (data) {
            this.speakers = data;
            this.showNoData = data.length === 0;
        } else {
            this.speakers = [];
            this.showNoData = true;
            console.error(error);
        }
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'book') {
            this.dispatchEvent(
                new CustomEvent('speakerselect', {
                    detail: { speakerId: row.Id },
                    bubbles: true,
                    composed: true
                })
            );
        }
    }
}
