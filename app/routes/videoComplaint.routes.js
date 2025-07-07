const express = require('express');
const router = express.Router();
const videoComplaints = require("../controllers/videoComplaint.controller.js")


router.post("/videoComplaint", videoComplaints.create)
router.get("/videoComplaint", videoComplaints.getAll)
router.get("/videoComplaint/:videoComplaintsId", videoComplaints.getById)
router.put("/videoComplaint/:videoComplaintsId", videoComplaints.update)
router.delete("/videoComplaint/:videoComplaintsId", videoComplaints.delete)


module.exports = router;
