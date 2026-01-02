import { LightningElement, api, wire, track } from 'lwc';
import getSpeakerDetails from '@salesforce/apex/SpeakerController.getSpeakerDetails';
import getBookedDates from '@salesforce/apex/SpeakerController.getBookedDates';
import checkAvailability from '@salesforce/apex/SpeakerController.checkAvailability';
import createSession from '@salesforce/apex/SpeakerController.createSession';
import createAssignment from '@salesforce/apex/SpeakerController.createAssignment';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class BookSession extends LightningElement {

    @api speakerId;

    speaker;
    selectedDate;          // yyyy-MM-dd
    isAvailable = false;

    currentMonth;
    currentYear;

    @track calendarDates = [];
    bookedDates = [];      // yyyy-MM-dd[]

    // ================= INIT =================
    connectedCallback() {
        const today = new Date();
        this.currentMonth = today.getMonth();
        this.currentYear = today.getFullYear();
    }

    // ================= SPEAKER =================
    @wire(getSpeakerDetails, { speakerId: '$speakerId' })
    wiredSpeaker({ data }) {
        if (data) {
            this.speaker = data;
            this.loadBookedDates();
        }
    }

    // ================= SAFE LOCAL FORMAT =================
    formatDateLocal(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // ================= BOOKED DATES =================
    loadBookedDates() {
        getBookedDates({ speakerId: this.speakerId })
            .then(data => {
                // 🔴 IMPORTANT FIX
                // Apex Date already comes as yyyy-MM-dd
                // NEVER wrap in new Date()
                this.bookedDates = data;
                this.generateCalendar();
            });
    }

    // ================= MONTH LABEL =================
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
        ) return;

        if (this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else {
            this.currentMonth--;
        }
        this.generateCalendar();
    }

    // ================= CALENDAR =================
    generateCalendar() {
        const dates = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDay = new Date(
            this.currentYear,
            this.currentMonth,
            1
        ).getDay();

        const daysInMonth = new Date(
            this.currentYear,
            this.currentMonth + 1,
            0
        ).getDate();

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            dates.push({
                key: 'e' + i,
                label: '',
                value: null,
                cssClass: 'calendar-date empty'
            });
        }

        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(this.currentYear, this.currentMonth, day);
            const localDate = this.formatDateLocal(d);

            let css = 'calendar-date';
            if (d < today) css += ' past';
            if (this.bookedDates.includes(localDate)) css += ' booked';
            if (this.selectedDate === localDate) css += ' selected';

            dates.push({
                key: localDate,
                label: day,
                value: localDate,
                cssClass: css
            });
        }

        this.calendarDates = dates;
    }

    // ================= DATE CLICK =================
    selectCalendarDate(event) {
        const date = event.target.dataset.date;

        if (!date ||
            event.target.classList.contains('empty') ||
            event.target.classList.contains('past')) {
            return;
        }

        if (event.target.classList.contains('booked')) {
            this.showToast(
                'Warning',
                'This date is already booked',
                'warning'
            );
            return;
        }

        this.selectedDate = date;

        checkAvailability({ speakerId: this.speakerId, selectedDate: date })
            .then(res => {
                this.isAvailable = res;
                if (!res) {
                    this.showToast(
                        'Warning',
                        'Date already booked',
                        'warning'
                    );
                }
                this.generateCalendar();
            });
    }

    // ================= CREATE =================
    handleCreate() {
        // selectedDate is yyyy-MM-dd → SAFE for Apex Date
        createSession({ sessionDate: this.selectedDate })
            .then(sessionId =>
                createAssignment({ speakerId: this.speakerId, sessionId })
            )
            .then(() => {
                this.showToast('Success', 'Session booked successfully', 'success');
                this.selectedDate = null;
                this.isAvailable = false;
                this.loadBookedDates();
            });
    }

    get disableCreate() {
        return !this.isAvailable;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }
}
