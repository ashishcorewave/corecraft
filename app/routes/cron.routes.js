const express = require('express');
const router = express.Router();
const cron = require("../controllers/cron.controller.js")


router.get("/updateAppUsage", cron.updateAppUsage)
router.get("/autoAssignBadge", cron.autoAssignBadge)
router.get("/springer", cron.springer)
router.get("/eventRsvpNotification", cron.eventRsvpNotification)
router.get("/userAgeUpdate", cron.userAgeUpdate)
router.get("/testNotification", cron.testNotification)
  // app.get("/updateVideo", cron.updateVideoSortOrder)
  // app.get("/updateVideoDuration", cron.updateVideoDuration)


  module.exports = router;
