const mongoose = require("mongoose");

const AudioReadSchema = mongoose.Schema(
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
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AudioRead", AudioReadSchema);