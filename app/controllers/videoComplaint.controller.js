const VideoComplaints = require("../models/videoComplaint.model.js")
const messages = require("../utility/messages")
const config = require("config")
const userHelper = require("../utility/UserHelper")

exports.create = async (req, res) => {
  let user = await userHelper.detail(req.headers["access-token"])
  const user_id = user.data.user_id

  const videoComplaints = new VideoComplaints({
    video: req.body.video,
    issue: req.body.issue,
    user: user_id
  })

  videoComplaints
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
  VideoComplaints.count({}, function (err, countt) {
    count = countt
  })

  VideoComplaints.find(
    {},
    {},
    { limit: limit, skip: offset, sort: { _id: -1 } }
  )
    .populate("video")
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
  VideoComplaints.findById(req.params.videoComplaintsId)
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
    req.body.video === "" &&
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
  if (req.body.video) {
    updateQuery.video = req.body.video
  }
  if (req.body.issue) {
    updateQuery.issue = req.body.issue
  }
  if (req.body.status) {
    updateQuery.status = req.body.status
  }

  VideoComplaints.findByIdAndUpdate(req.params.videoComplaintsId, updateQuery, {
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
  VideoComplaints.findByIdAndRemove(req.params.videoComplaintsId)
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
