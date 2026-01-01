import { LightningElement, api, wire, track } from 'lwc';
import getSpeakerDetails from '@salesforce/apex/SpeakerController.getSpeakerDetails';
import checkAvailability from '@salesforce/apex/SpeakerController.checkAvailability';
import createSession from '@salesforce/apex/SpeakerController.createSession';
import createAssignment from '@salesforce/apex/SpeakerController.createAssignment';
import getBookedDates from '@salesforce/apex/SpeakerController.getBookedDates';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class BookSession extends LightningElement {

    @api speakerId;

    speaker;
    selectedDate;
    isAvailable = false;

    currentMonth;
    currentYear;

    @track calendarDates = [];
    bookedDates = [];

    connectedCallback() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
    }

    // Speaker details
    @wire(getSpeakerDetails, { speakerId: '$speakerId' })
    wiredSpeaker({ data }) {
        if (data) {
            this.speaker = data;
            this.loadBookedDates();
        }
    }

    loadBookedDates() {
        getBookedDates({ speakerId: this.speakerId })
            .then(data => {
                this.bookedDates = data.map(d => new Date(d).toISOString().split('T')[0]);
                this.generateCalendar();
            });
    }

    get monthLabel() {
        return new Date(this.currentYear, this.currentMonth)
            .toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    nextMonth() {
        if (this.currentMonth === 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else {
            this.currentMonth++;
        }
        this.generateCalendar();
    }

    prevMonth() {
        const today = new Date();
        if (
            this.currentYear === today.getFullYear() &&
            this.currentMonth === today.getMonth()
        ) {
            return; // ❌ past month not allowed
        }

        if (this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else {
            this.currentMonth--;
        }
        this.generateCalendar();
    }

    generateCalendar() {
        const dates = [];
        const today = new Date();
        today.setHours(0,0,0,0);

        const daysInMonth = new Date(
            this.currentYear,
            this.currentMonth + 1,
            0
        ).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(this.currentYear, this.currentMonth, day);
            const iso = d.toISOString().split('T')[0];

            let css = 'calendar-date';
            if (d < today) css += ' past';
            if (this.bookedDates.includes(iso)) css += ' booked';
            if (this.selectedDate === iso) css += ' selected';

            dates.push({
                label: day,
                value: iso,
                cssClass: css
            });
        }
        this.calendarDates = dates;
    }

    selectCalendarDate(event) {
        const date = event.target.dataset.date;
        if (!date ||
            event.target.classList.contains('past') ||
            event.target.classList.contains('booked')) {
            return;
        }

        this.selectedDate = date;

        checkAvailability({ speakerId: this.speakerId, selectedDate: date })
            .then(res => {
                this.isAvailable = res;
                if (!res) {
                    this.showToast('Error', 'Date already booked', 'error');
                }
                this.generateCalendar();
            });
    }

    handleCreate() {
        createSession({ sessionDate: this.selectedDate })
            .then(sessionId =>
                createAssignment({ speakerId: this.speakerId, sessionId })
            )
            .then(() => {
                this.showToast('Success', 'Session booked', 'success');
                this.selectedDate = null;
                this.isAvailable = false;
                this.loadBookedDates();
            });
    }

    get disableCreate() {
        return !this.isAvailable;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
