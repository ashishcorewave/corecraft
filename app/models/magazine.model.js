const mongoose = require("mongoose");

const MagazineSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    articles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Article",
      },
    ],
    readCount: {
      type: Number,
      default: 0
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Magazine", MagazineSchema);
