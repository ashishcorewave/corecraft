const mongoose = require("mongoose");

const ArticleReadSchema = mongoose.Schema(
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
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ArticleRead", ArticleReadSchema);