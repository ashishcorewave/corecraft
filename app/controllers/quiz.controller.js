const Quiz = require("../models/quiz.model.js");
const messages = require("../utility/messages");
const userHelper = require("../utility/UserHelper");
const config = require("config");
const mongoose = require('mongoose');
const upload = require('../utility/fileUpload');

//Created New
exports.create = async (req, res) => {
  try {
    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);
    const { title, description } = req.body;
    const language = req.headers["language"] || req.body.language;

    const insertQuery = new Quiz({
      title: { [language]: title },
      description: { [language]: description },
      created_by: userDetail.data.user_id,
    });

    await insertQuery.save();
    return res.status(201).json({ status: true, code: 201, message: messages.create.success });

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message });
  }
};

//Created New
exports.getAll = async (req, res) => {
  try {
    const filter = { isDeleted: false };

    const offset = +req.query.offset || 0; // 0-based indexing
    const perPage = +req.query.perPage || 10;
    const q = req.query.q || "";

    const language = req.query.language || req.headers["language"] || "en";
    const count = await Quiz.countDocuments(filter);
    const getAllQuery = await Quiz.find(filter).select("_id title description Img").sort({ _id: -1 }).lean();

    const filteredQuiz = getAllQuery.filter((item) => {
      const quizInLang = item.title && item.title[language];
      if (!quizInLang) return false;
      if (q) {
        return quizInLang.toLowerCase().includes(q.toLowerCase());
      }
      return true;
    });

    const data = filteredQuiz.slice(offset, offset + perPage)
      .filter(item => item.title?.[language] && item.description?.[language])
      .map(item => ({
        _id: item._id,
        title: item.title[language],
        description: item.description[language],
        shortCode: language,
      }));

    return res.status(200).json({ status: true, code: 200, data, count: count });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
};


//created New
exports.getById = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";

    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.params.quizId)
    };

    const quiz = await Quiz.findOne(filter).select("_id title description Img").populate("questions").lean();
    if (!quiz) {
      return res.status(404).json({ status: false, code: 404, message: "Quiz not found" });
    }

    const response = {
      _id: quiz._id,
      title: quiz.title?.[language] || "",
      description: quiz.description?.[language] || "",
      questions: quiz.questions?.map((q) => ({
        _id: q._id,
        question: q.question?.[language] || "",
        question_type: q.question_type,
        answers: q.answers?.map(ans => ({
          _id: ans._id,
          answer: ans.answer?.[language] || "",
          isCorrect: ans.isCorrect?.[language]
        })) || []
      })) || []
    };
    return res.status(200).json({ status: true, code: 200, message: "Quiz details fetched successfully", data: response });
  } catch (err) {
    return res.status(500).json({
      status: false,
      code: 500,
      message: err.message || 'Internal Server Error'
    });
  }
};





exports.searchQuiz = async (req, res) => {
  const { searchQuery } = req.query;
  try {
    let limit = parseInt(req.query.limit || config.limit);
    let offset = parseInt(req.query.offset || config.offset);

    const search = new RegExp(searchQuery, "i");
    const count = await Quiz.countDocuments({
      $or: [{ title: search }]
    });

    const data = await Quiz.find(
      { $or: [{ title: search }] },
      {},
      { limit, skip: offset, sort: { _id: -1 } }
    );

    data.forEach((d) => {
      d.Img = d.Img ? config.imageUrl + d.Img : "";
    });

    return res.send({
      status: true,
      message: messages.read.success,
      data,
      count
    });
  } catch (error) {
    res.status(404).json({ message: messages.read.error })
  }
};


//Created new
exports.update = async (req, res) => {
  try {
    const language = req.headers["language"] || req.body.language;
    const filter = {
      _id: new mongoose.Types.ObjectId(req.params.quizId),
      isDeleted: false
    };

    const updateQuery = {};
    if (req.body.title) {
      updateQuery["title." + language] = req.body.title
    }
    if (req.body.description) {
      updateQuery["description." + language] = req.body.description
    }

    const options = { new: true };

    await Quiz.findByIdAndUpdate(filter, updateQuery, options);
    return res.status(201).json({ status: true, code: 201, message: messages.update.success, })
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

//Created new
exports.delete = async (req, res) => {
  try {
    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.params.quizId)
    };
    const update = {
      isDeleted: true,
    };
    const options = { new: true };
    await Quiz.findByIdAndUpdate(filter, update, options);
    return res.status(201).json({ status: true, code: 201, message: messages.delete.success })
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

