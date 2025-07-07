const mongoose = require("mongoose");

const AudioLikeSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    audio_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Audio"
    },
    isLiked: {
      type: Boolean, default: true
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AudioLike", AudioLikeSchema);