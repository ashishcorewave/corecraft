const Rsvp = require("../models/rsvp.model.js")
const messages = require("../utility/messages")
const config = require("config")
const Event = require("../../app/models/event.model.js")
const userHelper = require("../utility/UserHelper")

exports.create = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"]) 
  const rsvp = new Rsvp({
    user: userDetail.data.user_id,
    event: req.body.event_id,
    rsvp_date: Date.now()
  })

  const getEvent = await Event.findOne({ _id: req.body.event_id }, { event_type: true, last_date_to_enroll: true, end_date: true })
  if(getEvent){
    rsvp.event_type = getEvent.event_type
    const date_now = new Date()
    const last_date = getEvent.last_date_to_enroll ? getEvent.last_date_to_enroll : getEvent.end_date
    if (date_now <= last_date) {
      let checkRsvp = await Rsvp.find({user: userDetail.data.user_id, event: req.body.event_id}).lean();
      if(!checkRsvp){
        await Event.updateOne({ _id: req.body.event_id }, { $inc: { attendeeCount: +1 } });
        let activity_id = getEvent._id;
        let activity_name = "";
        if(getEvent.event_type === "Online"){
          activity_name = "Attended online events";
        }else{
          activity_name = "Attended offline events";
        }
        await userHelper.assignPoint(userDetail.data.user_id, activity_name, activity_id)
      }
      rsvp
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
          status: false,
          message: err.message
        })
      })
    } else {
      res.send({ status: false, message: "Can't rsvp after the last date" })
    }
  }
}

exports.getAll = async (req, res) => {
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
  let search = req.query.q ? req.query.q : ""
  let eventType = req.query.eventType ? req.query.eventType : ""
  let query = {}
  // if(search){
  //   query.title = {$regex: search, $options:"$i"}
  // }
  if(eventType) {
    query.event_type = eventType
  }
  const count = await Rsvp.countDocuments(query)
  Rsvp.find(query, {__v: 0}, { limit: limit, skip: offset, sort: { _id: -1 } })
  .populate("user", "first_name last_name profile_picture")
  .populate("event", "title description event_type start_date last_date_to_enroll").lean()
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

exports.searchRsvp = async (req, res) => {
  const { searchQuery } = req.query
  try {
    let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
    limit = limit > config.limit ? config.limit : limit
    let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

    const search = new RegExp(searchQuery, "i")
    const rsvp = await Rsvp.find(
    {
      $or: [{ "event.title": search }]
    },
    {},
    { limit: limit, skip: offset, sort: { _id: -1 } }
    )

    const count = await Rsvp.find(
    {
      $or: [{ "event.title": search }]
    },
    {},
    {}
    ).countDocuments({}, function (err, count) {
      return count
    })

    res.json({
      status: true,
      data: rsvp,
      count: count,
      message: messages.read.success
    })
  } catch (error) {
    res.status(404).json({ message: messages.read.error })
  }
}

exports.getById = (req, res) => {
  Rsvp.findById(req.params.rsvpId)
  .populate("user", "first_name")
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

exports.delete = (req, res) => {
  Rsvp.findByIdAndDelete(req.params.rsvpId)
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

exports.unRsvp = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"]);
  let checkRsvp = await Rsvp.findOne({user: userDetail.data.user_id, event: req.body.event_id, isDeleted: false}).lean();
  if(checkRsvp){
    if(checkRsvp.isDeleted === true){
      return res.send({
        status: false,
        message: messages.update.error,
        data: []
      })
    }else{
      Rsvp.findByIdAndUpdate(checkRsvp._id, {isDeleted: true}, { new: true })
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
      })
    }
  } else {
    return res.status(404).send({
      message: messages.update.error
    })
  }
}
