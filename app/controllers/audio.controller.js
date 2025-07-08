const Audio = require("../models/audio.model.js")
const AudioComment = require("../models/audio.comment.model.js")
const AudioLike = require("../models/audio.like.model.js")
const messages = require("../utility/messages")
const upload = require("../utility/fileUpload")
const config = require("config")
const Language = require('../models/language.model.js');
const isUrl = require("is-url")
const userHelper = require("../utility/UserHelper")
const mongoose = require('mongoose');

//Created New

exports.create = async (req, res) => {
  try {
    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);
    const language = req.headers["language"] || req.body.language;
    let audioFile = req.files.audio_link;
    const { title, category, contact_level, description, doctorId, source, duration, sort_order, } = req.body;
    let featuredImage = req.files.featured_image
    const audio = new Audio({
      title: { [language]: title },
      category: category,
      contact_level: contact_level,
      description: { [language]: description },
      doctorId: doctorId,
      featured_image: { [language]: featuredImage },
      source: { [language]: source },
      duration: { [language]: duration },
      sort_order: parseInt(sort_order) || 0,
      availableIn: language,
      created_by: userDetail.data.user_id,
    })

    if (audioFile) {
      let audioData = await upload.uploadAudio(audioFile);
      if (audioData.status === true) {
        audio.audio_link = { [language]: audioData.name }
      } else {
        return res.send({ status: false, message: audioData.message })
      }
    }

    if (featuredImage) {
      let imageData = await upload.uploadImage(featuredImage);
      if (imageData.status === true) {
        audio.featured_image = { en: imageData.name }
      } else {
        return res.send({ status: false, message: imageData.message })
      }
    };
    await audio.save();
    return res.status(201).json({ code: "201", status: true, message: 'Audio created successfully' });
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

    const audioFile = req.files?.audio_link;
    const featuredImage = req.files?.featured_image;

    const { title, category, contact_level, description, doctorId, source, duration, sort_order, } = req.body;

    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.params.audioId),
    };

    const updateQuery = {};

    // ✅ Multilingual fields
    if (title) updateQuery["title." + language] = title;
    if (description) updateQuery["description." + language] = description;
    if (source) updateQuery["source." + language] = source;
    if (duration) updateQuery["duration." + language] = duration;

    // ✅ Add language to availableIn
    updateQuery.$addToSet = { availableIn: language };
    updateQuery.updated_by = userDetail.data.user_id;

    // ✅ Non-language specific fields
    if (category) updateQuery.category = category;
    if (contact_level) updateQuery.contact_level = contact_level;
    if (doctorId) updateQuery.doctorId = doctorId;
    if (sort_order !== undefined) updateQuery.sort_order = sort_order;

    // ✅ Optional: Upload audio file
    if (audioFile) {
      const audioData = await upload.uploadAudio(audioFile);
      if (audioData.status === true) {
        updateQuery["audio_link." + language] = audioData.name;
      } else {
        return res.status(400).json({ status: false, message: audioData.message });
      }
    }

    // ✅ Optional: Upload featured image
    if (featuredImage) {
      const imageData = await upload.uploadImage(featuredImage);
      if (imageData.status === true) {
        updateQuery["featured_image." + language] = imageData.name;
      } else {
        return res.status(400).json({ status: false, message: imageData.message });
      }
    }

    // ✅ Perform update
    const updatedAudio = await Audio.findOneAndUpdate(filter, updateQuery, { new: true });

    if (!updatedAudio) {
      return res.status(404).json({ status: false, message: "Audio not found" });
    }

    return res.status(201).json({ status: true, code: 201, message: "Audio updated successfully" });

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
};

//Created New
exports.getAll = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    const language = req.query.language || req.headers["language"] || "en";

    const offset = +req.query.offset || 0; // 0-based indexing
    const perPage = +req.query.perPage || 10;
    let count = await Audio.countDocuments(filter)
    const q = req.query.q || "";

    const audio = await Audio.find().sort({ _id: -1 }).select("_id title description audio_link  availableIn isDeleted createdAt").lean();

    const filteredAudio = audio.filter((item) => {
      const audioInLang = item.title && item.title[language];
      if (!audioInLang) return false;
      if (q) {
        return audioInLang.toLowerCase().includes(q.toLowerCase());
      }
      return true;
    });

    const data = filteredAudio.slice(offset, offset + perPage)
      .filter(item => item.title && item.title[language])
      .map(item => ({
        _id: item._id,
        isDeleted: item.isDeleted,
        title: item.title[language],
        audio_link: item.audio_link?.[language] ? `${process.env.BASE_URL}/${item.audio_link[language]}` : null,
        description: item.description?.[language] || null,
        availableIn: item.availableIn,
        createdAt: item.createdAt,
        shortCode: language,
      }));

    return res.status(200).json({ status: true, code: "200", message: "Audio filtered by language successfully", data, count: count });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message || "Internal Server Error" });
  }
};

//Created New
exports.getById = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";

    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.params.audioId),
    };

    const aggregationPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryResult"
        }
      },
      { $unwind: { path: "$categoryResult", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorResult"
        }
      },
      { $unwind: { path: "$doctorResult", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          title: { $ifNull: [`$title.${language}`, ""] },
          description: { $ifNull: [`$description.${language}`, ""] },
          category: { $ifNull: [`$categoryResult.name.${language}`, ""] },
          doctorName: { $ifNull: [`$doctorResult.doctorName.${language}`, ""] },
          featured_image: { $ifNull: [`$featured_image.${language}`, ""] },
          source: { $ifNull: [`$source.${language}`, ""] },
          duration: { $ifNull: [`$duration.${language}`, ""] },
          audio_link: { $ifNull: [`$audio_link.${language}`, ""] }
        }
      },
      {
        $project: {
          _id: 1,
          contact_level: 1,
          sort_order: 1,
          availableIn: 1,
          title: 1,
          description: 1,
          category: 1,
          categoryId: "$categoryResult._id",
          doctorId: "$doctorResult._id",
          doctorName: 1,
          featured_image: 1,
          source: 1,
          duration: 1,
          audio_link: 1,
        }
      }
    ];

    const audioQuery = await Audio.aggregate(aggregationPipeline);

    if (!audioQuery || !audioQuery.length) {
      return res.status(404).json({ status: false, code: "404", message: "Audio not found" });
    }

    const item = audioQuery[0];

    // Add BASE_URL to audio_link and featured_image
    item.audio_link = item.audio_link ? `${process.env.BASE_URL}/${item.audio_link}` : null;
    item.featured_image = item.featured_image ? `${process.env.BASE_URL}/${item.featured_image}` : null;

    return res.status(200).json({ status: true, code: "200", data: item });

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
};



exports.searchAudio = async (req, res) => {
  const { searchQuery } = req.query
  try {
    let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
    limit = limit > config.limit ? config.limit : limit
    let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

    const search = new RegExp(searchQuery, "i")
    const audios = await Audio.find(
      {
        $or: [{ title: search }]
      },
      {},
      { limit: limit, skip: offset, sort: { _id: -1 } }
    )

    const count = await Audio.find(
      {
        $or: [{ title: search }]
      },
      {},
      {}
    ).count({}, function (err, count) {
      return count
    })

    res.json({
      status: true,
      data: audios,
      count: count,
      message: messages.read.success
    })
  } catch (error) {
    res.status(404).json({ message: messages.read.error })
  }
}

// exports.getById = (req, res) => {
//   // let language = req.headers["language"] ? req.headers["language"] : (req.query.languageId ? req.query.languageId : "en")
//   let language = req.query.languageId
//   Audio.findById(req.params.audioId)
//     .populate("category", "name").lean()
//     .then((data) => {
//       console.log(data, "Data");
//       if (data) {
//         let imageUrl = data.featured_image[language] ? data.featured_image[language] : data.featured_image.en

//         data.title = data.title[language] ? data.title[language] : ""
//         data.description = data.description[language] ? data.description[language] : ""
//         data.audio_link = data.audio_link[language] ? config.audioUrl + data.audio_link[language] : ""
//         data.featured_image = imageUrl ? config.audioImageUrl + imageUrl : ""
//         data.source = data.source[language] ? data.source[language] : ""
//         data.duration = data.duration[language] ? data.duration[language] : ""
//         data.sort_order = data.sort_order[language] ? data.sort_order[language] : ""

//         return res.send({
//           status: true,
//           message: messages.read.success,
//           data: data
//         })
//       }
//       return res.status(404).send({
//         message: messages.read.error
//       })
//     })
//     .catch((err) => {
//       if (err.kind === "ObjectId") {
//         return res.status(404).send({
//           message: messages.read.error
//         })
//       }
//       return res.status(500).send({
//         message: messages.read.error
//       })
//     })
// }


// exports.update = async (req, res) => {
//   if (
//     req.body.audio_link === "" &&
//     req.body.title === "" &&
//     req.body.description === "" &&
//     req.file === undefined
//   ) {
//     return res.status(400).send({
//       message: messages.update.empty
//     })
//   }

//   let language = req.headers["language"] ? req.headers["language"] : (req.body.language ? req.body.language : "en")

//   let userDetail = await userHelper.detail(req.headers["access-token"])

//   let getAudioDetail = await Audio.findById(req.params.audioId).lean();
//   let availableIn = getAudioDetail.availableIn || ['en']
//   availableIn.push(language)
//   availableIn = [...new Set(availableIn)]

//   const updateQuery = {}

//   let audioFile = req.files.audio_link
//   let featuredImage = req.files.featured_image

//   if (req.body.title) {
//     updateQuery["title." + language] = req.body.title
//   }

//   if (req.body.description) {
//     updateQuery["description." + language] = req.body.description
//   }

//   if (req.body.sort_order) {
//     updateQuery["sort_order." + language] = parseInt(req.body.sort_order)
//   }

//   if (audioFile) {
//     let audioData = await upload.uploadAudio(audioFile);
//     if (audioData.status === true) {
//       updateQuery["audio_link." + language] = audioData.name
//     } else {
//       return res.send({
//         status: false,
//         message: audioData.message
//       })
//     }
//   }

//   if (featuredImage) {
//     let imageData = await upload.uploadImage(featuredImage, "uploads/audio-image/");
//     if (imageData.status === true) {
//       if (imageData.name) {
//         updateQuery["featured_image." + language] = imageData.name
//       }
//     } else {
//       return res.send({
//         status: false,
//         message: imageData.message
//       })
//     }
//   }

//   if (req.body.source) {
//     updateQuery["source." + language] = req.body.source
//   }

//   if (req.body.duration) {
//     updateQuery["duration." + language] = req.body.duration
//   }

//   if (req.body.category) {
//     updateQuery.category = req.body.category
//   }

//   if (req.body.contact_level) {
//     updateQuery.contact_level = req.body.contact_level
//   }

//   if (availableIn) {
//     updateQuery.availableIn = availableIn;
//   }

//   if (userDetail.status === 1 && userDetail.data.isAdmin === true) {
//     if (req.body.isActive) {
//       updateQuery.isDeleted = false
//     }
//   }

//   Audio.findByIdAndUpdate(req.params.audioId, updateQuery, { new: true })
//     .then((data) => {
//       if (data) {
//         return res.send({
//           status: true,
//           message: messages.update.success,
//           data: data
//         })
//       }
//       return res.status(404).send({
//         message: messages.update.error
//       })
//     })
//     .catch((err) => {
//       if (err.kind === "ObjectId") {
//         return res.status(404).send({
//           message: messages.update.error
//         })
//       }
//       return res.status(500).send({
//         message: messages.update.error
//       })
//     })
// }

// exports.getAll = async (req, res) => {
//   let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])
//   let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
//   limit = limit > config.limit ? config.limit : limit
//   let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
//   let language = req.headers["language"] ? req.headers["language"] : (req.query.language ? req.query.language : "en")
//   let search = req.query.q ? req.query.q : ""
//   let category = req.query.category ? req.query.category : ""
//   let contact_level = req.query.contact_level ? req.query.contact_level : ""

//   let sort_by = req.query.sort_by ? JSON.parse(req.query.sort_by) : ""

//   // let sort_query = { _id: -1 }
//   let sort_query = {}
//   if (language) {
//     sort_query["sort_order." + language] = 1
//   } else {
//     sort_query["sort_order.en"] = 1
//   }
//   if (sort_by) {
//     sort_query = {}
//     sort_query[sort_by.key] = sort_by.val
//   }

//   let query = {}
//   if (language) {
//     query.availableIn = { "$in": [language] }
//   }
//   if (userDetail.status === 1 && userDetail.data.isAdmin === false) {
//     query.isDeleted = false
//   }

//   if (search) {
//     query["title.en"] = { $regex: search, $options: "$i" }
//   }

//   if (category) {
//     query.category = category
//   }
//   if (contact_level) {
//     query.contact_level = contact_level
//   }

//   let count = await Audio.countDocuments(query)
//   let selectField = { "title.en": 1, "description.en": 1, "audio_link.en": 1, "featured_image.en": 1, "source.en": 1, "duration.en": 1, contact_level: 1, isDeleted: 1, availableIn: 1, likeCount: 1, languageId: 1, commentCount: 1, createdAt: 1, updatedAt: 1 }
//   if (language != "en") {
//     selectField["title." + language] = 1;
//     selectField["description." + language] = 1;
//     selectField["audio_link." + language] = 1;
//     selectField["featured_image." + language] = 1;
//     selectField["source." + language] = 1;
//     selectField["duration." + language] = 1;
//   }
//   Audio.find(query, selectField, { limit: limit, skip: offset, sort: sort_query }).populate("category", "name").lean()
//     .then(async (data) => {
//       console.log(data, "Data");
//       let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])
//       for (i = 0; i < data.length; i++) {
//         let imageUrl = data[i].featured_image[language] ? data[i].featured_image[language] : data[i].featured_image.en
//         data[i].title = data[i].title[language] ? data[i].title[language] : data[i].title.en
//         data[i].description = data[i].description[language] ? data[i].description[language] : data[i].description.en
//         data[i].audio_link = data[i].audio_link[language] ? config.audioUrl + data[i].audio_link[language] : config.audioUrl + data[i].audio_link.en
//         data[i].featured_image = imageUrl ? config.audioImageUrl + imageUrl : config.defaultImageUrl
//         data[i].source = data[i].source[language] ? data[i].source[language] : data[i].source.en
//         data[i].duration = data[i].duration[language] ? data[i].duration[language] : data[i].duration.en
//         data[i].availableIn = data[i].availableIn ? data[i].availableIn.toString() : ""
//         data[i].likeCount = data[i].likeCount ? data[i].likeCount : 0
//         data[i].commentCount = data[i].commentCount ? data[i].commentCount : 0
//         data[i].category = data[i].category !== undefined && data[i].category ? data[i].category : {}
//         data[i].contact_level = data[i].contact_level || ""
//         data[i].youLiked = await this.isLiked(userDetail.data, data[i]._id)
//       }
//       return res.send({
//         status: true,
//         message: messages.read.success,
//         data: data,
//         count: count
//       })
//     })
//     .catch((err) => {
//       return res.status(500).send({
//         message: err.message || messages.read.error
//       })
//     })
// }

exports.delete = async (req, res) => {
  try {
    const audioId = req.params.audioId;

    // Step 1: Find the audio by ID
    const audio = await Audio.findById(audioId);

    // Step 2: Toggle isDeleted
    const newIsDeletedStatus = !audio.isDeleted;

    // Step 3: Update 
    audio.isDeleted = newIsDeletedStatus;
    await audio.save();

    return res.status(200).json({
      status: true,
      code: 200,
      message: newIsDeletedStatus ? "Audio marked as deleted" : "Audio restored successfully",
      data: { isDeleted: newIsDeletedStatus }
    });

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
};



exports.likeAudio = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"])
  if (userDetail.status === 0) {
    return res.send(userDetail)
  }
  let postId = req.body.audio_id
  let getPost = await Audio.findOne({ _id: postId })
  if (getPost) {
    let isLiked = await AudioLike.findOne({
      audio_id: postId,
      user_id: userDetail.data.user_id
    })
    if (isLiked === null) {
      const like = new AudioLike({
        audio_id: postId,
        user_id: userDetail.data.user_id
      })
      like
        .save()
        .then(async (data) => {
          await Audio.updateOne({ _id: postId }, { $inc: { likeCount: +1 } })
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
      AudioLike
        .findByIdAndUpdate(
          isLiked._doc._id,
          { isLiked: isLiked._doc.isLiked ? false : true },
          { new: true }
        )
        .then(async (data) => {
          await Audio.updateOne(
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
  let isLiked = await AudioLike.findOne({
    user_id: userDetail.user_id,
    audio_id: postId,
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

  let postId = req.body.audio_id
  let parentId = req.body.parent_id
  let getPost = await Audio.findOne({ _id: postId })
  if (getPost) {
    const comments = new AudioComment({
      body: req.body.body,
      audio: postId,
      parent_id: parentId,
      created_by: userDetail.data.user_id
    })

    comments
      .save()
      .then(async (data) => {
        await Audio.updateOne({ _id: postId }, { $inc: { commentCount: +1 } })
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
  if (req.query.audio_id) {
    query.audio = req.query.audio_id
  }
  if (req.query.comment_id) {
    query.parent_id = req.query.comment_id
  }
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
  console.log(query, limit, offset)
  AudioComment.find(query, {}, { limit: limit, skip: offset, sort: { _id: -1 } })
    .populate("audio", "title")
    .populate("created_by", "first_name last_name profile_picture")
    .lean()
    .then((data) => {
      data.forEach((d) => {
        let audio = d.audio !== undefined && d.audio ? d.audio : {}
        delete d.audio
        d.audio = audio._id || ""
        d.title = audio.title || ""
        let profile_picture = d.created_by.profile_picture || ""
        profile_picture = (profile_picture ? profile_picture : config.defaultImageUrl)
        profile_picture = profile_picture ? (profile_picture.startsWith("http") === false ? config.audioImageUrl + profile_picture : profile_picture) : ""
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
  AudioComment.findByIdAndUpdate(req.params.commentId, { isDeleted: true }, { new: true })
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

// New Api

// exports.getAll = async(req, res) => {
//   try {
//     const filter = {
//       isDeleted: false
//     };

//     const pipeline = [
//       { $match: filter },
//       {
//         $lookup: {
//           from: "categories",
//           localField: "category",
//           foreignField: "_id",
//           as: "categoryResult"
//         }
//       },
//       { $unwind: "$categoryResult" },
//       {
//         $lookup: {
//           from: "languages",
//           localField: "languageId",
//           foreignField: "_id",
//           as: "languageResult"
//         }
//       },
//       { $unwind: "$languageResult" },
//       {
//         $group: {
//           _id: "$categoryResult._id",
//           category: { $first: "$categoryResult" },
//           audios: {
//             $push: {
//               _id: "$_id",
//               title: "$title.en",
//               language: "$languageResult.title",
//               languageCode: "$languageResult.code",
//               audio_link: "$audio_link.en",
//               description: "$description.en",
//               createdAt: "$createdAt",

//             }
//           }
//         }
//       },
//       {
//         $project: {
//           _id: 0,
//           category: {
//             _id: "$_id",
//             name: "$category.name.en"
//           },
//           audios: 1
//         }
//       },
//       {
//         $sort: { "category.name": 1 }
//       }
//     ];

//     const getQuery = await Audio.aggregate(pipeline);
//     return res.status(200).json({ code: "200", status: true, message: 'Get All Language Successfully', data: getQuery });
//   } catch (err) {
//     return res.status(500).json({ status: false, message: err.message || 'Internal Server Error' });
//   }
// }



exports.getAudioLanguageFilter = async (req, res) => {
  try {
    const languageIds = req.query.languageIds;

    // Convert query param to array of ObjectIds
    const idsArray = Array.isArray(languageIds)
      ? languageIds.map(id => new mongoose.Types.ObjectId(id))
      : [new mongoose.Types.ObjectId(languageIds)];

    const filter = {
      isDeleted: false,
      languageId: { $in: idsArray },
    };

    const audios = await Audio.find(filter);

    return res.status(200).json({
      message: "Audio list filtered by languageId",
      data: audios,
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to fetch filtered audio",
    });
  }
};




exports.createAudio = async (req, res) => {
  try {
    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);

    const {
      category,
      contact_level,
      doctorId,
      sort_order,
      translations
    } = req.body;

    let parsedTranslations = [];

    // ✅ Parse JSON string (from form-data) — ENABLE THIS!
    if (typeof translations === 'string') {
      try {
        parsedTranslations = JSON.parse(translations);
      } catch (e) {
        return res.status(400).json({
          status: false,
          message: "Invalid translations JSON format",
        });
      }
    } else if (Array.isArray(translations)) {
      parsedTranslations = translations;
    }

    if (parsedTranslations.length === 0) {
      return res.status(400).json({
        status: false,
        message: "At least one translation is required.",
      });
    }

    for (let i = 0; i < parsedTranslations.length; i++) {
      const langCode = parsedTranslations[i].languageCode;
      const audioFile = req.files?.[`audio_link_${langCode}`];
      const imageFile = req.files?.[`featured_image_${langCode}`];

      // Upload audio
      if (audioFile) {
        const audioData = await upload.uploadAudio(audioFile);
        if (audioData.status === true) {
          parsedTranslations[i].audio_link = audioData.name;
        } else {
          return res.status(400).json({
            status: false,
            message: `Audio upload failed for ${langCode}: ${audioData.message}`,
          });
        }
      }

      // Upload image
      if (imageFile) {
        const imageData = await upload.uploadImage(imageFile, "uploads/audio-image/");
        if (imageData.status === true) {
          parsedTranslations[i].featured_image = imageData.name;
        } else {
          return res.status(400).json({
            status: false,
            message: `Image upload failed for ${langCode}: ${imageData.message}`,
          });
        }
      }
    }

    const audio = new Audio({
      category,
      doctorId,
      created_by: userDetail.data.user_id,
      contact_level,
      sort_order: parseInt(sort_order) || 0,
      translations: parsedTranslations.map(item => ({
        languageId: item.languageId,
        title: item.title,
        description: item.description,
        audio_link: item.audio_link,
        featured_image: item.featured_image,
        duration: item.duration,
        source: item.source
      }))
    });

    await audio.save();

    return res.status(201).json({
      status: true,
      message: messages.create.success || "Audio created successfully",
    });

  } catch (err) {
    console.error("Audio create error:", err);
    return res.status(500).json({
      status: false,
      message: messages.create.error || "Internal Server Error",
      error: err.message
    });
  }
};


exports.updateAudioWithTranslation = async (req, res) => {
  try {
    const audioId = req.params.audioId;

    const {
      translations // Should be a single translation object or array with 1 item
    } = req.body;

    let parsedTranslations = [];

    // Parse translations
    if (typeof translations === 'string') {
      try {
        parsedTranslations = JSON.parse(translations);
      } catch (e) {
        return res.status(400).json({
          status: false,
          message: "Invalid translations JSON format",
        });
      }
    } else if (Array.isArray(translations)) {
      parsedTranslations = translations;
    }

    if (parsedTranslations.length !== 1) {
      return res.status(400).json({
        status: false,
        message: "Please provide exactly one translation to update.",
      });
    }

    const translation = parsedTranslations[0];
    const langCode = translation.languageCode;

    // Check if translation already exists
    const existingAudio = await Audio.findById(audioId);
    if (!existingAudio) {
      return res.status(404).json({
        status: false,
        message: "Audio not found.",
      });
    }

    const alreadyExists = existingAudio.translations.some(tr => tr.languageId.toString() === translation.languageId);
    if (alreadyExists) {
      return res.status(400).json({
        status: false,
        message: "Translation for this language already exists.",
      });
    }

    // Upload files
    const audioFile = req.files?.[`audio_link_${langCode}`];
    const imageFile = req.files?.[`featured_image_${langCode}`];

    if (audioFile) {
      const audioData = await upload.uploadAudio(audioFile);
      if (audioData.status === true) {
        translation.audio_link = audioData.name;
      } else {
        return res.status(400).json({
          status: false,
          message: `Audio upload failed for ${langCode}: ${audioData.message}`,
        });
      }
    }

    if (imageFile) {
      const imageData = await upload.uploadImage(imageFile, "uploads/audio-image/");
      if (imageData.status === true) {
        translation.featured_image = imageData.name;
      } else {
        return res.status(400).json({
          status: false,
          message: `Image upload failed for ${langCode}: ${imageData.message}`,
        });
      }
    }

    // Add to translations array
    await Audio.findByIdAndUpdate(audioId, {
      $push: {
        translations: {
          languageId: translation.languageId,
          title: translation.title,
          description: translation.description,
          audio_link: translation.audio_link,
          featured_image: translation.featured_image,
          duration: translation.duration,
          source: translation.source
        }
      }
    });

    return res.status(200).json({
      status: true,
      message: "Translation added successfully.",
    });

  } catch (err) {
    console.error("Error updating audio:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message
    });
  }
};

