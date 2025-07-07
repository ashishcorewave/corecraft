const userStory = require("../models/userStory.model.js")
const messages = require("../utility/messages")
const config = require("config")
const isUrl = require("is-url")

exports.create = (req, res) => {
  const userStories = new userStory({
    document: req.body.document,
    story: req.body.story
  })

  if (req.files) {
    let path = ""
    req.files.forEach(function (files, index, arr) {
      path = path + files.path + ","
    })
    path = path.substring(0, path.lastIndexOf(","))
    userStories.photos = path
  }

  if (isUrl(req.body.document_link)) {
    userStories.document_link = req.body.document_link
  } else {
    return res.status(400).send({
      message: "Please enter a valid url"
    })
  }

  userStories
    .save()
    .then((data) => {
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
}

exports.getAll = (req, res) => {
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
  userStory
    .find({}, {}, { limit: limit, skip: offset, sort: { _id: -1 } })
    .then((data) => {
      return res.send({
        status: true,
        message: messages.read.success,
        data: data
      })
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || messages.read.error
      })
    })
}

exports.getById = (req, res) => {
  userStory
    .findById(req.params.userStoryId)
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
    req.body.document_link === "" &&
    req.body.story === "" &&
    req.files.length === 0
  ) {
    return res.status(400).send({
      message: messages.update.empty
    })
  }

  const files = []
  if (req.files) {
    let path = ""
    req.files.forEach(function (files, index, arr) {
      path = path + files.path + ","
    })
    path = path.substring(0, path.lastIndexOf(","))
    path = path.split(",")
    files.push(path)
  }

  const updateQuery = {}
  if (req.body.document) {
    updateQuery.document = req.body.document
  }
  if (req.body.story) {
    updateQuery.story = req.body.story
  }
  if (req.files.length) {
    updateQuery.photos = files
  }
  if (req.body.document_link && isUrl(req.body.document_link)) {
    updateQuery.document_link = req.body.document_link
  } else {
    return res.status(400).send({
      message: "Please enter a valid url"
    })
  }

  userStory
    .findByIdAndUpdate(req.params.userStoryId, updateQuery, { new: true })
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
  userStory
    .findByIdAndRemove(req.params.userStoryId)
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
