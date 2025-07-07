const mongoose = require("mongoose")

const EventSchema = mongoose.Schema(
  {
    title: {
      type: Object,
      required: true
    },
    description: {
      type: Object
    },
    start_date:{
        type:Date
    },
    photo: {
      type: String,
      required: true
    },
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date,
      required: true
    },
    event_type: {
      type: String,
      enum: ["Online", "Offline"],
      required: true
    },
    platform: {
      type: String
    },
    location: {
      type: String
    },
    loc: { // Location for Geo co-ordinates
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    venueDetail: {
      type: Object
    },
    meeting_link: {
      type: String
    },
    minimum_participants: {
      type: Number,
      // required: true
    },
    maximum_participants: {
      type: Number,
      // required: true
    },
    spoc_name: {
      type: Object,
      // required: true
    },
    spoc_number: {
      type: String
    },
    spoc_email: {
      type: String
    },
    comments: {
      type: String
    },
    status: {
      type: String,
      enum: ["Event_Created", "Event_Started", "Event_Ended"]
    },
    last_date_to_enroll: {
      type: Date
    },
    attendeeCount: {
      type: Number,
      default: 0
    },
    likeCount: {
      type: Number,
      default: 0
    },
    bookmarkCount: {
      type: Number,
      default: 0
    },
    isExpired: {
      type: Boolean,
      default: false
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
  },
  
)

module.exports = mongoose.model("Event", EventSchema)