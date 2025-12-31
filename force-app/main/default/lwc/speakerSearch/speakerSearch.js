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
        this.emitFilterChange();
    }

    handleSpecialityChange(event) {
        this.speciality = event.detail.value;
        this.emitFilterChange();
    }

    emitFilterChange() {
        // Dispatch event to parent
        this.dispatchEvent(new CustomEvent('filterchange', {
            detail: { name: this.name, speciality: this.speciality }
        }));
    }
}
