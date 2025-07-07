const mongoose = require("mongoose")

const ContactCategorySchema = mongoose.Schema(
  {
    name: {
      type: Object,
      required: true
    },
    icon: {
      type: String,
      default: ""
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contact"
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("ContactCategory", ContactCategorySchema)
