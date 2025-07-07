const mongoose = require("mongoose");

const ArticleReportSchema = mongoose.Schema(
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
    report_text: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ArticleReport", ArticleReportSchema);