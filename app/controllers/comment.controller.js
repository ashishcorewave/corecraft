const Comment = require("../models/comment.model.js")
const messages = require("../utility/messages")
const userHelper = require("../utility/UserHelper")
const config = require("config")
const moment = require("moment")
const UserPost = require("../models/userPost.models.js")

exports.create = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"])
  if (userDetail.status === 0) {
    return res.send(userDetail)
  }
  let postId = req.body.post_id
  let commentId = req.body.comment_id
  let getPost = await UserPost.findOne({ _id: postId })
  if (getPost) {
    const comments = new Comment({
      body: req.body.body,
      post_id: postId,
      created_by: userDetail.data.user_id
    })
    if (commentId) {
      comments.parent_id = commentId
    }
    
    comments
    .save()
    .then(async (data) => {
      await UserPost.updateOne({ _id: postId }, { $inc: { commentCount: +1 } })
      if(commentId){
        await Comment.updateOne({ _id: commentId }, { $inc: { replyCount: +1 } })
      }
      await userHelper.assignPoint(userDetail.data.user_id, "Comment On Feed")
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

exports.getAll = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"])
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
  let search = req.query.q ? req.query.q : ""

  let query = {}
  if(userDetail.status === 1 && userDetail.data.isAdmin === false) {
    query.isDeleted = false
  }
  if(req.query.post_id){
    query.post_id = req.query.post_id
  }
  if (req.query.comment_id) {
    query.parent_id = req.query.comment_id
  }
  if(search){
    query.body = {$regex: search, $options:"$i"}
  }

  const count = await Comment.count(query)
  Comment.find(query, { __v: 0 }, { limit: limit, skip: offset, sort: { _id: -1 } })
  .populate("created_by", "first_name last_name profile_picture address gender")
  .populate("post_id", "post")
  .lean()
  .then(async (data) => {
    for (i = 0; i < data.length; i++) {
        let post = data[i].post_id || {};
        data[i].post_id = post._id || ""
        data[i].post = post.post || ""
        data[i].replyCount = data[i].replyCount || 0
        // data[i]._doc.edit = data[i]._doc.created_by && data[i]._doc.created_by._id == userDetail.data.user_id ? true : false
        data[i].edit = data[i].created_by && data[i].created_by._id == userDetail.data.user_id ? true : false
        let profile_picture = data[i].created_by ? data[i].created_by.profile_picture : ""
        // profile_picture = (profile_picture ? profile_picture : config.defaultImageUrl)
        profile_picture = (profile_picture ? profile_picture : "")
        profile_picture = profile_picture ? (profile_picture.startsWith("http") === false ? config.imageUrl + profile_picture : profile_picture) : ""
        if(data[i].created_by && data[i].created_by._id){
          data[i].created_by.profile_picture = profile_picture 
        }
      }
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

exports.searchComment = async (req, res) => {
  const query = {}
  if (req.params.id) {
    query.post_id = req.params.id
  }
  const { searchQuery } = req.query

  try {
    let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
    limit = limit > config.limit ? config.limit : limit
    let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

    const search = new RegExp(searchQuery, "i")
    const comments = await Comment.find(
      { $and: [{ $or: [{ body: search }] }, { $or: [query] }] },
      {},
      { limit: limit, skip: offset, sort: { _id: -1 } }
      ).populate("created_by", "first_name last_name profile_picture address gender")

    const count = await Comment.find(
      { $and: [{ $or: [{ body: search }] }, { $or: [query] }] },
      {},
      {}
      ).count({}, function (err, count) {
        return count
      })

      res.json({
        status: true,
        data: comments,
        count: count,
        message: messages.read.success
      })
    } catch (error) {
      res.status(404).json({ message: messages.read.error })
    }
  }

  exports.getById = (req, res) => {
    Comment.findById(req.params.commentId)
    .populate("created_by")
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
    if (req.body.body === "") {
      return res.status(400).send({
        message: messages.update.empty
      })
    }
    let userDetail = await userHelper.detail(req.headers["access-token"])

    const updateQuery = {}
    if (req.body.body) {
      updateQuery.body = req.body.body
    }
    if (req.body.post_id) {
      updateQuery.post_id = req.body.post_id
    }
  
  if(userDetail.status === 1 && userDetail.data.isAdmin === true) {
    if (req.body.isActive) {
      updateQuery.isDeleted = false
    }
  }

    Comment.findByIdAndUpdate(req.params.commentId, updateQuery, { new: true })
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

  exports.delete = async (req, res) => {
    let userDetail = await userHelper.detail(req.headers["access-token"]);
    const getComment = await Comment.findOne({ _id: req.params.commentId }).lean()
    if (getComment) {
      if(userDetail.status === 1 && (userDetail.data.isAdmin === true || userDetail.data.user_id == getComment.created_by)){
        Comment.findByIdAndUpdate(
          req.params.commentId,
          { isDeleted: true },
          { new: true }
          )
        .then(async (data) => {
          await UserPost.updateOne(
            { _id: getComment.post_id },
            { $inc: { commentCount: -1 } }
            )
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
          return res.status(500).send({
            message: messages.update.error
          })
        })

      } 
    } else {
      return res  .status(500).send({
        message: messages.delete.error
      })
    }
  }

  exports.getCommentsbyPostId = async (req, res) => {
    const query = { isDeleted: false }

    if (req.params.id) {
      query.post_id = req.params.id
    }
    const body = req.query
    if (req.body.comment_id) {
      query.parent_id = req.body.comment_id
    }else{
      query.parent_id = { $exists: false }
    }

    let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
    limit = limit > config.limit ? config.limit : limit
    let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

    let count = await Comment.count(query)

    Comment.find(query, { isDeleted: 0, __v: 0 }, { limit: limit, skip: offset, sort: { _id: -1 } })
    .populate("created_by", "first_name last_name profile_picture gender")
    .then(async (data) => {
      let userDetail = await userHelper.detail(req.headers["access-token"])
      for (i = 0; i < data.length; i++) {
        data[i]._doc.replyCount = data[i]._doc.replyCount || 0
        data[i]._doc.edit = data[i]._doc.created_by && data[i]._doc.created_by._id == userDetail.data.user_id ? true : false
        let profile_picture = data[i].created_by.profile_picture || ""
        profile_picture = (profile_picture ? profile_picture : config.defaultImageUrl)
        profile_picture = profile_picture ? (profile_picture.startsWith("http") === false ? config.imageUrl + profile_picture : profile_picture) : ""
        if(data[i].created_by._id){
          data[i].created_by.profile_picture = profile_picture 
        }
      }
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

  exports.downloadComment = async (req, res) => {
    let userDetail = await userHelper.detail(req.headers["access-token"])
    if (userDetail.status === 1 && userDetail.data.isAdmin === true) {
      const excel = require("exceljs");

      let workbook = new excel.Workbook();
      let worksheet = workbook.addWorksheet("Feeds");

      worksheet.columns = [
        { header: "Post", key: "post", width: 20 },
        { header: "Comment", key: "body" },
        { header: "Commented By", key: "commented_by" },
        { header: "Posted Date", key: "createdAt" }
      ];

      let query = {}

      let data = await Comment.find(query, { body: 1, createdAt: 1 })
        .populate("created_by", "first_name")
        .populate("post_id", "post")
        .lean()
      let feedCommments = []
      for (i = 0; i < data.length; i++) {
        feedCommments.push({
          'post': (data[i].post_id.post ? data[i].post_id.post : ""),
          'body': data[i].body,
          'commented_by': (data[i].created_by && data[i].created_by.first_name ? data[i].created_by.first_name : ""),
          'createdAt': moment(data[i].createdAt).format('DD.MM.YYYY')
        })
      }
      worksheet.addRows(feedCommments);
      try {
        await workbook.xlsx.writeFile(`./uploads/temp/feed-comment.xlsx`)
          .then(() => {
            res.send({
              status: true,
              message: messages.read.success,
              path: `${config.imageUrl}/temp/feed-comment.xlsx`,
            });
          });
      } catch (err) {
        console.log(err)
        res.send({
          status: false,
          message: messages.read.error,
        });
      }
    }
  }