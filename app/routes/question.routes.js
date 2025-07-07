
const express = require('express');
const router = express.Router();
const questions = require("../controllers/question.controller.js")
  router.post("/question", questions.create)//done
  router.get("/question", questions.getAll)//done
  router.get("/question/:questionId", questions.getById)//done
  router.get("/question/quiz/:id", questions.getQuestionbyQuizId)//done
  router.put("/question/:questionId", questions.update)
  router.delete("/question/:questionId", questions.delete)

module.exports = router;
