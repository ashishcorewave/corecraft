const mongoose = require("mongoose");

const MagazineReadSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    magazine_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Magazine",
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MagazineRead", MagazineReadSchema);