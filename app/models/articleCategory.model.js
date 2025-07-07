const mongoose = require("mongoose")

const CategorySchema = mongoose.Schema(
  {
    name: {
      type: Object,
      required: true
    },
    icon: {
      type: String,
      default: ""
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
    isTopCategory: { type: Boolean, default: false },
  }

)

module.exports = mongoose.model("Category", CategorySchema)
