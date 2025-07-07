const QuizResponse = require("../models/quiz.response.model.js")
const UserAnswer = require("../models/quiz.response.model.js")
const Quiz = require("../models/quiz.model.js")
const userHelper = require("../utility/UserHelper")
const messages = require("../utility/messages")
const config = require("config")

exports.create = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"]);
  const answers = new QuizResponse({
    quiz_id: req.body.quiz_id,
    user_id: userDetail.data.user_id,
    question: req.body.question,
    start_time: Date.now(),
    end_time: Date.now()
  })
  Quiz.findById(req.body.quiz_id)
    .populate("questions").lean()
    .then((data) => {
      if (data) {
        const correct = data.questions.map((val) => {
          return val.answers.filter((bob) => bob.isCorrect.en == true)
        })
        function flatten(arr) {
          return arr.flat(Infinity)
        }
        const correct_answer = flatten(correct)
        const correct_answer_ids = correct_answer.map((val) => `${val._id}`)
        const user_answer = req.body.question.map((val) => `${val.answer_id}`)
        let points = correct_answer_ids.filter((x) => user_answer.includes(x))
        answers.total_questions = correct_answer_ids.length
        answers.correct_answer = points.length
        answers.incorrect_answer = correct_answer_ids.length - points.length
        answers.result = (answers.correct_answer / answers.total_questions) * 100
      }
      answers
        .save()
        .then(async (data) => {
          await userHelper.assignPoint(userDetail.data.user_id, "Participate in Quiz")
          return res.send({
            status: true,
            message: messages.create.success,
            data: data
          })
        })
        .catch((err) => {
          return res.status(500).send({
            message: err.message || messages.create.error
          })
        })
    })
}

exports.getAll = async(req, res) => {
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
  let count =await QuizResponse.countDocuments(req.query);
  QuizResponse.find({}, {}, { limit: limit, skip: offset, sort: { _id: -1 } })
    .populate("user_id", "first_name last_name")
    .populate("quiz_id", "title")
    .populate("question")
    .then((data) => {
      return res.send({
        status: true,
        message: messages.read.success,
        data: data,
        count: count
      })
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || messages.read.error
      })
    })
}

exports.getById = (req, res) => {
  Quiz.findById(req.params.quizId)
    .populate("questions")
    .then((data) => {
      if (data) {
        return res.send({
          status: true,
          message: messages.read.success,
          data: data
        })
      }
      return res.status(404).send({
        message: messages.read.error
      })
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: messages.read.error
        })
      }
      return res.status(500).send({
        message: messages.read.error
      })
    })
}

exports.getById = (req, res) => {
  QuizResponse.findById(req.params.userAnswerId)
    .then((data) => {
      if (data) {
        return res.send({
          status: true,
          message: messages.read.success,
          data: data
        })
      }
      return res.status(404).send({
        message: messages.read.error
      })
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: messages.read.error
        })
      }
      return res.status(500).send({
        message: messages.read.error
      })
    })
}

exports.update = (req, res) => {
  if (
    req.body.question === "" &&
    req.body.answer === "" &&
    req.body.user === ""
  ) {
    return res.status(400).send({
      message: messages.update.empty
    })
  }

  const updateQuery = {}
  if (req.body.question) {
    updateQuery.question = req.body.question
  }
  if (req.body.answer) {
    updateQuery.answer = req.body.answer
  }
  if (req.body.user_id) {
    updateQuery.user_id = req.body.user_id
  }

  QuizResponse.findByIdAndUpdate(req.params.userAnswerId, updateQuery, {
    new: true
  })
    .then((data) => {
      if (data) {
        return res.send({
          status: true,
          message: messages.update.success,
          data: data
        })
      }
      return res.status(404).send({
        message: messages.update.error
      })
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: messages.update.error
        })
      }
      return res.status(500).send({
        message: messages.update.error
      })
    })
}

exports.delete = (req, res) => {
  QuizResponse.findByIdAndDelete(req.params.userAnswerId)
    .then((data) => {
      if (data) {
        return res.send({ status: true, message: messages.delete.success })
      }
      return res.status(404).send({
        message: messages.delete.error
      })
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message: messages.delete.error
        })
      }
      return res.status(500).send({
        message: messages.delete.error
      })
    })
}