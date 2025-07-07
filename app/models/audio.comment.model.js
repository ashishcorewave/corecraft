const mongoose = require("mongoose");

const AudioCommentSchema = mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
    },
    audio: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Audio",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    isDeleted: {
      type: Boolean, default: false
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AudioComment", AudioCommentSchema);