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
    const filter = { isDeleted: false };
    const language = req.query.language || req.headers["language"] || "en";
    const video = await Video.find(filter).sort({ _id: -1 }).select("_id title video_link description availableIn createdAt").lean();
    const finalData = video
      .filter(item => item.title && item.title[language])
      .map(item => ({
        _id: item._id,
        title: item.title[language],
        video_link: item.video_link?.[language]? `${process.env.BASE_URL}/${item.video_link[language]}`: null,
        description: item.description?.[language] || null,
        availableIn: item.availableIn,
        createdAt: item.createdAt
      }));
    return res.status(200).json({ status: true, code: "200", message: "Video filtered by language successfully", data: finalData });
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
          doctorId:"$doctorResult._id",
          categoryId:"$categoryResult._id",
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




// exports.create = async (req, res) => {
//   let featuredImage = req.files.featured_image
//   const video = new Video({
//     title: { en: req.body.title },
//     category: req.body.category,
//     doctorId: req.body.doctorId,
//     contact_level: req.body.contact_level,
//     description: { en: req.body.description },
//     featured_image: { en: "" },
//     source: { en: req.body.source || "" },
//     duration: { en: req.body.duration || "" },
//     sort_order: { en: parseInt(req.body.sort_order) || 0 },
//     availableIn: req.body.availableIn || "en"
//   })

//   if (isUrl(req.body.video_link)) {
//     video.video_link = { en: req.body.video_link }
//   } else {
//     return res.status(400).send({
//       message: "Please enter a valid url"
//     })
//   }

//   if (featuredImage) {
//     let imageData = await upload.uploadImage(featuredImage, "uploads/video/");
//     if (imageData.status === true) {
//       video.featured_image = { en: imageData.name }
//     } else {
//       return res.send({
//         status: false,
//         message: imageData.message
//       })
//     }
//   }

//   video
//     .save()
//     .then((data) => {
//       return res.send({
//         status: true,
//         code: "201",
//         message: messages.create.success,
//       })
//     })
//     .catch((err) => {
//       return res.status(500).send({
//         message: err.message || messages.create.error
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
//   if(language){
//     sort_query["sort_order."+language] = 1 
//   }else{
//     sort_query["sort_order.en"] = 1 
//   }
//   if(sort_by){
//     sort_query = {}
//     sort_query[sort_by.key] = sort_by.val
//   }

//   let query = {}
//   if(language){
//     query.availableIn = {"$in": [language]}
//   }
//   if(userDetail.status === 1 && userDetail.data.isAdmin === false) {
//     query.isDeleted = false
//   }

//   if(search){
//     query["title.en"] = {$regex: search, $options:"$i"}
//   }

//   if(category){
//     query.category = category
//   }
//   if(contact_level){
//     query.contact_level = contact_level
//   }

//   let count = await Video.countDocuments(query)
//   let selectField = {"title.en": 1, "description.en": 1, "video_link.en": 1, "featured_image.en": 1, "source.en": 1, "duration.en": 1, availableIn: 1, likeCount: 1, commentCount: 1, contact_level: 1, isDeleted: 1, createdAt: 1, updatedAt: 1}
//   if(language != "en"){
//     selectField["title."+language] = 1;
//     selectField["description."+language] = 1;
//     selectField["video_link."+language] = 1;
//     selectField["featured_image."+language] = 1;
//     selectField["source."+language] = 1;
//     selectField["duration."+language] = 1;
//     selectField["sort_order."+language] = 1;
//   }

//   Video.find(query, selectField, { limit: limit, skip: offset, sort: sort_query }).populate("category", "name").lean()
//     .then(async (data) => {
//       let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])
//       for (i = 0; i < data.length; i++) {
//         let imageUrl = data[i].featured_image[language] ? data[i].featured_image[language] : data[i].featured_image.en 
//         data[i].title = data[i].title[language] ? data[i].title[language] : data[i].title.en
//         data[i].description = data[i].description[language] ? data[i].description[language] : data[i].description.en
//         data[i].video_link = data[i].video_link[language] ? data[i].video_link[language] : data[i].video_link.en
//         data[i].featured_image = imageUrl ? config.videoImageUrl + imageUrl : config.defaultImageUrl
//         data[i].source = data[i].source[language] ? data[i].source[language] : data[i].source.en
//         data[i].duration = data[i].duration[language] ? data[i].duration[language] : data[i].duration.en
//         // data[i].sort_order = data[i].sort_order[language] ? data[i].sort_order[language] : data[i].sort_order.en
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


// exports.getAll = async (req, res) => {
//   try {
//     const language = req.headers["language"] || req.query.language || "en";
//     const search = req.query.q || "";
//     const category = req.query.category || "";
//     const contact_level = req.query.contact_level || "";
//     const limit = parseInt(req.query.limit || config.limit);
//     const offset = parseInt(req.query.offset || config.offset);

//     const matchQuery = {
//       isDeleted: false,
//       availableIn: { $in: [language] }
//     };

//     if (category) {
//       matchQuery.category = category;
//     }

//     if (contact_level) {
//       matchQuery.contact_level = contact_level;
//     }

//     if (search) {
//       matchQuery[`title.${language}`] = { $regex: search, $options: "i" };
//     }

//     const videos = await Video.aggregate([
//       { $match: matchQuery },
//       {
//         $sort: {
//           [`sort_order.${language}`]: 1,
//           createdAt: -1
//         }
//       },
//       {
//         $lookup: {
//           from: "categories",
//           localField: "category",
//           foreignField: "_id",
//           as: "category"
//         }
//       },
//       { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "languages",
//           localField: "languageId",
//           foreignField: "_id",
//           as: "availableLanguages"
//         }
//       },
//       {
//         $project: {
//           _id: 1,
//           title: { $ifNull: [`$title.${language}`, "$title.en"] },
//           description: { $ifNull: [`$description.${language}`, "$description.en"] },
//           video_link: { $ifNull: [`$video_link.${language}`, "$video_link.en"] },
//           source: { $ifNull: [`$source.${language}`, "$source.en"] },
//           duration: { $ifNull: [`$duration.${language}`, "$duration.en"] },
//           featured_image_name: { $ifNull: [`$featured_image.${language}`, "$featured_image.en"] },
//           category: {
//             _id: "$category._id",
//             name: "$category.name"
//           },
//           contact_level: 1,
//           availableLanguages: {
//             $map: {
//               input: "$availableLanguages",
//               as: "lang",
//               in: {
//                 _id: "$$lang._id",
//                 title: "$$lang.title"
//               }
//             }
//           },
//           likeCount: { $ifNull: ["$likeCount", 0] },
//           commentCount: { $ifNull: ["$commentCount", 0] },
//           isDeleted: 1,
//           createdAt: 1,
//           updatedAt: 1
//         }
//       }
//     ])
//       .skip(offset)
//       .limit(limit);

//     // Add featured_image URL & youLiked field
//     const userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"]);

//     for (const video of videos) {
//       video.featured_image = video.featured_image_name
//         ? config.videoImageUrl + video.featured_image_name
//         : config.defaultImageUrl;

//       video.availableIn = video.availableLanguages.map(lang => lang.title).join(", ");
//       video.youLiked = await exports.isLiked(userDetail.data, video._id);

//       delete video.featured_image_name;
//       delete video.availableLanguages;
//     }

//     const total = await Video.countDocuments(matchQuery);

//     return res.send({
//       status: true,
//       message: messages.read.success,
//       data: videos,
//       count: total
//     });
//   } catch (err) {
//     return res.status(500).send({
//       status: false,
//       message: err.message || messages.read.error
//     });
//   }
// };



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

// exports.getById = (req, res) => {
//   let language = req.headers["language"] ? req.headers["language"] : (req.query.language ? req.query.language : "en")
//   Video.findById(req.params.videoId)
//     .populate("category", "name").lean()
//     .then((data) => {
//       if (data) {

//         let imageUrl = data.featured_image[language] ? data.featured_image[language] : data.featured_image.en

//         data.title = data.title[language] ? data.title[language] : ""
//         data.description = data.description[language] ? data.description[language] : ""
//         data.video_link = data.video_link[language] ? data.video_link[language] : ""
//         data.featured_image = imageUrl ? config.videoImageUrl + imageUrl : ""
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
//     req.body.video_link === "" &&
//     req.body.title === "" &&
//     req.body.description === "" &&
//     req.file === undefined
//   ) {
//     return res.status(400).send({
//       message: messages.update.empty
//     })
//   }

//   let language = req.headers["language"] ? req.headers["language"] : (req.body.language ? req.body.language : "en")

//   let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])

//   let doctorId = req.body.doctorId;
//   let languageId = req.body.languageId;

//   let getVideoDetail = await Video.findById(req.params.videoId).lean();
//   let availableIn = getVideoDetail.availableIn || ['en']
//   availableIn.push(language)
//   availableIn = [...new Set(availableIn)]

//   const updateQuery = {}
//   let featuredImage = req.files.featured_image
//   if (req.body.video_link && isUrl(req.body.video_link)) {
//     updateQuery["video_link." + language] = req.body.video_link
//   } else if (req.body.video_link) {
//     return res.status(400).send({
//       message: "Please enter a valid url"
//     })
//   }
//   if (req.body.title) {
//     updateQuery["title." + language] = req.body.title
//   }
//   if (req.body.description) {
//     updateQuery["description." + language] = req.body.description
//   }

//   if (featuredImage) {
//     let imageData = await upload.uploadImage(featuredImage, "uploads/video/");
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

//   if (req.body.sort_order) {
//     updateQuery["sort_order." + language] = parseInt(req.body.sort_order)
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

//   if (doctorId) {
//     updateQuery.doctorId = doctorId;
//   }

//   if (languageId) {
//     updateQuery.languageId = languageId;
//   }


//   if (userDetail.status === 1 && userDetail.data.isAdmin === true) {
//     if (req.body.isActive) {
//       updateQuery.isDeleted = false
//     }
//   }

//   Video.findByIdAndUpdate(req.params.videoId, updateQuery, { new: true })
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




exports.delete = (req, res) => {
  Video.findByIdAndUpdate(req.params.videoId, { isDeleted: true }, { new: true })
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
