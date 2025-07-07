const Static = require("../models/static.model")
const messages = require("../utility/messages")
const config = require("config")


exports.getById = async (req, res) => {
  // await Static.deleteMany({});
  // await Static.create({title: {en: ""}, content: {en: ""}, type: "about"});
  // await Static.create({title: {en: ""}, content: {en: ""}, type: "privacy"});
  // await Static.create({title: {en: ""}, content: {en: ""}, type: "terms"});
  // await Static.create({title: {en: ""}, content: {en: ""}, type: "disclaimer"});
  let language = req.headers["language"] ? req.headers["language"] : (req.query.language ? req.query.language : "en")
  let selectField = {"title.en": 1, "content.en": 1}
  if(language !== "en"){
    selectField["title."+language] = 1
    selectField["content."+language] = 1
  }
  let type = req.query.type ? req.query.type : "privacy"
  let query = {type: type}
  Static.findOne(query, selectField).lean()
  .then((data) => {
    if (data) {
      data.title = data.title[language] ? data.title[language] : ""
      data.content = data.content[language] ? data.content[language] : ""
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

exports.update = async (req, res) => {

  let language = req.headers["language"] ? req.headers["language"] : (req.body.language ? req.body.language : "en")

  let type = req.body.type ? req.body.type : "privacy"
  let query = {type: type}

  const updateQuery = {}

  if(req.body.title) {
    updateQuery["title."+language] = req.body.title
  }

  if(req.body.content) {
    updateQuery["content."+language] = req.body.content
  }
  
  Static.findOneAndUpdate(query, updateQuery, { new: true })
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

exports.getPrivacy = async (req, res) => {
  let language = req.headers["language"] ? req.headers["language"] : (req.query.language ? req.query.language : "en")
  let selectField = {"title.en": 1, "content.en": 1}
  if(language !== "en"){
    selectField["title."+language] = 1
    selectField["content."+language] = 1
  }
  let type = "privacy"
  let query = {type: type}
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
  let selectField = {"title.en": 1, "content.en": 1}
  if(language !== "en"){
    selectField["title."+language] = 1
    selectField["content."+language] = 1
  }
  let type = "terms"
  let query = {type: type}
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
  let selectField = {"title.en": 1, "content.en": 1}
  if(language !== "en"){
    selectField["title."+language] = 1
    selectField["content."+language] = 1
  }
  let type = "disclaimer"
  let query = {type: type}
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
  let selectField = {"title.en": 1, "content.en": 1}
  if(language !== "en"){
    selectField["title."+language] = 1
    selectField["content."+language] = 1
  }
  let type = "about"
  let query = {type: type}
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