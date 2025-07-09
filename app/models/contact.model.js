const mongoose = require("mongoose")

const ContactSchema = mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContactCategory"
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    name: {
      type: Object,
      required: true
    },
    email: {
      type: String,
      default: ""
    },
    website: {
      type: String,
      default: ""
    },
    contact_number: {
      type: String
    },
    whatsapp_number: {
      type: String,
      default: ""
    },
    contacts: {
      type: String,
      default: ""
    },
    specialization: {
      type: Object
    },
    education: {
      type: Object
    },
    office_hours: {
      type: Object
    },
    institution: {
      type: Object
    },
    city: {
      type: Object
    },
    pincode: {
      type: String
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State"
    },
    address: {
      type: Object
    },
    loc: { // Location for Geo co-ordinates
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], default: [] },
    },
    remarks: {
      type: Object
    },
    photo: {
      type: String
    },
    isDeleted: {
      type: Boolean, default: false
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("Contact", ContactSchema)