const mongoose = require("mongoose")

const UserPointSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    point_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Point"
    },
    activity_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    activity_name: {
      type: String,
      default: ""
    },
    points: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("UserPoint", UserPointSchema)