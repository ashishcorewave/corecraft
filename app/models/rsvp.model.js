const mongoose = require("mongoose")

const RsvpSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      requred: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      requred: true
    },
    event_type: {
      type: String,
      enum: ["Online", "Offline"],
      requred: true
    },
    rsvp_date: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    notified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("Rsvp", RsvpSchema)
