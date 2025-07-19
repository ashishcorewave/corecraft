const mongoose = require("mongoose")

const ResourceItemsSchema = mongoose.Schema(
  {
    specialistName: {
      type: Object,
      required: true
    },
    resourceId: {
      type: mongoose.Types.ObjectId,
      ref: 'NewResource'
    },
    specialistImage: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: ""
    },
    mobileNo: {
      type: String,
      required: true,
    },
    whatsappNo: {
      type: String,
      required: true,
    },
    alternateNo: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true
    },
    address: {
      type: Object,
      required: true
    },
    landmark: {
      type: Object,
      required: true
    },
    city: {
      type: Object,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    stateId: {
      type: mongoose.Types.ObjectId,
      ref: 'State'
    },
    description: {
      type: Object,
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
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
  }

)

module.exports = mongoose.model("NewResourceItem", ResourceItemsSchema)
