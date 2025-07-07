const mongoose = require("mongoose");

const ReportSchema = mongoose.Schema(
  {
    reportText: {
      type: String,
      required: true,
    },
    reportType: {
      type: String,
      enum: ['article', 'comment', 'feed'],
      required: true
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    message: {
      type: String
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", ReportSchema);