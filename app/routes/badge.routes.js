const express = require("express");
const router = express.Router();
const badges = require("../controllers/badge.controller.js");
const upload = require("../middleware/upload.js");


router.post("/badge",badges.create);//done

router.get("/badge", badges.getAll);//done

router.get("/badge/:badgeId", badges.getById);//done

router.put("/badge/:badgeId", upload.single('icon'), badges.update);//done //Image is not updated

router.delete("/badge/:badgeId", badges.delete);//done

router.post("/assign-badge", badges.assignBadge);//done

router.delete("/remove-badge/:assignBadgeId", badges.removeBadge);

router.post("/assigned-badge-list", badges.getAssignedBadges);//done

router.get('/leaderboard', badges.leaderBoardTopThreeBadge)//New API
module.exports = router;

