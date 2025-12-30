import { LightningElement, track } from 'lwc';

export default class SpeakerSearch extends LightningElement {
    @track name = '';
    @track speciality = '';

    specialityOptions = [
        { label: 'Apex', value: 'Apex' },
        { label: 'LWC', value: 'LWC' },
        { label: 'Integrations', value: 'Integrations' },
        { label: 'Architecture', value: 'Architecture' }
    ];

    handleNameChange(event) {
        this.name = event.target.value;
    }

    handleSpecialityChange(event) {
        this.speciality = event.detail.value;
    }

    handleSearch() {
        // Dispatch search parameters to parent (SpeakerManager)
        const searchEvent = new CustomEvent('search', {
            detail: { name: this.name, speciality: this.speciality }
        });
        this.dispatchEvent(searchEvent);
    }
}
