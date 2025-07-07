const mongoose = require("mongoose");

const UserSchema = mongoose.Schema(
  {
    first_name: {
      type: String,
      default: "",
      required: false,
    },
    last_name: {
      type: String,
      default: "",
      required: false,
    },
    username: {
      type: String,
    },
    age: {
      type: String,
      default: "",
      required: false,
    },
    profile_picture: {
      type: String,
      default: ""
    },
    address: {
      type: String,
    },
    pincode: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    otp: {
      type: String,
      default: ""
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    cancer_type: {
      type: String,
      // enum: ["Patient", "Caregiver", "Relative", "Other"],
      default: ""
    },
    join_our_group: {
      type: String,
      // enum: ["Yes", "No"],
      default: "No"
    },
    treatment_journey: {
      type: String,
      default: ""
    },
    looking_for: {
      type: String,
      default: ""
    },
    user_type: {
      type: String,
      // enum: ["Patient", "Caregiver", "Relative", "Other"],
      default: null
    },
    gender: {
      type: String,
      enum: ["male", "female", ""],
      default: ""
    },
    language: {
      type: String,
      enum: ["english", "hindi", "gujrati"],
      default: "english"
    },
    contact_number: {
      type: String,
      default: ""
    },
    state: {
      type: String,
      default: ""
    },
    selectedState: {
      type: Object,
      default: { label: "", value: "" }
    },
    city: {
      type: String,
      default: ""
    },
    has_subscription: {
      type: Boolean,
    },
    quizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],
    badges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Badge",
      },
    ],
    invites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invite",
      },
    ],
    magazines_read_count: {
      type: Number,
      default: 0
    },
    feed_comment_count: {
      type: Number,
      default: 0
    },
    feed_like_count: {
      type: Number,
      default: 0
    },
    feed_posted_count: {
      type: Number,
      default: 0
    },
    quiz_posted_count: {
      type: Number,
      default: 0
    },
    read_article_count: {
      type: Number,
      default: 0
    },
    points_earned: {
      type: Number,
      default: 0
    },
    points_used: {
      type: Number,
      default: 0
    },
    points_balance: {
      type: Number,
      default: 0
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    isUpdated: {
      type: Number,
      default: 0
    },
    badgeCount: {
      type: Number,
      default: 0
    },
    checkForNewBadge: {
      type: Number,
      default: 0
    },
    facebookId: {
      type: String,
      default: ""
    },
    googleId: {
      type: String,
      default: ""
    },
    appleId: {
      type: String,
      default: ""
    },
    isDeleted: {
      type: Boolean, default: false
    },
    firebase_registration_token: {
      type: String,
      default: null
    },
    device_type: {
      type: String,
      default: null
    },
    lastAgeUpdate: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);