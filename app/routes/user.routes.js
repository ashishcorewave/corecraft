const express = require("express");
const router = express.Router();
const users = require("../controllers/user.controller.js");

// 🔹 User CRUD Operations
router.post("/user", users.create);
router.get("/user", users.getAll);
router.get("/user/search", users.searchUser);
router.get("/user/:userId", users.getById);
router.put("/user/:userId", users.update);
router.delete("/:userId", users.delete);

//  🔹 Authentication & Profile
router.post("/auth/admin", users.adminLogin);

router.get('/check', users.check);

router.post("/auth/signup", users.signUp);
router.post("/auth/login", users.login);
router.post("/verifyOtp", users.verifyOtp);
router.post("/profile", users.getUserProfile);
router.post("/update-profile", users.updateProfile);
router.post("/forgot", users.forgotPassword);
router.post("/changePassword", users.changePassword);

router.post("/auth/updateFcmToken", users.updateFcmToken);


// 🔹 User Engagement & Stats
router.post("/feed-stats", users.feedStatistics);
router.post("/quiz-list", users.myQuizList);
router.post("/events", users.myEvents);
router.post("/my-feeds", users.myFeeds);
router.post("/appUsage", users.appUsage);
router.post("/getUserEngagement", users.getUserEngagement);
router.post("/getUserBadges", users.getUserBadges);
router.post("/getFilterList", users.getFilterList);
router.post("/leaderBoard", users.getLeaderBoardData);

// // 🔹 Social & Misc
router.post("/socialSignUp", users.socialSignUp);
router.post("/getAppLanguage", users.getAppLanguage);
router.post("/downloadUsers", users.downloadUsers);
router.post("/deleteProfilePic", users.deleteProfilePic);


//Corewave API
router.post('/download-date-registration', users.downloadDateRegistration)

module.exports = router;
