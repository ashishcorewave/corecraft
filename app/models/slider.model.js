const mongoose = require("mongoose")

const SliderSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default: ""
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

module.exports = mongoose.model("Slider", SliderSchema)
