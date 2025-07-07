const Point = require("../models/point.model.js")
const User = require("../models/user.model.js")
const UserPoint = require("../models/userPoint.model.js")
const messages = require("../utility/messages")
const config = require("config")

exports.create = (req, res) => {
  const points = new Point({
    points: req.body.points,
    activity_name: req.body.activity_name
  })

  points
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

exports.getAll = async (req, res) => {
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

  const count = await Point.countDocuments({})
  Point.find({}, {}, { limit: limit, skip: offset, sort: { _id: -1 } })
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
  Point.findById(req.params.pointId)
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

  const updateQuery = {}
  if (req.body.points) {
    updateQuery.points = req.body.points
  }
  if (req.body.activity_name) {
    updateQuery.activity_name = req.body.activity_name
  }

  Point.findByIdAndUpdate(req.params.pointId, updateQuery, { new: true })
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
  Point.findByIdAndDelete(req.params.pointId)
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

exports.getReferralPoints = async (req, res) => {
  let limit = parseInt(req.body.limit ? req.body.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.body.offset ? req.body.offset : config.offset)

  let queryParam = req.body.q
  let query = {}
  let searchQuery = {}
  if(queryParam){
    $or = [
      { first_name: { $regex: queryParam, $options: "$i" } },
      { last_name: { $regex: queryParam, $options: "$i" } },
      { email: { $regex: queryParam, $options: "$i" } },
    ]
    searchQuery = { ...searchQuery, $or }
  }
  let getUsers = await User.find(searchQuery, {_id: 1}).lean();
  console.log(getUsers,"GetUsers");
  if(getUsers){
    const userIds = getUsers.map(item => item._id)
    query["user_id"] = {$in: userIds}
  }

  let sort_by = req.body.sort_by ? req.body.sort_by : ""

  let sort_query = { _id: -1 }
  if(sort_by){
    sort_query = {}
    sort_query[sort_by.key] = sort_by.val
  }

  const count = await UserPoint.countDocuments(query)
  UserPoint.find(query, {point_id: 0, updatedAt: 0, __v: 0}, { limit: limit, skip: offset, sort: sort_query })
  .populate('user_id', 'first_name last_name email')
  .lean()
  .then((data) => {
    data.forEach((d) => {
      d.user_id = d.user_id !== undefined && d.user_id ? d.user_id : {}
      let userData = d.user_id
      delete d.user_id
      let first_name = userData.first_name || ""
      let last_name = userData.last_name || ""
      d.email = userData.email || ""
      d.user_name = first_name + " " + last_name
    })
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