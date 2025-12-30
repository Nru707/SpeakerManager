import { LightningElement, api, track } from 'lwc';

export default class SpeakerList extends LightningElement {
    @api speakers = [];

    @track columns = [
        { label: 'Name', fieldName: 'Name' },
        { label: 'Email', fieldName: 'Email__c', type: 'email' },
        { label: 'Speciality', fieldName: 'Speciality__c' },
        {
            type: 'button',
            typeAttributes: {
                label: 'Book Session',
                name: 'book',
                title: 'Book Session'
            }
        }
    ];

    handleRowAction(event) {
        if (event.detail.action.name === 'book') {
            const speakerId = event.detail.row.Id;
            const selectEvent = new CustomEvent('selectspeaker', { detail: speakerId });
            this.dispatchEvent(selectEvent);
        }
    }
}
