const mongoose = require('mongoose');
const pinCodeSchema = new mongoose.Schema({
    pincode: {
        type: Object,
        required: true
    },
    stateId:{
        type:mongoose.Types.ObjectId,
        ref:'State'
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
});

module.exports = mongoose.model("pincode", pinCodeSchema);