const mongoose = require("mongoose")

const ArticleSchema = mongoose.Schema(
  {
    title: {
      type: Object,
      required: true
    },
    description: {
      type: Object,
      required: true
    },
    content: {
      type: Object,
      required: true
    },
    tags: {
      type: Object
    },
    availableIn: [],
    Img: {
      type: Object
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },
    contact_level: {
      type: String,
      default: ""
    },
    quiz: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Quiz"
      }
    ],
    sort_order: {
      type: Object
    },
    readCount: {
      type: Number,
      default: 0
    },
    likeCount: {
      type: Number,
      default: 0
    },
    commentCount: {
      type: Number,
      default: 0
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    isTopArticle: { type: Boolean, default: false },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Doctor"
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  },
  
)

module.exports = mongoose.model("Article", ArticleSchema)
