const mongoose = require('mongoose');

const nutritionistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    specialization: {
        type: String,
        default: 'Nutritionist',
    },
    phone: {
        type: String,
    },
    experience: {
        type: Number, // years of experience
    },
    qualifications: {
        type: String, // e.g., "BSc Nutrition, MSc Dietetics"
    },
    clinicAddress: {
        type: String,
    },
    availableDays: {
        type: [String], // e.g., ["Monday", "Wednesday", "Friday"]
    },
    timeSlots: {
        type: [String], // e.g., ["10:00-11:00 AM", "4:00-5:00 PM"]
    },
    role: {
        type: String,
        default: 'nutritionist',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Nutritionist', nutritionistSchema);

