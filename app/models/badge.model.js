const mongoose = require("mongoose");

const BadgeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    badgeType: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: ""
    },
    points: {
      type: Number,
      default: 0
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    isDeleted: {
      type: Boolean, default: false
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Badge", BadgeSchema);
