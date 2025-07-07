const AudioComplaints = require("../models/audioComplaint.model.js")
const messages = require("../utility/messages")
const config = require("config")
const userHelper = require("../utility/UserHelper")

exports.create = async (req, res) => {
  let user = await userHelper.detail(req.headers["access-token"])
  const user_id = user.data.user_id
  const audioComplaints = new AudioComplaints({
    audio: req.body.audio,
    issue: req.body.issue,
    user: user_id
  })

  audioComplaints
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

  let count = ""
  AudioComplaints.count({}, function (err, countt) {
    count = countt
  })

  AudioComplaints.find(
    {},
    {},
    { limit: limit, skip: offset, sort: { _id: -1 } }
  )
    .populate("audio")
    .populate("user", "first_name")
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
  AudioComplaints.findById(req.params.audioComplaintsId)
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

exports.update = async (req, res) => {
  let user = await userHelper.detail(req.headers["access-token"])
  const user_id = user.data.user_id
  if (
    req.body.audio === "" &&
    req.body.issue === "" &&
    req.body.status === ""
  ) {
    return res.status(400).send({
      message: messages.update.empty
    })
  }

  const updateQuery = {}
  if (user_id) {
    updateQuery.user = user_id
  }
  if (req.body.audio) {
    updateQuery.audio = req.body.audio
  }
  if (req.body.issue) {
    updateQuery.issue = req.body.issue
  }
  if (req.body.status) {
    updateQuery.status = req.body.status
  }

  AudioComplaints.findByIdAndUpdate(req.params.audioComplaintsId, updateQuery, {
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
  AudioComplaints.findByIdAndRemove(req.params.audioComplaintsId)
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
