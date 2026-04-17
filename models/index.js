const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Base User Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['woman', 'doctor', 'nutritionist', 'pharmacy', 'admin'],
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String,
    isTwoFactorEnabled: {
        type: Boolean,
        default: false
    },
    phone: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Password hashing middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

// Woman Profile Schema
const womanProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    personalInfo: {
        firstName: String,
        lastName: String,
        dateOfBirth: Date,
        bloodGroup: String,
        height: Number,
        weight: Number,
        emergencyContact: {
            name: String,
            phone: String,
            relationship: String
        }
    },
    medicalHistory: {
        allergies: [String],
        chronicConditions: [String],
        surgeries: [{
            name: String,
            date: Date
        }],
        currentMedications: [{
            name: String,
            dosage: String
        }]
    },
    reproductiveHealth: {
        lastMenstrualPeriod: Date,
        cycleLength: Number,
        periodLength: Number,
        isPregnant: Boolean,
    }
});

const WomanProfile = mongoose.model('WomanProfile', womanProfileSchema);

// Doctor Profile Schema
const doctorProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    personalInfo: {
        firstName: String,
        lastName: String,
        specialization: String,
        licenseNumber: String,
        yearsOfExperience: Number,
        qualifications: [String]
    },
    contactInfo: {
        phone: String,
        address: String,
        city: String,
        state: String,
        zipCode: String
    },
    professionalInfo: {
        hospital: String,
        consultationFee: Number,
        availability: [{
            day: String,
            slots: [String]
        }]
    },
    ratings: [{
        userId: mongoose.Schema.Types.ObjectId,
        rating: Number,
        review: String,
        date: Date
    }]
});

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);

// Nutritionist Profile Schema
const nutritionistProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    personalInfo: {
        firstName: String,
        lastName: String,
        specialization: [String],
        licenseNumber: String,
        qualifications: [String]
    },
    contactInfo: {
        phone: String,
        address: String
    },
    services: [{
        name: String,
        description: String,
        price: Number
    }]
});

const NutritionistProfile = mongoose.model('NutritionistProfile', nutritionistProfileSchema);

// Pharmacy Schema
const pharmacySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pharmacyInfo: {
        name: String,
        licenseNumber: String,
        ownerName: String
    },
    contactInfo: {
        phone: String,
        address: String,
        city: String,
        state: String
    },
    inventory: [{
        medicineName: String,
        genericName: String,
        manufacturer: String,
        price: Number,
        stock: Number,
        prescriptionRequired: Boolean
    }]
});

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
    womanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    serviceProviderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    serviceType: {
        type: String,
        enum: ['doctor', 'nutritionist'],
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled'
    },
    notes: String,
    prescription: {
        diagnosis: String,
        medicines: [{
            name: String,
            dosage: String,
            duration: String
        }],
        advice: String
    }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

// Prescription Schema
const prescriptionSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    womanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    medicines: [{
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String
    }],
    diagnosis: String,
    notes: String,
    date: {
        type: Date,
        default: Date.now
    }
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = {
    User,
    WomanProfile,
    DoctorProfile,
    NutritionistProfile,
    Pharmacy,
    Appointment,
    Prescription
};