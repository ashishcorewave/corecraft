const mongoose = require("mongoose");

const ArticleLikeSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    article_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Article"
    },
    isLiked: {
      type: Boolean, default: true
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ArticleLike", ArticleLikeSchema);