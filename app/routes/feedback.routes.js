const express = require('express');
const router = express.Router();
const feedback = require("../controllers/feedback.controller.js");


router.post("/feedback", feedback.create);//done
router.get("/feedback", feedback.getAll);//done


module.exports = router;
