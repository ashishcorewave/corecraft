const mongoose = require("mongoose")

const UserEngagementSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "User"
    },
    articles_read: {
      type: Number,
      default: 0
    },
    magazines_read: {
      type: Number,
      default: 0
    },
    quizzes_attempted: {
      type: Number,
      default: 0
    },
    events_attended: {
      type: Number,
      default: 0
    },
    post_made: {
      type: Number,
      default: 0
    },
    comments_made: {
      type: Number,
      default: 0
    },
    points_earned: {
      type: Number,
      default: 0
    },
    likes_received: {
      type: Number,
      default: 0
    },
    badges_earned: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("UserEngagement", UserEngagementSchema)