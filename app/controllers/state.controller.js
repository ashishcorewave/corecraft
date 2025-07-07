const State = require("../models/state.model")
const messages = require("../utility/messages")
const config = require("config")
const upload = require("../utility/fileUpload")
const userHelper = require('../utility/UserHelper');
const mongoose = require('mongoose');


// Created New
exports.create = async (req, res) => {
  try {
    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);
    const { value, label } = req.body;
    const language = req.headers["language"] || req.body.language;

    const insertQuery = new State({
      label: { [language]: label },
      value,
      created_by: userDetail.data.user_id,
    });

    await insertQuery.save();
    return res.status(201).json({ status: true, code: 201, message: messages.create.success, })
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

// Created New
exports.getAll = async (req, res) => {
  try {
    const language = req.headers["language"] || req.query.language || "en";
    const filter = {
      isDeleted: false
    };
    const state = await State.find(filter).sort({ _id: -1 }).select('_id value label createdAt').lean();
    const finalData = state
      .filter(item => item.label && item.label[language]) // only if doctor has name in selected language
      .map(item => {
        return {
          _id: item._id,
          label: item.label[language],
          value: item.value
        };
      });

    return res.status(200).json({
      status: true,
      code: "200",
      message: "State filtered by language successfully",
      data: finalData
    });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

// Created New
exports.getById = async (req, res) => {
  try {
    const language = req.headers["language"] || req.query.language || "en";
    const filter = {
      isDeleted: false,
      _id: req.params.stateId
    };

    const stateQuery = await State.findOne(filter).lean("_id label value");
    const response = {
      _id: stateQuery._id,
      label: stateQuery.label[language] || "",
      value: stateQuery.value,
      createdAt: stateQuery.createdAt,
    };

    return res.status(200).json({
      status: true,
      code: "200",
      message: "Get Details of state successfully",
      data: response,
    });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

// Created New
exports.update = async (req, res) => {
  try {
    const language = req.headers["language"] || req.body.language;
    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.params.stateId),
    }
    const updateQuery = {};

    if (req.body.label) {
      updateQuery["label." + language] = req.body.label;
    }

    const updateState = await State.findByIdAndUpdate(filter, updateQuery, { new: true });
    if (updateState) {
      return res.send({ status: true, message: "state updated successfully", });
    } else {
      return res.status(404).send({ status: false, message: "state not found" });
    }
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

// Created New
exports.delete = async (req, res) => {
  try {
    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.params.stateId)
    };

    const update = {
      isDeleted: true
    };
    const options = { new: true };
    await State.findByIdAndUpdate(filter, update, options);
    return res.status(201).json({status:false, code:201, message:messages.delete.success });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

