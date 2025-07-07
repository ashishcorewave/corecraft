const mongoose = require("mongoose")

const CommentSchema = mongoose.Schema(
  {
    body: {
      type: String,
      required: true
    },
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "UserPost"
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    },
    replyCount: {
      type: Number,
      default: 0
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

module.exports = mongoose.model("Comment", CommentSchema)
