const express = require("express");
const router = express.Router();
const quizzes = require("../controllers/quiz.controller.js")
const upload = require("../middleware/upload.js");


router.post("/quiz", quizzes.create);//done
router.get("/quiz", quizzes.getAll);
router.get("/quiz/search", quizzes.searchQuiz);//done
router.get("/quiz/:quizId", quizzes.getById);
router.put("/quiz/:quizId", upload.single("Img"), quizzes.update);
router.delete("/quiz/:quizId", quizzes.delete);

module.exports = router;