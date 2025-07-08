const Video = require("../models/video.model.js")
const VideoComment = require("../models/video.comment.model.js")
const VideoLike = require("../models/video.like.model.js")
const messages = require("../utility/messages")
const upload = require("../utility/fileUpload")
const config = require("config")
const isUrl = require("is-url")
const userHelper = require("../utility/UserHelper")
const mongoose = require('mongoose')
//created New
exports.create = async (req, res) => {
  try {
    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);
    const language = req.headers["language"] || req.body.language;

    const { title, category, doctorId, contact_level, description, source, duration, sort_order } = req.body;

    const insertQuery = new Video({
      title: { [language]: title },
      description: { [language]: description },
      source: { [language]: source },
      duration: { [language]: duration },
      sort_order: parseInt(sort_order) || 0,
      availableIn: language,
      category: category,
      doctorId: doctorId,
      contact_level: contact_level,
      created_by: userDetail.data.user_id,
    });

    if (isUrl(req.body.video_link)) {
      insertQuery.video_link = { [language]: req.body.video_link }
    } else {
      return res.status(400).send({ message: "Please enter a valid url" })
    }

    let featuredImage = req.files.featured_image
    if (featuredImage) {
      let imageData = await upload.uploadImage(featuredImage);
      if (imageData.status === true) {
        insertQuery.featured_image = { [language]: imageData.name }
      } else {
        return res.send({ status: false, message: imageData.message })
      }
    }
    await insertQuery.save();
    return res.status(201).json({ code: "201", status: true, message: 'Video insert successfully' });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}


//Created New

exports.getAll = async (req, res) => {
  try {
    const filter = {isDeleted:false};
    const language = req.query.language || req.headers["language"] || "en";
    const offset = +req.query.offset || 0; // 0-based indexing
    const perPage = +req.query.perPage || 10;
    let count = await Video.countDocuments(filter)
    const q = req.query.q || "";

    const video = await Video.find().sort({ _id: -1 }).select("_id title video_link isDeleted description availableIn createdAt").lean();

    const filteredVideo = video.filter((item) => {
            const videoInLang = item.title && item.title[language];
            if (!videoInLang) return false;
            if (q) {
                return videoInLang.toLowerCase().includes(q.toLowerCase());
            }
            return true;
        });

    const data = filteredVideo.slice(offset, offset + perPage)
      .filter(item => item.title && item.title[language])
      .map(item => ({
        _id: item._id,
        title: item.title[language],
        isDeleted: item.isDeleted,
        video_link: item.video_link?.[language] ? `${process.env.BASE_URL}/${item.video_link[language]}` : null,
        description: item.description?.[language] || null,
        availableIn: item.availableIn,
        createdAt: item.createdAt
      }));
    return res.status(200).json({ status: true, code: "200", message: "Video filtered by language successfully", data, count:count });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}


//Created New

exports.update = async (req, res) => {
  try {
    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);
    const language = req.headers["language"] || req.body.language || "en";

    const { title, category, doctorId, contact_level, description, source, duration, sort_order } = req.body;

    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.params.videoId),
    };

    const updateQuery = {};

    // ✅ Multilingual fields
    if (title) updateQuery["title." + language] = title;
    if (description) updateQuery["description." + language] = description;
    if (source) updateQuery["source." + language] = source;
    if (duration) updateQuery["duration." + language] = duration;
    if (isUrl(req.body.video_link)) {
      updateQuery["video_link." + language] = req.body.video_link;
    } else {
      return res.status(400).send({ message: "Please enter a valid url" });
    }

    // ✅ Add language to availableIn
    updateQuery.$addToSet = { availableIn: language };
    updateQuery.updated_by = userDetail.data.user_id;

    // ✅ Non-language specific fields
    if (category) updateQuery.category = category;
    if (contact_level) updateQuery.contact_level = contact_level;
    if (doctorId) updateQuery.doctorId = doctorId;
    if (sort_order !== undefined) updateQuery.sort_order = sort_order || 0;

    // ✅ Optional: Upload featured image
    let featuredImage = req.files?.featured_image
    if (featuredImage) {
      let imageData = await upload.uploadImage(featuredImage);
      if (imageData.status === true) {
        updateQuery.featured_image = { [language]: imageData.name }
      } else {
        return res.send({ status: false, message: imageData.message })
      }
    }

    // ✅ Perform update
    const updateVideo = await Video.findOneAndUpdate(filter, updateQuery, { new: true });

    if (!updateVideo) {
      return res.status(404).json({ status: false, message: "Video not found" });
    }

    return res.status(201).json({ status: true, code: 201, message: "Video updated successfully" });
  } catch (err) {
    console.log(err, "Error");
    return res.status(500).json({ status: false, code: 500, message: err.message || "Internal Server Error" });
  }
}


exports.getById = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";

    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.params.videoId),
    };

    const aggregationPipeline = [
      {
        $match: filter
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryResult"
        }
      },
      {
        $unwind: {
          path: "$categoryResult",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorResult"
        }
      },
      {
        $unwind: {
          path: "$doctorResult",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          title: { $ifNull: [`$title.${language}`, ""] },
          description: { $ifNull: [`$description.${language}`, ""] },
          category: { $ifNull: [`$categoryResult.name.${language}`, ""] },
          doctorName: { $ifNull: [`$doctorResult.doctorName.${language}`, ""] },
          featured_image: { $ifNull: [`$featured_image.${language}`, ""] },
          source: { $ifNull: [`$source.${language}`, ""] },
          duration: { $ifNull: [`$duration.${language}`, ""] },
          video_link: { $ifNull: [`$video_link.${language}`, ""] }
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          category: 1,
          contact_level: 1,
          doctorName: 1,
          featured_image: 1,
          doctorId: "$doctorResult._id",
          categoryId: "$categoryResult._id",
          source: 1,
          duration: 1,
          sort_order: 1,
          availableIn: 1,
          video_link: 1,
        }
      }
    ];
    const videoQuery = await Video.aggregate(aggregationPipeline);

    if (!videoQuery || !videoQuery.length) {
      return res.status(404).json({ status: false, code: "404", message: "Video not found" });
    }

    return res.status(200).json({ status: true, code: "200", data: videoQuery[0] });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}


exports.searchVideo = async (req, res) => {
  const { searchQuery } = req.query
  try {
    let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
    limit = limit > config.limit ? config.limit : limit
    let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

    const search = new RegExp(searchQuery, "i")
    const videos = await Video.find(
      {
        $or: [{ title: search }, { description: search }]
      },
      {},
      { limit: limit, skip: offset, sort: { _id: -1 } }
    )

    const count = await Video.find(
      {
        $or: [{ title: search }, { description: search }]
      },
      {},
      {}
    ).count({}, function (err, count) {
      return count
    })

    res.json({
      status: true,
      data: videos,
      count: count,
      message: messages.read.success
    })
  } catch (error) {
    res.status(404).json({ message: messages.read.error })
  }
}



exports.delete = async (req, res) => {
  try {
    const videoId = req.params.videoId;

    // Step 1: Find the audio by ID
    const video = await Video.findById(videoId);

    // Step 2: Toggle isDeleted
    const newIsDeletedStatus = !video.isDeleted;

    // Step 3: Update 
    video.isDeleted = newIsDeletedStatus;
    await video.save();

    return res.status(200).json({ status: true, code: 200, message: newIsDeletedStatus ? "Video marked as deleted" : "Video restored successfully", data: { isDeleted: newIsDeletedStatus } });

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
};


exports.likeVideo = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"])
  if (userDetail.status === 0) {
    return res.send(userDetail)
  }
  let postId = req.body.video_id
  let getPost = await Video.findOne({ _id: postId })
  if (getPost) {
    let isLiked = await VideoLike.findOne({
      ideo_id: postId,
      user_id: userDetail.data.user_id
    })
    if (isLiked === null) {
      const like = new VideoLike({
        video_id: postId,
        user_id: userDetail.data.user_id
      })
      like
        .save()
        .then(async (data) => {
          await Video.updateOne({ _id: postId }, { $inc: { likeCount: +1 } })
          // await userHelper.assignPoint(userDetail.data.user_id, "Like On Feed")
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
      VideoLike
        .findByIdAndUpdate(
          isLiked._doc._id,
          { isLiked: isLiked._doc.isLiked ? false : true },
          { new: true }
        )
        .then(async (data) => {
          await Video.updateOne(
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

exports.isLiked = async (userDetail, postId) => {
  let isLiked = await VideoLike.findOne({
    user_id: userDetail.user_id,
    video_id: postId,
    isLiked: true
  })
  if (isLiked) {
    return true
  } else {
    return false
  }
}

exports.createComment = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"])
  if (userDetail.status === 0) {
    return res.send(userDetail)
  }

  let postId = req.body.video_id
  let parentId = req.body.parent_id
  let getPost = await Video.findOne({ _id: postId })
  if (getPost) {
    const comments = new VideoComment({
      body: req.body.body,
      video: postId,
      parent_id: parentId,
      created_by: userDetail.data.user_id
    })

    comments
      .save()
      .then(async (data) => {
        await Video.updateOne({ _id: postId }, { $inc: { commentCount: +1 } })
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

exports.getAllComments = (req, res) => {
  let query = { isDeleted: false }
  let search = req.query.q ? req.query.q : ""
  if (search) {
    query.body = { $regex: search, $options: "$i" }
  }
  if (req.query.video_id) {
    query.video = req.query.video_id
  }
  if (req.query.comment_id) {
    query.parent_id = req.query.comment_id
  }
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
  VideoComment.find(query, {}, { limit: limit, skip: offset, sort: { _id: -1 } })
    .populate("video", "title")
    .populate("created_by", "first_name last_name profile_picture")
    .lean()
    .then((data) => {
      data.forEach((d) => {
        let video = d.video !== undefined && d.video ? d.video : {}
        delete d.video
        d.video = video._id || ""
        d.title = video.title || ""
        let profile_picture = d.created_by.profile_picture || ""
        profile_picture = (profile_picture ? profile_picture : config.defaultImageUrl)
        profile_picture = profile_picture ? (profile_picture.startsWith("http") === false ? config.videoImageUrl + profile_picture : profile_picture) : ""
        if (d.created_by._id) {
          d.created_by.profile_picture = profile_picture
        }
      })
      return res.send({
        status: true,
        message: messages.read.success,
        data: data
      })
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || messages.read.error
      })
    })
}

exports.deleteComment = (req, res) => {
  VideoComment.findByIdAndUpdate(req.params.commentId, { isDeleted: true }, { new: true })
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
