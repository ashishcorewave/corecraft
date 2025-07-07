const userPost = require("../models/userPost.models.js")
const userLike = require("../models/userLike.model.js")
const messages = require("../utility/messages")
const userHelper = require("../utility/UserHelper");
const commonFunction = require('../middleware/commonFunction.js');
const config = require("config")
const moment = require("moment")

exports.create = async (req, res) => {
  try {
    let userDetail = await userHelper.detail(req.headers["access-token"]);
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      return res.status(400).json({ status: false, message: "Multiple Banner Images Required" });
    }
    const uploadMultipleFile = await commonFunction.uploadMultipleFile(req.files.images, "ics_user_posts");

    if (uploadMultipleFile?.code === 422) {
      return res.status(422).json(uploadMultipleFile);
    }
    req.body.images = uploadMultipleFile.files;

    const post = new userPost({
      post: req.body.post,
      user: userDetail.data.user_id,
      images: req.body.images
    });
    await post.save();
    await userHelper.assignPoint(userDetail.data.user_id, "Feed Posted");

    return res.status(201).json({
      status: true,
      code: "201",
      message: messages.create.success,
    });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      status: false,
      message: err.message || messages.create.error
    });
  }
};

exports.getAll = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"])
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
  let search = req.query.q ? req.query.q : ""

  let query = {}
  if (userDetail.status === 1 && userDetail.data.isAdmin === false) {
    query.isDeleted = false
  }
  if (search) {
    query.post = { $regex: search, $options: "$i" }
  }

  const count = await userPost.countDocuments(query)
  userPost
    .find(
      query,
      { __v: 0 },
      { limit: limit, skip: offset, sort: { _id: -1 } }
    )
    .populate("user", "first_name last_name profile_picture address gender points_earned")
    .lean()
    .then(async (data) => {
      let userDetail = await userHelper.detail(req.headers["access-token"])
      for (i = 0; i < data.length; i++) {
        data[i].youLiked = await this.isLiked(userDetail.data, data[i]._id)
        data[i].edit = data[i].user && data[i].user._id == userDetail.data.user_id ? true : false
        if (data[i].user) {
          data[i].user.id = data[i].user._id
          let image = (data[i].user.profile_picture ? data[i].user.profile_picture : "")
          image = image ? (image.startsWith("http") === false ? config.imageUrl + image : image) : ""
          data[i].user.profile_picture = image
        }
      }
      return res.send({
        status: true,
        message: messages.read.success,
        data: data,
        count: count,
        code: "200"
      })
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || messages.read.error
      })
    })
}
//Create api By Corewave
exports.feedPosts = async (req, res) => {
  try {
    // Get user details from access token
    let userDetail = await userHelper.detail(req.headers["access-token"]);

    // Define limit and offset with default values
    let limit = parseInt(req.query.limit ? req.query.limit : config.limit);
    limit = limit > config.limit ? config.limit : limit;
    let offset = parseInt(req.query.offset ? req.query.offset : config.offset);
    let search = req.query.q ? req.query.q : "";

    // Construct query for filtering posts
    let query = { isDeleted: false }; // Ensuring only non-deleted posts appear

    if (search) {
      query.post = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    // Count total posts matching the query
    const count = await userPost.countDocuments(query);

    // Fetch posts sorted by newest first
    const posts = await userPost
      .find(query, { __v: 0 }, { limit, skip: offset, sort: { createdAt: -1 } })
      .populate("user", "first_name last_name profile_picture")
      .lean();

    // Process each post to filter required fields
    const filteredPosts = posts.map(post => ({
      _id: post._id,
      post: post.post,
      images: post.images
        ? post.images.map(image =>
          image.startsWith("http") ? image : config.imageUrl + image
        )
        : [],
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      createdAt: post.createdAt,
      user: post.user
        ? {
          _id: post.user._id,
          first_name: post.user.first_name,
          last_name: post.user.last_name || "",
          profile_picture: post.user.profile_picture.startsWith("http")
            ? post.user.profile_picture
            : config.imageUrl + post.user.profile_picture,
          id: post.user._id
        }
        : null
    }));

    return res.status(200).json({
      status: true,
      message: messages.read.success,
      data: filteredPosts,
      count: count,
      code: "200"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || messages.read.error });
  }
};



exports.isLiked = async (userDetail, postId) => {
  let isLiked = await userLike.findOne({
    user: userDetail.user_id,
    post: postId,
    isLiked: true
  })
  if (isLiked) {
    return true
  } else {
    return false
  }
}

exports.searchUserPosts = async (req, res) => {
  const { searchQuery } = req.query
  try {
    let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
    limit = limit > config.limit ? config.limit : limit
    let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

    const search = new RegExp(searchQuery, "i")
    const userPosts = await userPost
      .find(
        {
          $or: [{ post: search }]
        },
        {},
        { limit: limit, skip: offset, sort: { _id: -1 } }
      )
      .populate("user", "first_name last_name profile_picture address gender")

    const count = await userPost
      .find(
        {
          $or: [{ post: search }]
        },
        {},
        {}
      )
      .count({}, function (err, count) {
        return count
      })

    res.json({
      status: true,
      data: userPosts,
      count: count,
      message: messages.read.success
    })
  } catch (error) {
    res.status(404).json({ message: messages.read.error })
  }
}

exports.getById = (req, res) => {
  userPost
    .findById(req.params.postId)
    .populate({
      path: "comment",
      populate: [
        {
          path: "created_by",
          model: "User"
        }
      ]
    })
    .populate("user", "first_name last_name profile_picture address gender")
    .then((data) => {
      if (data) {
        return res.send({
          status: true,
          message: messages.read.success,
          data: data,
          count: count
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
  if ((req.body.post === "")) {
    return res.status(400).send({
      message: messages.update.empty
    })
  }

  const files = []
  // if (req.files) {
  //   let path = ""
  //   req.files.forEach(function (files, index, arr) {
  //     path = path + files.path + ","
  //   })
  //   path = path.substring(0, path.lastIndexOf(","))
  //   path = path.split(",")
  //   files.push(path)
  // }

  let userDetail = await userHelper.detail(req.headers["access-token"])

  const updateQuery = {}
  if (req.body.post) {
    updateQuery.post = req.body.post
  }
  if (req.body.like) {
    updateQuery.like = req.body.like
  }
  if (req.body.content) {
    updateQuery.comment = req.body.comment
  }
  if (req.body.category) {
    updateQuery.category = req.body.category
  }
  if (req.files && req.files.length) {
    updateQuery.images = files
  }
  if (req.body.commentCount) {
    updateQuery.commentCount = req.body.commentCount
  }

  if (userDetail.status === 1 && userDetail.data.isAdmin === true) {
    if (req.body.isActive) {
      updateQuery.isDeleted = false
    }
  }

  userPost
    .findByIdAndUpdate(req.params.postId, updateQuery, { new: true })
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
  userPost
    .findByIdAndUpdate(req.params.postId, { isDeleted: true }, { new: true })
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

exports.likePost = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"])
  if (userDetail.status === 0) {
    return res.send(userDetail)
  }
  let postId = req.body.user_post
  let getPost = await userPost.findOne({ _id: postId })
  if (getPost) {
    let isLiked = await userLike.findOne({
      post: postId,
      user: userDetail.data.user_id
    })
    if (isLiked === null) {
      const like = new userLike({
        post: postId,
        user: userDetail.data.user_id
      })
      like
        .save()
        .then(async (data) => {
          await userPost.updateOne({ _id: postId }, { $inc: { likeCount: +1 } })
          await userHelper.assignPoint(userDetail.data.user_id, "Like On Feed")
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
      userLike
        .findByIdAndUpdate(
          isLiked._doc._id,
          { isLiked: isLiked._doc.isLiked ? false : true },
          { new: true }
        )
        .then(async (data) => {
          await userPost.updateOne(
            { _id: postId },
            { $inc: { likeCount: isLiked._doc.isLiked ? -1 : +1 } }
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
    return res.send({
      status: false,
      message: messages.create.error
    })
  }
}

exports.deletePost = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"])
  if (userDetail.status === 0) {
    return res.send(userDetail)
  }
  let postId = req.body.user_post
  let getPost = await userPost.findOne({ _id: postId })
  if (getPost) {
    if (getPost.user == userDetail.data.user_id && getPost.isDeleted == false) {
      userPost
        .findByIdAndUpdate(getPost._id, { isDeleted: true }, { new: true })
        .then((data) => {
          if (data) {
            return res.send({ status: true, message: messages.delete.success })
          }
          return res.status(404).send({
            message: messages.delete.error
          })
        })

    } else {
      return res.send({
        status: false,
        message: messages.create.error
      })
    }
  } else {
    return res.send({
      status: false,
      message: messages.create.error
    })
  }
}

exports.downloadFeed = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"])
  if (userDetail.status === 1 && userDetail.data.isAdmin === true) {
    const excel = require("exceljs");

    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet("Feeds");

    worksheet.columns = [
      { header: "User Name", key: "first_name", width: 20 },
      { header: "Posted Date", key: "createdAt" },
      { header: "Posted feed format (JPG, PNG, GIF, Text, Video)", key: "post" },
      { header: "Total Likes", key: "likeCount" },
      { header: "Total Comments", key: "commentCount" }
    ];

    let query = { isDeleted: false }

    let data = await userPost.find(query, { post: 1, likeCount: 1, commentCount: 1, createdAt: 1 }).populate('user', 'first_name').lean()
    let feedData = []
    for (i = 0; i < data.length; i++) {
      feedData.push({
        'first_name': (data[i].user.first_name ? data[i].user.first_name : ""),
        'createdAt': moment(data[i].createdAt).format('DD.MM.YYYY'),
        'post': data[i].post,
        'likeCount': data[i].likeCount,
        'commentCount': data[i].commentCount
      })
    }
    worksheet.addRows(feedData);
    try {
      await workbook.xlsx.writeFile(`./uploads/temp/feeds.xlsx`)
        .then(() => {
          res.send({
            status: true,
            message: messages.read.success,
            path: `${config.imageUrl}/temp/feeds.xlsx`,
          });
        });
    } catch (err) {
      res.send({
        status: false,
        message: messages.read.error,
      });
    }

  }
}

exports.uploadFeedImage = async (req, res) => {
  const upload = require("../utility/fileUpload")
  let imageFile = req.files.image
  if (imageFile) {
    let imageData = await upload.uploadImage(imageFile, "uploads/feed/");
    console.log(imageData, "IMAGE")
    if (imageData.status === true) {
      res.send({
        status: true,
        filename: config.feedImageUrl + imageData.name
      })
    } else {
      res.send({
        status: false,
        filename: messages.read.error
      })
    }
  }
}
