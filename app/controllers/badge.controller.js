const Badge = require("../models/badge.model.js")
const UserBadge = require("../models/user.badge.model.js")
const messages = require("../utility/messages")
const userHelper = require("../utility/UserHelper")
const config = require("config")

exports.create = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])
  const badge = new Badge({
    name: req.body.name,
    description: req.body.description,
    badgeType: req.body.badgeType,
    points: req.body.points,
    created_by: userDetail.data.user_id
  })

  if (req.file) {
    badge.icon = req.file.filename;  // ✅ Extract filename correctly
  }

  badge.save().then((data) => {
    return res.send({
      status: true,
      message: messages.create.success,
      code: "201"
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

  let query = { isDeleted: false }
  if (search) {
    query.name = { $regex: search, $options: "$i" }
  }
  let count = await Badge.countDocuments(query)

  Badge.find(query, { __v: 0 }, { limit: limit, skip: offset, sort: { _id: -1 } })
    .populate("created_by")
    .then((data) => {
      data.forEach((d) => {
        d.icon = d.icon ? config.imageUrl + d.icon : ""
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

exports.leaderBoardTopThreeBadge = async (req, res) => {
  let search = req.query.q ? req.query.q : "";

  let query = { isDeleted: false };
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  try {
    let count = await Badge.countDocuments(query);
    let topThree = await Badge.find(query, { name: 1, points: 1, created_by: 1 })
      .populate("created_by", "first_name last_name profile_picture")
      .sort({ points: -1 })
      .limit(3);
    let remaining = await Badge.find(query, { name: 1, points: 1, created_by: 1 })
      .populate("created_by", "first_name last_name profile_picture")
      .sort({ points: -1 })
      .skip(3);

    let finalData = [...topThree, ...remaining];

    const formattedData = finalData.map((d) => ({
      name: d.name,
      points: d.points,
      created_by: {
        first_name: d.created_by?.first_name || "",
        last_name: d.created_by?.last_name || "",
        profile_picture: d.created_by?.profile_picture || "",
      },
    }));

    return res.send({
      status: true, code: "200",
      message: messages.read.success,
      data: formattedData,
      count: count,
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || messages.read.error,
    });
  }
};


exports.getById = (req, res) => {
  Badge.findById(req.params.badgeId)
    .then((data) => {
      if (data) {
        data.icon = data.icon ? config.imageUrl + data.icon : ""
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

  if (req.body.name === "" && req.file === undefined) {
    return res.status(400).send({
      message: messages.update.empty
    })
  }

  const updateQuery = {}

  if (req.body.name) {
    updateQuery.name = req.body.name
  }

  if (req.body.description) {
    updateQuery.description = req.body.description
  }

  if (req.body.badgeType) {
    updateQuery.badgeType = req.body.badgeType
  }

  if (req.body.points) {
    updateQuery.points = req.body.points
  }
  console.log(req.files.icon, "Req.files")
  if (req.files.icon) {
    updateQuery.icon = req.files.filename
  }

  Badge.findByIdAndUpdate(req.params.badgeId, updateQuery, { new: true })
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
  Badge.findByIdAndUpdate(req.params.badgeId, { isDeleted: true }, { new: true })
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

exports.assignBadge = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])

  let checkBadge = await UserBadge.findOne({ user_id: req.body.user_id, badge_id: req.body.badge_id });
  console.log(checkBadge, "checkBadge")
  if (checkBadge) {
    return res.send({
      status: false,
      message: messages.badge.exists,
      data: []
    })

  } else {
    const badge = new UserBadge({
      user_id: req.body.user_id,
      badge_id: req.body.badge_id,
      auto: false
    })

    badge
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
}

exports.getAssignedBadges = async (req, res) => {
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

  let query = {}

  let count = await UserBadge.countDocuments(query)
  console.log(count, "Count");
  UserBadge.find(query, { __v: 0 }, { limit: limit, skip: offset, sort: { _id: -1 } })
    .populate("user_id", "first_name last_name")
    .populate("badge_id", "name icon").lean()
    .then((data) => {
      data.forEach((d) => {
        let icon = (d && d.badge_id && d.badge_id.icon ? d.badge_id.icon : config.defaultImageUrl)
        icon = icon ? (icon.startsWith("http") === false ? config.imageUrl + icon : icon) : ""
        d.badge_id.icon = icon
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

exports.removeBadge = (req, res) => {
  UserBadge.findByIdAndRemove(req.params.assignBadgeId)
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