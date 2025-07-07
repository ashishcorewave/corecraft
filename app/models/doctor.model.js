const mongoose = require('mongoose');
const doctorSchema = new mongoose.Schema({
    doctorName: {
        type: Object,
        required: true
    },
    doctorImage: {
        type: String,
        required: true
    },
    category: {
        type: [mongoose.Types.ObjectId],
        ref: 'Category',
        required: true
    },
    experience: {
        type: Number,
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    addedDate: {
        type: Date,
        required: true,
        default: () => new Date()
    },
    modifiedDate: {
        type: Date,
        required: true,
        default: () => new Date()
    },
    isTopDoctor: { type: Boolean, default: false },

});

module.exports = mongoose.model("doctor", doctorSchema);