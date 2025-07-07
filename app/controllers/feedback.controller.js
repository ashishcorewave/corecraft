const Feedback = require("../models/feedback.model.js")
const messages = require("../utility/messages")
const userHelper = require("../utility/UserHelper")
const User = require("../models/user.model.js")
const config = require("config")

exports.create = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])
  const feedback = new Feedback({
    user_id: userDetail.data.user_id,
    article_id: req.body.article_id,
    message: req.body.message,
    rating: req.body.rating,
  })

  feedback
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
  let search = req.query.q ? req.query.q : ""

  let query = {}
  if(search){
    query.message = {$regex: search, $options:"$i"}
  }
  let count = await Feedback.countDocuments(query)
  Feedback.find(query, {__v: 0}, { limit: limit, skip: offset, sort: { _id: -1 } })
  .populate("user_id", "first_name last_name profile_picture address")
  .populate("article_id", "title").lean()
  .then((data) => {
    data.forEach((d, key) => {
      d.user_id = d.user_id !== undefined && d.user_id ? d.user_id : {}
      d.article_id = d.article_id !== undefined && d.article_id ? d.article_id : {}
      let profile_picture = d.user_id.profile_picture || ""
      profile_picture = (profile_picture ? profile_picture : config.defaultImageUrl)
      profile_picture = profile_picture ? (profile_picture.startsWith("http") === false ? config.imageUrl + profile_picture : profile_picture) : ""
      if(d.user_id._id){
        d.user_id.profile_picture = profile_picture 
      }
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