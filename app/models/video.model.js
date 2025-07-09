const mongoose = require("mongoose")

const VideoSchema = mongoose.Schema(
  {
    title: {
      type: Object,
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor"
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    contact_level: {
      type: String,
      default: ""
    },
    description: {
      type: Object
    },
    video_link: {
      type: Object,
      required: true
    },
    featured_image: {
      type: Object
    },
    source: {
      type: Object
    },
    duration: {
      type: Object
    },
    sort_order: {
      type: Object
    },
    availableIn: [],
    likeCount: {
      type: Number,
      default: 0
    },
    commentCount: {
      type: Number,
      default: 0
    },
    isDeleted: {
      type: Boolean, default: false
    },
    isTopVideoCast: { type: Boolean, default: false },
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("Video", VideoSchema)
