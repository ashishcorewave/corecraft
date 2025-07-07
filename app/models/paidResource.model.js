const mongoose = require("mongoose");

const PaidResourceSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    resource_link: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PaidResource", PaidResourceSchema);
