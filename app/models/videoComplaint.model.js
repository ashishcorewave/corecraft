const mongoose = require("mongoose")

const VideoComplaintsSchema = mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video"
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

module.exports = mongoose.model("VideoComplaint", VideoComplaintsSchema)
