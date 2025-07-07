const mongoose = require("mongoose");

const EventBookmarkSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Event"
    },
    isActive: {
      type: Boolean, default: true
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EventBookmark", EventBookmarkSchema);