const mongoose = require("mongoose");

const InviteSchema = mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    from_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    date: {
      type: Date,
      default: Date.now
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invite", InviteSchema);
