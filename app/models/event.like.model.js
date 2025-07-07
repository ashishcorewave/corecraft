const mongoose = require("mongoose");

const EventLikeSchema = mongoose.Schema(
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
    isLiked: {
      type: Boolean, default: true
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EventLike", EventLikeSchema);