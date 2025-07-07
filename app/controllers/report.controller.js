const Report = require("../models/report.model.js")
const messages = require("../utility/messages")
const userHelper = require("../utility/UserHelper")
const User = require("../models/user.model.js")
const config = require("config")
const mongoose = require('mongoose');
exports.create = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])
  const report = new Report({
    reportText: req.body.reportText,
    reportType: req.body.reportType,
    reportId: req.body.reportId,
    message: req.body.message || "",
    created_by: userDetail.data.user_id
  })

  report
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
  if (search) {
    query.reportText = { $regex: search, $options: "$i" }
  }
  let count = await Report.countDocuments(query)
  Report.find(query, {}, { limit: limit, skip: offset, sort: { _id: -1 } })
    .populate("created_by", "first_name last_name profile_picture address").lean()
    .then((data) => {
      data.forEach((d, key) => {
        d.Img = d.Img ? config.imageUrl + d.Img : config.defaultImageUrl
        d.created_by = d.created_by !== undefined && d.created_by ? d.created_by : {}
        d.category = d.category !== undefined && d.category ? d.category : {}
        let profile_picture = d.created_by.profile_picture || ""
        profile_picture = (profile_picture ? profile_picture : config.defaultImageUrl)
        profile_picture = profile_picture ? (profile_picture.startsWith("http") === false ? config.imageUrl + profile_picture : profile_picture) : ""
        if (d.created_by._id) {
          d.created_by.profile_picture = profile_picture
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

exports.editReport = async (req, res) => {
  try {
    let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])
    const filter = {
      _id: new mongoose.Types.ObjectId(req.body.reportId),
    }

    const update = {
      reportText: req.body.reportText,
      reportType: req.body.reportType,
      message: req.body.message || "",
      created_by: userDetail.data.user_id
    };
    const options = { new: true };
    await Report.findByIdAndUpdate(filter, update, options);
    return res.send({status: true,message: messages.create.success})
  } catch (err) {
    return res.status(500).send({
      message: err.message || messages.read.error
    })
  }
}



exports.getReportById = async (req, res) => {
  try {
    const userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"]);
    const reportId = req.params.reportId;
    const getReportByIdQuery = await Report.findById(reportId);
    return res.send({
      status: true,
      data: getReportByIdQuery,
      message: messages.read.success 
    });

  } catch (err) {
    return res.status(500).send({
      status: false,
      message: err.message || messages.read.error
    });
  }
};
