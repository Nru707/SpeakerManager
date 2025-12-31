import { LightningElement, api, track, wire } from 'lwc';
import getSpeakerDetails from '@salesforce/apex/SpeakerController.getSpeakerDetails';
import checkAvailability from '@salesforce/apex/SpeakerController.checkAvailability';
import createSession from '@salesforce/apex/SpeakerController.createSession';
import createAssignment from '@salesforce/apex/SpeakerController.createAssignment';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class BookSession extends LightningElement {
    _speakerId;

    @track speaker;
    selectedDate;
    isAvailable = false;
    calendarDates = [];

    // Reactive speakerId
    @api
    set speakerId(value) {
        this._speakerId = value;
        this.speaker = null;
        this.selectedDate = null;
        this.isAvailable = false;
        this.calendarDates = [];
    }
    get speakerId() {
        return this._speakerId;
    }

    // Fetch speaker details
    @wire(getSpeakerDetails, { speakerId: '$_speakerId' })
    wiredSpeaker({ data, error }) {
        if (data) {
            this.speaker = data;
            this.generateCalendar();
        } else {
            this.speaker = null;
        }
    }

    get today() {
        return new Date().toISOString().split('T')[0];
    }

    // Handle manual date input
    handleDateChange(event) {
        this.selectedDate = event.target.value;
        this.checkAvailabilityForDate(this.selectedDate);
    }

    // Handle calendar click
    selectCalendarDate(event) {
        const date = event.target.dataset.date;
        if (date && !event.target.classList.contains('disabled')) {
            this.selectedDate = date;
            this.checkAvailabilityForDate(date);
        }
    }

    // Check availability for selected date
    checkAvailabilityForDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(date);
        if (selected < today) {
            this.showToast('Error', 'Date must be in the future', 'error');
            this.isAvailable = false;
            return;
        }

        checkAvailability({ speakerId: this._speakerId, selectedDate: date })
            .then(result => {
                this.isAvailable = result;
                if (!result) {
                    this.showToast('Error', 'Slot is already booked, try another date', 'error');
                }
                this.generateCalendar(); // refresh calendar
            })
            .catch(error => {
                console.error(error);
                this.showToast('Error', 'Failed to check availability', 'error');
                this.isAvailable = false;
            });
    }

    // Create session and assignment
    handleCreate() {
        if (!this.selectedDate) {
            this.showToast('Error', 'Select a date first', 'error');
            return;
        }

        // First create Session__c
        createSession({ sessionDate: this.selectedDate })
            .then(sessionId => {
                // Then create assignment
                return createAssignment({ speakerId: this._speakerId, sessionId });
            })
            .then(() => {
                this.showToast('Success', 'Session booked successfully', 'success');
                this.isAvailable = false;
                this.selectedDate = null;
                this.generateCalendar();
            })
            .catch(error => {
                console.error(error);
                this.showToast('Error', 'Booking failed', 'error');
            });
    }

    get disableCreate() {
        return !this.isAvailable;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    // Generate simple 30-day calendar
    generateCalendar() {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            const iso = d.toISOString().split('T')[0];
            let css = 'calendar-date';
            if (this.selectedDate === iso) css += ' selected';
            dates.push({ value: iso, label: d.getDate(), cssClass: css });
        }
        this.calendarDates = dates;
    }
}
