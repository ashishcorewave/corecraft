const mongoose = require("mongoose")

const PointSchema = mongoose.Schema(
  {
    activity_name: {
      type: String,
      required: true
    },
    points: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("Point", PointSchema)
