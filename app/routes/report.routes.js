const express = require('express');
const router = express.Router();
const report = require("../controllers/report.controller.js")

router.post("/reportContent", report.create);
router.get("/getReportList", report.getAll);
router.put('/reportContent', report.editReport)//new api
router.get('/reportContent/:reportId', report.getReportById); //new api

module.exports = router;
