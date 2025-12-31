import { LightningElement, api, track, wire } from 'lwc';
import getSpeakerDetails from '@salesforce/apex/SpeakerController.getSpeakerDetails';
import checkAvailability from '@salesforce/apex/SpeakerController.checkAvailability';
import createSession from '@salesforce/apex/SpeakerController.createSession';
import createAssignment from '@salesforce/apex/SpeakerController.createAssignment';
import getBookedDates from '@salesforce/apex/SpeakerController.getBookedDates';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class BookSession extends LightningElement {
    _speakerId;

    @track speaker;
    selectedDate;
    isAvailable = false;
    calendarDates = [];
    bookedDates = [];

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
    wiredSpeaker({ data }) {
        if (data) {
            this.speaker = data;
            this.loadBookedDates();
        } else {
            this.speaker = null;
        }
    }

    // Load booked dates for speaker
    loadBookedDates() {
        getBookedDates({ speakerId: this._speakerId })
            .then(data => {
                this.bookedDates = data.map(d => new Date(d).toISOString().split('T')[0]);
                this.generateCalendar();
            })
            .catch(error => {
                console.error(error);
                this.bookedDates = [];
            });
    }

    // Calendar today
    get today() {
        const t = new Date();
        t.setHours(0,0,0,0);
        return t.toISOString().split('T')[0];
    }

    // Handle calendar click
    selectCalendarDate(event) {
        const date = event.target.dataset.date;
        if (!date) return;

        // Check if disabled
        if(event.target.classList.contains('past') || event.target.classList.contains('booked')) return;

        this.selectedDate = date;
        this.checkAvailabilityForDate(date);
    }

    // Check if selected date is available
    checkAvailabilityForDate(date) {
        checkAvailability({ speakerId: this._speakerId, selectedDate: date })
            .then(result => {
                this.isAvailable = result;
                if(!result){
                    this.showToast('Error', 'Slot already booked', 'error');
                }
                this.generateCalendar();
            })
            .catch(error => {
                console.error(error);
                this.isAvailable = false;
            });
    }

    // Create session & assignment
    handleCreate() {
        if (!this.selectedDate) {
            this.showToast('Error', 'Select a date first', 'error');
            return;
        }

        createSession({ sessionDate: this.selectedDate })
            .then(sessionId => createAssignment({ speakerId: this._speakerId, sessionId }))
            .then(() => {
                this.showToast('Success', 'Session booked successfully', 'success');
                this.selectedDate = null;
                this.isAvailable = false;
                this.loadBookedDates(); // refresh calendar
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

    // Generate 30-day calendar
    generateCalendar() {
        const dates = [];
        const today = new Date();
        today.setHours(0,0,0,0);

        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            const iso = d.toISOString().split('T')[0];

            let css = 'calendar-date';
            if(this.selectedDate === iso) css += ' selected';
            if(d < today) css += ' past';
            if(this.bookedDates.includes(iso)) css += ' booked';

            dates.push({ value: iso, label: d.getDate(), cssClass: css });
        }
        this.calendarDates = dates;
    }
}
