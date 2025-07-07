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
router.post("/auth/admin", users.adminLogin);//done

router.get('/check', users.check);

router.post("/auth/signup", users.signUp);//done
router.post("/auth/login", users.login);//done
router.post("/verifyOtp", users.verifyOtp);//done
router.post("/profile", users.getUserProfile);//done
router.post("/update-profile", users.updateProfile);//done
router.post("/forgot", users.forgotPassword);//done
router.post("/changePassword", users.changePassword);//done

router.post("/auth/updateFcmToken", users.updateFcmToken);


// 🔹 User Engagement & Stats
router.post("/feed-stats", users.feedStatistics);//done
router.post("/quiz-list", users.myQuizList);//done
router.post("/events", users.myEvents);//done
router.post("/my-feeds", users.myFeeds);//done
router.post("/appUsage", users.appUsage);//done
router.post("/getUserEngagement", users.getUserEngagement);//done
router.post("/getUserBadges", users.getUserBadges);//done
router.post("/getFilterList", users.getFilterList);//done
router.post("/leaderBoard", users.getLeaderBoardData);//done

// // 🔹 Social & Misc
router.post("/socialSignUp", users.socialSignUp);
router.post("/getAppLanguage", users.getAppLanguage);
router.post("/downloadUsers", users.downloadUsers);
router.post("/deleteProfilePic", users.deleteProfilePic);


//Corewave API
router.post('/download-date-registration', users.downloadDateRegistration)

module.exports = router;
