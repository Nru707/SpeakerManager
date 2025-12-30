import { LightningElement, api, track } from 'lwc';
import checkAvailability from '@salesforce/apex/SpeakerController.checkAvailability';
import createAssignment from '@salesforce/apex/SpeakerController.createAssignment';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getSpeakerDetails from '@salesforce/apex/SpeakerController.getSpeakerDetails';

export default class BookSession extends LightningElement {
    @api speakerId; // selected from parent
    @track speaker; // { Name, Bio, Speciality }
    @track selectedDate;
    @track canBook = false;

    // Getter for template-safe disabled property
    get isBookingDisabled() {
        return !this.canBook;
    }

    // Watch for changes in speakerId
    renderedCallback() {
        if (this.speakerId && (!this.speaker || this.speaker.Id !== this.speakerId)) {
            this.loadSpeakerDetails();
        }
    }

    async loadSpeakerDetails() {
        try {
            this.speaker = await getSpeakerDetails({ speakerId: this.speakerId });
            this.selectedDate = null;
            this.canBook = false;
        } catch (error) {
            console.error(error);
            this.showToast('Error', 'Failed to load speaker details', 'error');
        }
    }

    handleDateChange(event) {
        this.selectedDate = event.target.value;
        this.canBook = false;

        if (this.selectedDate) {
            const selected = new Date(this.selectedDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selected < today) {
                this.showToast('Error', 'Please select a future date', 'error');
                return;
            }

            this.checkAvailability();
        }
    }

    async checkAvailability() {
        try {
            const available = await checkAvailability({ speakerId: this.speakerId, date: this.selectedDate });
            this.canBook = available;
            if (!available) {
                this.showToast('Error', 'Slot is already booked, try another date', 'error');
            }
        } catch (error) {
            console.error(error);
            this.showToast('Error', 'Failed to check availability', 'error');
        }
    }

    async handleCreateAssignment() {
        try {
            // Example: sessionId can be dynamic or fixed; adjust as needed
            await createAssignment({ speakerId: this.speakerId, sessionId: 'a0123456789ABCDE' });
            this.showToast('Success', 'Speaker assigned successfully', 'success');
            this.canBook = false;
        } catch (error) {
            console.error(error);
            this.showToast('Error', 'Failed to create assignment', 'error');
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
