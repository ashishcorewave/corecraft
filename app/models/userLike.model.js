const mongoose = require("mongoose");

const UserLikeSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserPost",
    },
    isLiked: {
      type: Boolean, default: true
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserLike", UserLikeSchema);