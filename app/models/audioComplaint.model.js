const mongoose = require("mongoose")

const AudioComplaintsSchema = mongoose.Schema(
  {
    audio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audio"
    },
    issue: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["Raised", "Resolved"],
      default: "Raised"
    },
    date: {
      type: Date,
      default: Date.now()
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("AudioComplaint", AudioComplaintsSchema)
