const ContactCategory = require("../models/contactCategory.model.js")
const messages = require("../utility/messages")
const config = require("config")
const upload = require("../utility/fileUpload")
const mongoose = require('mongoose');
const userHelper = require('../utility/UserHelper.js')

//created new
exports.create = async (req, res) => {
  try {
    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);
    const { name } = req.body;
    const language = req.headers["language"] || req.body.language;
    const insertQuery = new ContactCategory({
      name: { [language]: name },
      created_by: userDetail.data.user_id,
    });
    if (req.files && req.files.icon) {
      const iconFile = req.files.icon;
      const imageData = await upload.uploadImage(iconFile);
      if (imageData.status === true) {
        insertQuery.icon = imageData.name;
      } else {
        return res.status(400).json({ status: false, message: imageData.message });
      }
    } else {
      return res.status(400).json({ status: false, message: 'A icon file is required.' });
    }
    await insertQuery.save();
    return res.status(201).json({ code: "201", status: true, message: 'Contact Category created successfully' });

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' })
  }
}


//created new
exports.getAll = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    const language = req.query.language || req.headers["language"] || "en";

    const query = await ContactCategory.find(filter).sort({ _id: -1 }).select('_id name icon createdAt').lean();
    const finalData = query
      .filter(item => item.name && item.name[language]) // only include if name in selected language exists
      .map((item) => ({
        _id: item._id,
        name: item.name[language],
        createdAt: item.createdAt,
        shortCode:language,
        icon: item.icon ? `${process.env.IMAGE_BASE_URL}/uploads/${item.icon}` : null
      }));
    return res.status(200).json({ status: true, code: "200", message: "contact Category filtered by language successfully", data: finalData });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

//created new
exports.getById = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";

    const filter = {
      _id: new mongoose.Types.ObjectId(req.params.contactCategoryId),
      isDeleted: false,
    };

    const contactCategory = await ContactCategory.findOne(filter).select("_id name icon createdAt").lean();

    if (!contactCategory) {
      return res.status(404).json({ status: false, code: "404", message: "Contact category not found" });
    }

    const response = {
      _id: contactCategory._id,
      name: contactCategory.name?.[language] || "",
      createdAt: contactCategory.createdAt,
      icon: contactCategory.icon ? `${process.env.IMAGE_BASE_URL}/uploads/${contactCategory.icon}` : null
    };
    return res.status(200).json({ status: true, code: "200", message: "Get Details of contact category successfully", data: response });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
};


//created new
exports.update = async (req, res) => {
  try {
    const language = req.headers["language"] || req.body.language;
    console.log("Language:", language);

    const updateQuery = {};

    if (req.body.name) {
      updateQuery["name." + language] = req.body.name;
    }

    if (req.files && req.files.icon) {
      const imageData = await upload.uploadImage(req.files.icon);
      if (imageData.status === true) {
        updateQuery.icon = imageData.name;
      } else {
        return res.send({ status: false, message: imageData.message });
      }
    }

    const updatedQuery = await ContactCategory.findByIdAndUpdate(req.params.contactCategoryId, updateQuery, { new: true });
    if (updatedQuery) {
      return res.send({ status: true, message: "contact category updated successfully" });
    } else {
      return res.status(404).send({ status: false, message: "contact category not found" });
    }
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' })
  }
}

//created new

exports.delete = async (req, res) => {
  try {
    const filter = {
      isDeleted: false,
      _id: req.params.contactCategoryId
    };
    const update = {
      isDeleted: true,
    };
    const options = { new: true };
    await ContactCategory.findByIdAndUpdate(filter, update, options);
    return res.status(201).json({ status: true, code: 201, message: messages.delete.success })
  } catch (err) {
    return res.status(500).josn({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

