const mongoose = require("mongoose")

const EventBookmarkSchema = mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    date: {
      type: Date
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("EventBookmark", EventBookmarkSchema)
