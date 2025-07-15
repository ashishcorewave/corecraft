const mongoose = require("mongoose")

const SliderSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    sliderType:{
       type:String,
       required:true,
       enum:["slider", "audiocast", "videocast", "article"]
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
