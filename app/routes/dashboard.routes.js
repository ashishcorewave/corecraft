const dashboard = require("../controllers/dashboard.controller.js");
const express = require("express");
const router = express.Router();

router.post("/dashboard", dashboard.adminDashboard)//done
router.get("/userEngagementData", dashboard.updateUserEngagementData)//done
router.get("/community-feeds", dashboard.getCommunityFeeds);//done
router.put("/community-feeds", dashboard.editCommunityFeed)

module.exports = router;