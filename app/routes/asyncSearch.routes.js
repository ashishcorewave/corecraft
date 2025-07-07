const express = require('express');
const router = express.Router();
const asyncSearch = require("../controllers/asyncSearch.controller.js")

router.get("/asyncSearch/quiz", asyncSearch.asyncSearchQuiz)

module.exports = router;
