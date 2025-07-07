const mongoose = require("mongoose")

const FeedbackSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    article_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article"
    },
    rating: {
      type: Number,
      default: 0
    },
    message: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("Feedback", FeedbackSchema)