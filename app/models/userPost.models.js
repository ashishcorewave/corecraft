const mongoose = require("mongoose")

const UserPostSchema = mongoose.Schema(
  {
    post: {
      type: String,
      required: true
    },
    images: { type: [String], default: null },
    likeCount: {
      type: Number,
      default: 0
    },
    commentCount: {
      type: Number,
      default: 0
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("UserPost", UserPostSchema)
