const mongoose = require("mongoose")

const LanguageSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    shortCode: {
      type: String,
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
  })

module.exports = mongoose.model("Language", LanguageSchema)
