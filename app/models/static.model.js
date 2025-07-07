const mongoose = require("mongoose")

const StaticSchema = mongoose.Schema(
  {
    title: {
      type: Object,
      required: true
    },
    content: {
      type: Object,
      default: ""
    },
    type: {
      type: String,
      default: ""
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

module.exports = mongoose.model("Static", StaticSchema)
