const mongoose = require("mongoose");

const UserBadgeSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    badge_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
      required: true
    },
    points: {
      type: Number,
      default: 0
    },
    auto: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserBadge", UserBadgeSchema);