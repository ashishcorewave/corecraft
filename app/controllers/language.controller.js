const Language = require("../models/language.model.js")
const messages = require("../utility/messages")
const userHelper = require("../utility/UserHelper")
const Terms = require('../../templates/terms')

exports.getAll = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    const offset = +req.query.offset || 0; 
    const perPage = +req.query.perPage || 10;
    const q = req.query.q || "";

    // Get all languages
    const allLanguages = await Language.find(filter).select("_id title shortCode addedDate").lean();

    // Filter based on search
    const filteredLanguages = allLanguages.filter((lang) => {
      const title = lang.title?.toLowerCase() || "";
      const shortCode = lang.shortCode?.toLowerCase() || "";
      return (
        title.includes(q.toLowerCase()) || shortCode.includes(q.toLowerCase())
      );
    });

    const count = filteredLanguages.length;

    // Apply pagination
    const data = filteredLanguages.slice(offset, offset + perPage);

    // Return flat structure
    return res.status(200).json({ status: true, code: "200",  message: "Languages fetched successfully",  data, count});
  } catch (err) {
    return res.status(500).json({ status: false, code: "500", message: err.message || "Internal Server Error"});
  }
};



exports.getTerms = async (req, res) => {
  return res.send({
    status: true,
    message: messages.read.success,
    data: Terms
  })
}

//New Api Language Master

exports.insertLanguage = async (req, res) => {
  try {
    // 1. Get the user details from the token
    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);
    const { title, shortCode } = req.body;
    const insertQuery = new Language({
      title,
      shortCode,
      created_by: userDetail.data.user_id,
    });
    await insertQuery.save();
    return res.status(201).json({ code: "201", status: true, message: 'Language insert successfully' });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message || 'Internal Server Error' });
  }
}


exports.getAllLanguage = async (req, res) => {
  try {
    const filter = {
      isDeleted: false
    };

    const getQuery = await Language.find(filter).select("_id title");
    return res.status(200).json({ code: "200", status: true, message: 'Get All Language Successfully', data: getQuery });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message || 'Internal Server Error' });
  }
}



exports.editLanguage = async (req, res) => {
  try {

    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);

    const filter = {
      isDeleted: false,
      _id: req.body.languageId
    };

    const update = {
      title: req.body.title,
      shortCode: req.body.shortCode,
      created_by: userDetail.data.user_id,
    };

    const options = { new: true };
    await Language.findByIdAndUpdate(filter, update, options);
    return res.status(201).json({ code: "201", status: true, message: 'Edit language successfully' });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message || 'Internal Server Error' });
  }
}

exports.inActiveLanguage = async (req, res) => {
  try {

    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);

    const filter = {
      isDeleted: false,
      _id: req.body.languageId
    };

    const update = {
      isDeleted: true,
      created_by: userDetail.data.user_id,
    };

    const options = { new: true };
    await Language.findByIdAndUpdate(filter, update, options);
    return res.status(201).json({ code: "201", status: true, message: 'InActive language successfully' });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message || 'Internal Server Error' });
  }
}


exports.detailsLanguage = async (req, res) => {
  try {
    const filter = {
      isDeleted: false,
      _id: req.query.languageId
    };
    const detailsLanguageQuery = await Language.findOne(filter).select("_id title shortCode").lean();
    return res.status(200).json({ code: "200", status: true, message: 'Get Details language successfully', data: detailsLanguageQuery });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message || 'Internal Server Error' });
  }
}