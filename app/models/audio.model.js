const mongoose = require("mongoose")

const AudioSchema = mongoose.Schema(
  {
    title: {
      type: Object,
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category"
    },
    contact_level: {
      type: String,
      default: ""
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Doctor"
    },
    description: {
      type: Object
    },
    audio_link: {
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
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("Audio", AudioSchema)