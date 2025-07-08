const Question = require("../models/question.model.js")
const Quiz = require("../models/quiz.model.js")
const messages = require("../utility/messages")
const config = require("config")
const isUrl = require("is-url")
const mongoose = require('mongoose');
//Created New
exports.create = async (req, res) => {
  try {
    const language = req.headers["language"] || req.body.language;

    // Initialize question object with dynamic language
    const question = new Question({
      question: { [language]: req.body.question },
      quiz_id: req.body.quiz_id,
      question_type: req.body.question_type,
    });

    // Handle answers dynamically by language
    let answers = [];
    const requestAnswer = req.body.answers || [];

    requestAnswer.forEach((val, index) => {
      answers.push({
        id: index + 1,
        answer: { [language]: val.answer },
        isCorrect: { [language]: val.isCorrect ? true : false }
      });
    });

    if (answers.length > 0) {
      question.answers = answers;
    }

    // Optional external link validation
    if (req.body.external_link) {
      if (isUrl(req.body.external_link)) {
        question.external_link = req.body.external_link;
      } else {
        return res.status(400).json({ status: false, message: "Please enter a valid URL" });
      }
    }

    // Save the question
    const savedQuestion = await question.save();

    // Push question ID to Quiz's questions array
    await Quiz.updateOne(
      { _id: req.body.quiz_id },
      { $push: { questions: savedQuestion._id } }
    );

    return res.status(201).json({ status: true, message: messages.create.success });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
};

//Created New
exports.getAll = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";

    const aggregationPipeline = [
      {
        $match: {
          isDeleted: false,
          [`question.${language}`]: { $exists: true, $ne: "" }
        }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "quiz_id",
          foreignField: "_id",
          as: "quizzResult"
        }
      },
      {
        $unwind: {
          path: "$quizzResult",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          question: { $ifNull: [`$question.${language}`, ""] },
          quiz_title: { $ifNull: [`$quizzResult.title.${language}`, ""] }
        }
      },
      {
        $project: {
          question: 1,
          question_type: 1,
          quiz_id: 1,
          quiz_title: 1,
          shortCode:language,
        }
      }
    ];

    const fetchQuery = await Question.aggregate(aggregationPipeline);

    return res.status(200).json({ status: true, message: "Questions fetched successfully", data: fetchQuery });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: err.message || "Internal Server Error" });
  }
};

//Created New
exports.getById = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";
    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.params.questionId)
    };

    const aggregationPipeline = [
      {
        $match: filter
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "quiz_id",
          foreignField: "_id",
          as: "quizzResult"
        }
      },
      {
        $unwind: {
          path: "$quizzResult",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          question: { $ifNull: [`$question.${language}`, ""] },
          external_link: { $ifNull: [`$external_link.${language}`, ""] },
          answers: {
            $map: {
              input: "$answers",
              as: "ans",
              in: {
                answer: {
                  $ifNull: [`$$ans.answer.${language}`, ""]
                },
                isCorrect: {
                  $ifNull: [`$$ans.isCorrect.${language}`, false]
                }
              }
            }
          },
          quiz_title: {
            $ifNull: [`$quizzResult.title.${language}`, ""]
          }
        }
      },
      {
        $project: {
          question: 1,
          question_type: 1,
          quiz_id: 1,
          quiz_title: 1,
          external_link: 1,
          answers: 1
        }
      }
    ];

    const fetchQuery = await Question.aggregate(aggregationPipeline);

    if (fetchQuery.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Question not found"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Questions fetched successfully",
      data: fetchQuery[0]
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message || "Internal Server Error"
    });
  }
};


//Created New

exports.update = async (req, res) => {
  try {
    const language = req.headers["language"] || req.body.language || "en";

    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.params.questionId)
    };

    const existingQuestion = await Question.findOne(filter).lean();
    if (!existingQuestion) {
      return res.status(404).json({ status: false, message: messages.update.error });
    }

    const updateQuery = {};

    if (req.body.question) {
      updateQuery[`question.${language}`] = req.body.question;
    }

    if (req.body.quiz_id) {
      updateQuery.quiz_id = req.body.quiz_id;
    }

    if (req.body.question_type) {
      updateQuery.question_type = req.body.question_type;
    }

    if (req.body.external_link) {
      if (isUrl(req.body.external_link)) {
        updateQuery[`external_link.${language}`] = req.body.external_link;
      } else {
        return res.status(400).json({ status: false, message: "Please enter a valid URL" });
      }
    }

    // Update multilingual answers
    if (req.body.answers && Array.isArray(req.body.answers)) {
      const updatedAnswers = existingQuestion.answers || [];
      req.body.answers.forEach((ans, index) => {
        if (!updatedAnswers[index]) {
          updatedAnswers[index] = { answer: {}, isCorrect: {} };
        }

        updatedAnswers[index].answer[language] = ans.answer || "";
        updatedAnswers[index].isCorrect[language] = ans.isCorrect === true;
      });

      updateQuery.answers = updatedAnswers;
    }

    const updatedDoc = await Question.findByIdAndUpdate(req.params.questionId, updateQuery, { new: true });

    if (!updatedDoc) {
      return res.status(404).json({ status: false, message: messages.update.error });
    }

    return res.status(200).json({
      status: true,
      message: messages.update.success,
      data: updatedDoc
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message || "Internal Server Error"
    });
  }
};

//Created New
exports.delete = (req, res) => {
  Question.findByIdAndUpdate(req.params.questionId, { isDeleted: true }, { new: true })
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

exports.getQuestionbyQuizId = async (req, res) => {
  const query = {}
  if (req.params.id) {
    query.quiz_id = req.params.id
  }

  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

  let count = await Question.countDocuments(query)

  Question.find(query, {}, { limit: limit, skip: offset })
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
