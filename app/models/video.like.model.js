const mongoose = require("mongoose");

const VideoLikeSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    video_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Video"
    },
    isLiked: {
      type: Boolean, default: true
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("VideoLike", VideoLikeSchema);