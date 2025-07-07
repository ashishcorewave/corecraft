const mongoose = require("mongoose");

const ArticleCommentSchema = mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
    },
    article: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Article",
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

module.exports = mongoose.model("ArticleComment", ArticleCommentSchema);