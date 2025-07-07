const mongoose = require("mongoose");

const UserStorySchema = mongoose.Schema(
  {
    document_link: {
      type: String,
      required: true,
    },
    document: {
      type: String,
    },
    story: {
      type: String,
    },
    photos: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserStory", UserStorySchema);
