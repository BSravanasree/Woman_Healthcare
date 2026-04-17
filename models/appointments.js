const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    woman: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Woman',   // references the Woman model
        required: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',  // references the Doctor model
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    timeSlot: {
        type: String, // e.g., "10:30 AM - 11:00 AM"
        required: true,
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled'],
        default: 'Scheduled',
    },
    notes: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Appointment', appointmentSchema);

