const Static = require("../models/static.model")
const messages = require("../utility/messages")

exports.createPrivacy = async (req, res) => {
  try {
    const language = req.headers["language"] || req.body.language;
    const { title, content } = req.body;

    const insertQuery = new Static({
      title: { [language]: title },
      content: { [language]: content },
      type: "privacy"
    });
    await insertQuery.save();
    return res.status(201).json({ code: "201", status: true, message: 'Privacy created successfully' });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

exports.getById = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";
    const type = req.query.type || "privacy";


    const selectField = {
      [`title.${language}`]: 1,
      [`content.${language}`]: 1
    };

    const query = { type };

    const data = await Static.findOne(query, selectField).lean();

    const responseData = {
      _id: data._id,
      title: data.title?.[language] || "",
      content: data.content?.[language] || ""
    };
    return res.status(200).json({ status: true, code: 200, message: "Content fetched successfully", data: responseData });

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || "Internal Server Error" });
  }
};


exports.update = async (req, res) => {
  try {
    const language = req.headers["language"] || req.body.language;
    const type = req.body.type || "privacy";

    const query = { type };
    const updateQuery = {};

    if (req.body.title) {
      updateQuery[`title.${language}`] = req.body.title;
    }

    if (req.body.content) {
      updateQuery[`content.${language}`] = req.body.content;
    }

    await Static.findOneAndUpdate(query, { $set: updateQuery }, { new: true });
    return res.status(200).json({
      status: true,
      code: 200,
      message: "Updated successfully",
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      code: 500,
      message: err.message || "Internal Server Error"
    });
  }
};

exports.createAbout = async (req, res) => {
  try {
    const language = req.headers["language"] || req.body.language;
    const { title, content } = req.body;

    const insertQuery = new Static({
      title: { [language]: title },
      content: { [language]: content },
      type: "about"
    });
    await insertQuery.save();
    return res.status(201).json({ code: "201", status: true, message: 'About created successfully' });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

exports.createTerms = async (req, res) => {
  try {
    const language = req.headers["language"] || req.body.language;
    const { title, content } = req.body;

    const insertQuery = new Static({
      title: { [language]: title },
      content: { [language]: content },
      type: "terms"
    });
    await insertQuery.save();
    return res.status(201).json({ code: "201", status: true, message: 'Terms created successfully' });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

exports.createDisclaimer = async (req, res) => {
  try {
    const language = req.headers["language"] || req.body.language;
    const { title, content } = req.body;

    const insertQuery = new Static({
      title: { [language]: title },
      content: { [language]: content },
      type: "disclaimer"
    });
    await insertQuery.save();
    return res.status(201).json({ code: "201", status: true, message: 'Disclaimer created successfully' });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}






exports.getPrivacy = async (req, res) => {
  let language = req.headers["language"] ? req.headers["language"] : (req.query.language ? req.query.language : "en")
  let selectField = { "title.en": 1, "content.en": 1 }
  if (language !== "en") {
    selectField["title." + language] = 1
    selectField["content." + language] = 1
  }
  let type = "privacy"
  let query = { type: type }
  Static.findOne(query, selectField).lean()
    .then((data) => {
      if (data) {
        data.title = data.title[language] ? data.title[language] : data.title.en
        data.content = data.content[language] ? data.content[language] : data.content.en
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
      return res.status(500).send({
        message: messages.read.error
      })
    })
}

exports.getTerms = async (req, res) => {
  let language = req.headers["language"] ? req.headers["language"] : (req.query.language ? req.query.language : "en")
  let selectField = { "title.en": 1, "content.en": 1 }
  if (language !== "en") {
    selectField["title." + language] = 1
    selectField["content." + language] = 1
  }
  let type = "terms"
  let query = { type: type }
  Static.findOne(query, selectField).lean()
    .then((data) => {
      if (data) {
        data.title = data.title[language] ? data.title[language] : data.title.en
        data.content = data.content[language] ? data.content[language] : data.content.en
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
      return res.status(500).send({
        message: messages.read.error
      })
    })
}

exports.getDisclaimer = async (req, res) => {
  let language = req.headers["language"] ? req.headers["language"] : (req.query.language ? req.query.language : "en")
  let selectField = { "title.en": 1, "content.en": 1 }
  if (language !== "en") {
    selectField["title." + language] = 1
    selectField["content." + language] = 1
  }
  let type = "disclaimer"
  let query = { type: type }
  Static.findOne(query, selectField).lean()
    .then((data) => {
      if (data) {
        data.title = data.title[language] ? data.title[language] : data.title.en
        data.content = data.content[language] ? data.content[language] : data.content.en
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
      return res.status(500).send({
        message: messages.read.error
      })
    })
}

exports.getAbout = async (req, res) => {
  let language = req.headers["language"] ? req.headers["language"] : (req.query.language ? req.query.language : "en")
  let selectField = { "title.en": 1, "content.en": 1 }
  if (language !== "en") {
    selectField["title." + language] = 1
    selectField["content." + language] = 1
  }
  let type = "about"
  let query = { type: type }
  Static.findOne(query, selectField).lean()
    .then((data) => {
      if (data) {
        data.title = data.title[language] ? data.title[language] : data.title.en
        data.content = data.content[language] ? data.content[language] : data.content.en
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
      return res.status(500).send({
        message: messages.read.error
      })
    })
}