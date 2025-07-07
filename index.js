const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const https = require("https");
const cron = require("node-cron");
const config = require('config');
const Event = require("./app/models/event.model.js");
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload')
const app = express();
const path = require('path');
dotenv.config();



app.use(fileUpload());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors())
// app.use("/uploads", express.static("uploads"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // CORS configuration
// app.use(
//   cors({
//     origin: [
//       "http://localhost:7012",
//       "http://localhost:3012",
//       "http://localhost:3013",
//       "http://128.199.212.15:7500",
//       "http://128.199.212.15:7501",
//       "http://206.189.134.155:7501",
//       "http://admin.icsapp.org",
//       "https://admin.icsapp.org",
//       "http://admin.icsapp.org:7501",
//       "https://admin.icsapp.org:7501"
//     ],
//     credentials: true
//   })
// );

// // Server Setup
const PORT = process.env.PORT || 7012;
if (process.env.NODE_ENV === "production") {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };
  https.createServer(options, app).listen(PORT, () => {
    console.log(`🚀 Server running securely on HTTPS port ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on HTTP port ${PORT}`);
  });
}


// ✅ **MongoDB Connection**
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Successfully connected to MongoDB Atlas"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Define a simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome. It's working!" });
});




// Require routes for various parts of your application

app.use(require("./app/routes/cron.routes.js"));
app.use(require("./app/routes/language.routes.js"));
app.use(require("./app/routes/user.routes.js"));



// Protected Routes Middleware
// var protectedRoutes = express.Router();
// app.use(protectedRoutes);

//  Add logging for debugging


app.use(async (req, res, next) => {
  const publicPaths = ['/auth/signup', '/auth/login'];
  if (publicPaths.includes(req.path)) return next();
  console.log("JWT Token verification starting...");
  let token = req.headers["access-token"] || req.headers["authorization"];
  console.log(token, "Token indexjs");
  if (token) {
    try {
      const decoded = await jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      console.error("Invalid token:", err.message);
      return res.status(401).json({ status: 0, message: "Invalid token" });
    }
  } else {
    console.error("No token provided.");
    res.status(401).json({
      status: 0,
      message: "No token provided."
    });
  }
});


//  Define routes after token validation middleware
app.use(require("./app/routes/article.routes.js"));
app.use(require("./app/routes/articleCategory.routes.js"));
app.use(require("./app/routes/audio.routes.js"));
app.use(require("./app/routes/audioComplaint.routes.js"));
app.use(require("./app/routes/badge.routes.js"));
app.use(require("./app/routes/comment.routes.js"));
app.use(require("./app/routes/contact.routes.js"));
app.use(require("./app/routes/contactCategory.routes.js"));
app.use(require("./app/routes/dashboard.routes.js"));
app.use(require("./app/routes/event.routes.js"));
app.use(require("./app/routes/eventBookmark.routes.js"));
app.use(require("./app/routes/feedback.routes.js"));
app.use(require("./app/routes/invite.routes.js"));
app.use(require("./app/routes/magazine.routes.js"));
app.use(require("./app/routes/paidResource.routes.js"));
app.use(require("./app/routes/point.routes.js"));
app.use(require("./app/routes/question.routes.js"));
app.use(require("./app/routes/quiz.routes.js"));
app.use(require("./app/routes/quizResponse.routes.js"));
app.use(require("./app/routes/report.routes.js"));
app.use(require("./app/routes/rsvp.routes.js"));
app.use(require("./app/routes/slide.routes.js"));
app.use(require("./app/routes/state.routes.js"));
app.use(require("./app/routes/userPost.routes.js"));
app.use(require("./app/routes/userStory.routes.js"));
app.use(require("./app/routes/video.routes.js"));
app.use(require("./app/routes/videoComplaint.routes.js"));
app.use(require("./app/routes/asyncSearch.routes.js"));
app.use(require("./app/routes/doctor.routes.js"));
app.use(require("./app/routes/pincode.routes.js"));
// // Cron Job for Event Expiry
cron.schedule("0 0 * * *", async () => {
  const date_now = Date.now();
  const events = await Event.find({ end_date: { $lt: date_now }, isExpired: false }, { _id: 1 });
  const ids = events.map((val) => val._id);
  if (ids.length) {
    for (let i = 0; i < ids.length; i++) {
      await Event.updateMany({ _id: ids[i] }, { $set: { isExpired: true } });
    }
  }
});



