const mongoose = require("mongoose")

const ContactLevelSchema = mongoose.Schema(
  {
    value: {
      type: String,
      required: true
    },
    label: {
      type: Object
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("ContactLevel", ContactLevelSchema)