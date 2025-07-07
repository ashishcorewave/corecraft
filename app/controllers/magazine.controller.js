const Magazine = require("../models/magazine.model.js")
const messages = require("../utility/messages")
const userHelper = require("../utility/UserHelper")
const config = require("config")

exports.create = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])
  const magazine = new Magazine({
    title: req.body.title,
    articles: req.body.articles,
    created_by: userDetail.data.user_id
  })

  magazine
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
    query.title = {$regex: search, $options:"$i"}
  }
  let count = await Magazine.countDocuments(query)
  Magazine.find(query, {}, { limit: limit, skip: offset, sort: { _id: -1 } })
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

exports.searchMagazine = async (req, res) => {
  const { searchQuery } = req.query;
  try {
    let limit = parseInt(req.query.limit || config.limit);
    limit = limit > config.limit ? config.limit : limit;
    let offset = parseInt(req.query.offset || config.offset);

    const search = new RegExp(searchQuery, "i");

    const magazines = await Magazine.find(
      { $or: [{ title: search }] }
    )
      .limit(limit)
      .skip(offset)
      .sort({ _id: -1 });

    const count = await Magazine.countDocuments({ $or: [{ title: search }] });

    res.json({
      status: true,
      data: magazines,
      count: count,
      message: messages.read.success
    });
  } catch (error) {
    console.error('Search Magazine Error:', error);
    res.status(500).json({ message: messages.read.error });
  }
};


exports.getById = (req, res) => {
  Magazine.findById(req.params.magazineId)
    .populate("articles")
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
  if (req.body.title === "" && req.body.articles === undefined) {
    return res.status(400).send({
      message: messages.update.empty
    })
  }

  const updateQuery = {}
  if (req.body.title) {
    updateQuery.title = req.body.title
  }
  if (req.body.articles) {
    updateQuery.articles = req.body.articles
  }

  Magazine.findByIdAndUpdate(req.params.magazineId, updateQuery, { new: true })
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
  Magazine.findByIdAndDelete(req.params.magazineId)
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

exports.readMagazine = async (req, res) => {
  const MagazineRead = require("../models/magazine.read.model.js")
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])
  
  let postId = req.body.magazine_id
  let getPost = await Magazine.findOne({ _id: postId }, {_id: 1});
  if (getPost) {
    const read = new MagazineRead({
      user_id: userDetail.data.user_id,
      magazine_id: postId
    })

    read
    .save()
    .then(async (data) => {
      await Magazine.updateOne({ _id: postId }, { $inc: { readCount: +1 } })
      await userHelper.assignPoint(userDetail.data.user_id, "Read Magazine")
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
  } else {
    return res.send({
      status: false,
      message: messages.create.error
    })
  }
}