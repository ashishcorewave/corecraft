const mongoose = require("mongoose");

const VideoReadSchema = mongoose.Schema(
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
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("VideoRead", VideoReadSchema);