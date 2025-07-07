const mongoose = require("mongoose")

const StateSchema = mongoose.Schema(
  {
    value: {
      type: String,
      required: true
    },
    label: {
      type: Object
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
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

module.exports = mongoose.model("State", StateSchema)