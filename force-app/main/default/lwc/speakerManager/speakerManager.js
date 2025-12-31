import { LightningElement, track } from 'lwc';

export default class SpeakerManager extends LightningElement {
    @track selectedSpeakerId;
    @track name = '';
    @track speciality = '';

    // Called when user selects a speaker from the list
    handleSpeakerSelect(event) {
        this.selectedSpeakerId = event.detail.speakerId;
        console.log('Selected Speaker in Parent:', this.selectedSpeakerId);
    }

    // Called when user changes name or speciality in the search component
    handleFilterChange(event) {
        this.name = event.detail.name;
        this.speciality = event.detail.speciality;
        this.selectedSpeakerId = null; // reset selected speaker
    }
}
