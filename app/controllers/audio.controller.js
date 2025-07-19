const Audio = require("../models/audio.model.js")
const Video = require('../models/video.model.js');
const User = require("../models/user.model.js")
const Doctor = require('../models/doctor.model.js');
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
        audio.featured_image = { [language]: imageData.name }
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

    const audio = await Audio.find().sort({ _id: -1 }).select("_id title description audio_link  availableIn isDeleted createdAt isTopAudioCast").lean();

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
        audio_link: item.audio_link?.[language] ? `${process.env.BASE_URL}/uploads/${item.audio_link[language]}` : null,
        description: item.description?.[language] || null,
        availableIn: item.availableIn,
        createdAt: item.createdAt,
        isTopAudioCast: item.isTopAudioCast,
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
    item.audio_link = item.audio_link ? `${process.env.BASE_URL}/uploads/audio/${item.audio_link}` : null;
    item.featured_image = item.featured_image ? `${process.env.BASE_URL}/uploads/${item.featured_image}` : null;

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
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])
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
const formatDateToDDMMYYYY = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

exports.getAllComments = async (req, res) => {

  const token = req.headers['access-token'] || req.headers['authorization'];
  const userDetail = await userHelper.detail(token);

  const language = req.headers['language'] || req.query.language || "en";


  const userId = userDetail?.data?.user_id;
  const userProfile = userId ? await User.findOne({ _id: userId, isDeleted: false }, "first_name profile_picture").lean() : null;


  let query = { isDeleted: false };
  const search = (req.query.q || "").trim();

  if (search) {
    query.body = { $regex: search, $options: "i" };
  }

  if (req.query.audio_id) {
    query.audio = req.query.audio_id;
  }

  if (req.query.comment_id) {
    query.parent_id = req.query.comment_id;
  }

  let limit = parseInt(req.query.limit || config.limit);
  limit = limit > config.limit ? config.limit : limit;
  let offset = parseInt(req.query.offset || config.offset);

  AudioComment.find(query, {}, { limit, skip: offset, sort: { _id: -1 } })
    .populate("audio", "title")
    .populate("created_by", "first_name last_name profile_picture")
    .lean()
    .then((data) => {
      const formattedData = data.map((d) => {
        const audio = d.audio || {};
        const audioTitle = typeof audio.title === "object" ? (audio.title[language] || "") : audio.title;

        const commentBody = typeof d.body === "object" ? (d.body[language] || "") : d.body;

        let profile_picture = d.created_by?.profile_picture || "";
        profile_picture = `${process.env.IMAGE_BASE_URL}/${profile_picture}`;
        return {
          ...d,
          audio: audio._id || "",
          createdAt: formatDateToDDMMYYYY(d.createdAt),
          title: audioTitle,
          body: commentBody,
          created_by: {
            ...d.created_by,
            profile_picture,
          }
        };
      });

      return res.send({
        status: true,
        message: messages.read.success,
        data: formattedData,
        userProfile: userProfile,
      });
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || messages.read.error
      });
    });
};



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


exports.isTopAudioCastMark = async (req, res) => {
  try {
    const filter = { isDeleted: false, _id: req.body.audioId };

    const audio = await Audio.findOne({
      _id: req.body.audioId,
      isDeleted: false,
    });

    const update = {
      isTopAudioCast: audio.isTopAudioCast === true ? false : true,
    };
    const options = { new: true };

    await Audio.findByIdAndUpdate(filter, update, options);

    return res.status(201).json({ status: true, code: "201", message: update.isTopAudioCast ? "Marked as top audio cast" : "Unmarked as top audio cast" });
  } catch (err) {
    return res.status(500).json({ status: false, code: "500", message: err.message || 'Internal Server Error' });
  }
}


//Top Doctor Audio Cast or Video Cast

exports.listOfTopAudioCastOrVideoCast = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";
    const searchData = (req.query.searchData || "").trim();
    const type = req.query.type;

    let filter = {};
    let model;
    let castType;

    if (type === '1') {
      // Audio Cast
      filter = { isTopAudioCast: true, isDeleted: false };
      model = Audio;
      castType = "audio";
    } else if (type === '2') {
      // Video Cast
      filter = { isTopVideoCast: true, isDeleted: false };
      model = Video;
      castType = "video";
    } else {
      return res.status(400).json({
        status: false,
        code: 400,
        message: "Invalid type provided. Use 1 for Audio and 2 for Video."
      });
    }

    const pipeline = [
      { $match: filter },
      { $sort: { _id: -1 } },
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
        $addFields: {
          title: { $ifNull: [`$title.${language}`, ""] },
          categoryName: { $ifNull: [`$categoryResult.name.${language}`, ""] },
          duration: { $ifNull: [`$duration.${language}`, ""] },
          featured_image: { $ifNull: [`$featured_image.${language}`, ""] }
        }
      },
      {
        $match: {
          $and: [
            { title: { $ne: "" } },
            { featured_image: { $ne: "" } },
            { categoryName: { $ne: "" } },
            { duration: { $ne: "" } },
          ]
        }
      }

    ];

    if (searchData) {
      pipeline.push({
        $match: {
          title: { $regex: searchData, $options: "i" }
        }
      });
    }

    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        duration: 1,
        createdAt: {
          $dateToString: {
            format: "%d-%m-%Y",
            date: "$createdAt",
            timezone: "Asia/Kolkata"
          }
        },
        categoryName: 1,
        featured_image: 1
      }
    });

    const result = await model.aggregate(pipeline);

    const finalData = result.map(item => ({
      _id: item._id,
      title: item.title.trim(),
      duration: item.duration,
      createdAt: item.createdAt,
      categoryName: item.categoryName.trim(),
      featured_image: item.featured_image
        ? `${process.env.IMAGE_BASE_URL}/uploads/${item.featured_image}`
        : null
    }));

    return res.status(200).json({ status: true, code: 200, message: `List of top ${castType} cast fetched successfully`, data: finalData });

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || "Internal Server Error" });
  }
};


//Audio Cast by Category

exports.audioCastByCategoryId = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";
    const searchData = (req.query.searchData || "").trim();

    const filter = {
      isDeleted: false,
      category: new mongoose.Types.ObjectId(req.query.categoryId),
    };

    const pipeline = [
      { $match: filter },
      { $sort: { _id: -1 } },
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
        $addFields: {
          title: { $ifNull: [`$title.${language}`, ""] },
          categoryName: { $ifNull: [`$categoryResult.name.${language}`, ""] },
          duration: { $ifNull: [`$duration.${language}`, ""] },
          featured_image: { $ifNull: [`$featured_image.${language}`, ""] }
        }
      },
    ];

    // Add dynamic search stage
    if (searchData) {
      pipeline.push({
        $match: {
          title: { $regex: searchData, $options: "i" }
        }
      });
    }

    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        duration: 1,
        categoryName: 1,
        featured_image: 1,
        createdAt: {
          $dateToString: {
            format: "%d-%m-%Y",
            date: "$createdAt",
            timezone: "Asia/Kolkata"
          }
        }
      }
    });

    const audioQuery = await Audio.aggregate(pipeline);

    const finalData = audioQuery.map(item => ({
      ...item,
      featured_image: item.featured_image ? `${process.env.IMAGE_BASE_URL}/uploads/${item.featured_image}` : null
    }));

    return res.status(200).json({ status: true, code: 200, message: "List of audio cast by category", data: finalData });

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
};



exports.detailsOfAudioCast = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";
    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.query.audioId)
    };

    const pipeline = [
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
          from: "audiolikes",
          localField: "_id",
          foreignField: "audio_id",
          as: "likeAudio"
        }
      },
      {
        $unwind: {
          path: "$likeAudio",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          isLiked: 1,
          title: { $ifNull: [`$title.${language}`, ""] },
          categoryName: { $ifNull: [`$categoryResult.name.${language}`, ""] },
          duration: { $ifNull: [`$duration.${language}`, ""] },
          featured_image: { $ifNull: [`$featured_image.${language}`, ""] },
          description: { $ifNull: [`$description.${language}`, ""] },
          source: { $ifNull: [`$source.${language}`, ""] },
          audio_link: { $ifNull: [`$audio_link.${language}`, ""] }
        }
      },
      {
        $match: {
          $and: [
            { title: { $ne: "" } },
            { categoryName: { $ne: "" } },
            { duration: { $ne: "" } },
            { featured_image: { $ne: "" } },
            { description: { $ne: "" } },
            { source: { $ne: "" } },
            { audio_link: { $ne: "" } },
          ]
        }
      },
      {
        $project: {
          title: 1,
          categoryName: 1,
          // duration: 1,
          featured_image: 1,
          description: 1,
          source: 1,
          audio_link: 1,
          likeCount: 1,
          commentCount: 1,
          contact_level: 1,
          isLiked: "$likeAudio.isLiked",
          createdAt: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$createdAt",
              timezone: "Asia/Kolkata"
            }
          }
        }
      }
    ];

    const audioData = await Audio.aggregate(pipeline);
    const data = audioData[0];

    if (data) {
      data.featured_image = data.featured_image ? `${process.env.IMAGE_BASE_URL}/uploads/${data.featured_image}` : null;
      data.audio_link = data.audio_link ? `${process.env.IMAGE_BASE_URL}/uploads/audio/${data.audio_link}` : null;
    }

    return res.status(200).json({ status: true, code: 200, message: "Details of audio cast", data: data || {} });

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
};



//List of all top video or audio cast filter category or contact level pending
exports.listOfAllTopAudioCastOrVideoCast = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";
    const searchData = (req.query.searchData || "").trim();
    const categoryNameFilter = (req.query.categoryName || "").trim();
    const contactLevelFilter = (req.query.contact_level || "").trim();

    if (req.query.doctorId === "") {
      const type = req.query.type;

      let filter = { isDeleted: false };
      let model;
      let castType;

      if (type === '1') {
        model = Audio;
        castType = "audio";
      } else if (type === '2') {
        model = Video;
        castType = "video";
      } else {
        return res.status(400).json({ status: false, code: 400, message: "Invalid type provided. Use 1 for Audio and 2 for Video." });
      }

      const pipeline = [
        { $match: filter },
        { $sort: { _id: -1 } },
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
          $addFields: {
            title: { $ifNull: [`$title.${language}`, ""] },
            categoryName: { $ifNull: [`$categoryResult.name.${language}`, ""] },
            duration: { $ifNull: [`$duration.${language}`, ""] },
            featured_image: { $ifNull: [`$featured_image.${language}`, ""] }
          }
        },
        {
          $match: {
            $and: [
              { title: { $ne: "" } },
              { categoryName: { $ne: "" } },
              { duration: { $ne: "" } },
              { featured_image: { $ne: "" } },
            ]
          }
        }
      ];

      // 🔍 Build dynamic filters
      const matchConditions = [];

      if (searchData) {
        matchConditions.push({ title: { $regex: searchData, $options: "i" } });
      }

      if (categoryNameFilter) {
        matchConditions.push({ categoryName: { $regex: categoryNameFilter, $options: "i" } }); // 🔍 Applied filter: categoryName
      }

      if (contactLevelFilter) {
        matchConditions.push({ contact_level: { $regex: contactLevelFilter, $options: "i" } }); // 🔍 Applied filter: contact_level
      }


      if (matchConditions.length > 0) {
        pipeline.push({ $match: { $and: matchConditions } });
      }

      // Final projection
      pipeline.push({
        $project: {
          _id: 1,
          title: 1,
          duration: 1,
          createdAt: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$createdAt",
              timezone: "Asia/Kolkata"
            }
          },
          categoryName: 1,
          contact_level: 1,
          featured_image: 1
        }
      });

      const result = await model.aggregate(pipeline);

      const finalData = result.map(item => ({
        _id: item._id,
        title: item.title.trim(),
        duration: item.duration,
        createdAt: item.createdAt,
        categoryName: item.categoryName.trim(),
        contact_level: item.contact_level,
        featured_image: item.featured_image
          ? `${process.env.IMAGE_BASE_URL}/uploads/${item.featured_image}`
          : null
      }));

      return res.status(200).json({
        status: true,
        code: 200,
        message: `List of top ${castType} cast fetched successfully`,
        data: finalData
      });
    } else {
      // const searchData = (req.query.searchData || "").trim();
      const doctorId = new mongoose.Types.ObjectId(req.query.doctorId);
      const typeQuery = req.query.type;

      // Step 1: Find doctor
      const doctorData = await Doctor.findOne({ _id: doctorId, isDeleted: false });
      // Step 2: Check if doctor has type 'article'
      if (!doctorData || !doctorData.type.includes("audiocast")) {
        return res.status(200).json({
          status: true,
          code: 200,
          message: "No audiocast found for this doctor",
          topAudiosCast: []
        });
      }

      if (!doctorData || !doctorData.type.includes("videocast")) {
        return res.status(200).json({
          status: true,
          code: 200,
          message: "No videocast found for this doctor",
          topVideoCast: []
        });
      }

      //Audio Cast
      if (typeQuery === '1') {
        const filter = {
          isDeleted: false,
          doctorId: doctorId,
        };

        const pipeline = [
          { $match: filter },
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
            $addFields: {
              localizedTitle: { $ifNull: [`$title.${language}`, ""] },
              localizedDuration: { $ifNull: [`$duration.${language}`, ""] },
              localizedfeatured_image: { $ifNull: [`$featured_image.${language}`, ""] },
              localizedDescription: { $ifNull: [`$description.${language}`, ""] },
              localizedCategoryName: { $ifNull: [`$categoryResult.name.${language}`, ""] }
            }
          },
          {
            $match: {
              $and: [
                { localizedTitle: { $ne: "" } },
                { localizedDuration: { $ne: "" } },
                { localizedCategoryName: { $ne: "" } },
                { localizedfeatured_image: { $ne: "" } },
                { localizedDescription: { $ne: "" } },
              ]
            }
          }
        ];

        // Apply search filter
        if (searchData) {
          pipeline.push({
            $match: {
              localizedTitle: { $regex: searchData, $options: "i" }
            }
          });
        }

        // 🔍 Apply optional filters for Audio
        const extraMatch = {};

        if (categoryNameFilter) {
          extraMatch.localizedCategoryName = { $regex: categoryNameFilter, $options: "i" }; // 🔍 Applied filter: categoryName
        }
        if (contactLevelFilter) {
          extraMatch.contact_level = { $regex: contactLevelFilter, $options: "i" }; // 🔍 Applied filter: contact_level
        }
        if (Object.keys(extraMatch).length) {
          pipeline.push({ $match: extraMatch }); // 🔍 Injected $match with categoryName/contactLevel
        }


        pipeline.push({
          $project: {
            _id: 1,
            title: "$localizedTitle",
            description: "$localizedDescription",
            featured_image: "$localizedfeatured_image",
            duration: "$localizedDuration",
            createdAt: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$createdAt",
                timezone: "Asia/Kolkata"
              }
            },
            categoryName: "$localizedCategoryName"
          }
        });

        const audios = await Audio.aggregate(pipeline);

        const finalData = audios.map(item => ({
          _id: item._id,
          title: item.title.trim(),
          description: item.description.trim(),
          createdAt: item.createdAt,
          duration: item.duration,
          categoryName: item.categoryName.trim(),
          image: item.featured_image ? `${process.env.IMAGE_BASE_URL}/uploads/${item.featured_image}` : ""
        }));

        return res.status(200).json({
          status: true,
          code: 200,
          message: "List of top audio fetched successfully",
          data: finalData
        });

      }
      //Video Cast
      if (typeQuery === '2') {
        const filter = {
          isDeleted: false,
          doctorId: doctorId,
        };

        const pipeline = [
          { $match: filter },
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
            $addFields: {
              localizedTitle: { $ifNull: [`$title.${language}`, ""] },
              localizedDuration: { $ifNull: [`$duration.${language}`, ""] },
              localizedfeatured_image: { $ifNull: [`$featured_image.${language}`, ""] },
              localizedDescription: { $ifNull: [`$description.${language}`, ""] },
              localizedCategoryName: { $ifNull: [`$categoryResult.name.${language}`, ""] }
            }
          },
          {
            $match: {
              $and: [
                { localizedTitle: { $ne: "" } },
                { localizedDuration: { $ne: "" } },
                { localizedCategoryName: { $ne: "" } },
                { localizedfeatured_image: { $ne: "" } },
                { localizedDescription: { $ne: "" } },
              ]
            }
          }
        ];

        // Apply search filter
        if (searchData) {
          pipeline.push({
            $match: {
              localizedTitle: { $regex: searchData, $options: "i" }
            }
          });
        }

        // 🔍 Apply optional filters for Video
        const extraMatch = {};

        if (categoryNameFilter) {
          extraMatch.localizedCategoryName = { $regex: categoryNameFilter, $options: "i" }; // 🔍 Applied filter: categoryName
        }
        if (contactLevelFilter) {
          extraMatch.contact_level = { $regex: contactLevelFilter, $options: "i" }; // 🔍 Applied filter: contact_level
        }
        if (Object.keys(extraMatch).length) {
          pipeline.push({ $match: extraMatch }); // 🔍 Injected $match with categoryName/contactLevel
        }


        pipeline.push({
          $project: {
            _id: 1,
            title: "$localizedTitle",
            duration: "$localizedDuration",
            description: "$localizedDescription",
            featured_image: "$localizedfeatured_image",
            createdAt: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$createdAt",
                timezone: "Asia/Kolkata"
              }
            },
            categoryName: "$localizedCategoryName"
          }
        });

        const videos = await Video.aggregate(pipeline);

        const finalData = videos.map(item => ({
          _id: item._id,
          title: item.title.trim(),
          description: item.description.trim(),
          createdAt: item.createdAt,
          duration: item.duration,
          categoryName: item.categoryName.trim(),
          image: item.featured_image ? `${process.env.IMAGE_BASE_URL}/uploads/${item.featured_image}` : ""
        }));

        return res.status(200).json({
          status: true,
          code: 200,
          message: "List of top video fetched successfully",
          data: finalData
        });
      }

    }

  } catch (err) {
    return res.status(500).json({
      status: false,
      code: 500,
      message: err.message || "Internal Server Error"
    });
  }
};

//List of top doctor video or audio cast not used
exports.listOfTopDoctAudioOrVideo = async (req, res) => {
  try {
    const language = req.query.language || req.headers['language'] || 'en';
    const searchData = (req.query.searchData || "").trim();
    const doctorId = new mongoose.Types.ObjectId(req.query.doctorId);
    const typeQuery = req.query.type;

    // Step 1: Find doctor
    const doctorData = await Doctor.findOne({ _id: doctorId, isDeleted: false });
    // Step 2: Check if doctor has type 'article'
    if (!doctorData || !doctorData.type.includes("audiocast")) {
      return res.status(200).json({
        status: true,
        code: 200,
        message: "No audiocast found for this doctor",
        topAudiosCast: []
      });
    }

    if (!doctorData || !doctorData.type.includes("videocast")) {
      return res.status(200).json({
        status: true,
        code: 200,
        message: "No videocast found for this doctor",
        topVideoCast: []
      });
    }

    //Audio Cast
    if (typeQuery === '1') {
      const filter = {
        isDeleted: false,
        doctorId: doctorId,
      };

      const pipeline = [
        { $match: filter },
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
          $addFields: {
            localizedTitle: { $ifNull: [`$title.${language}`, ""] },
            localizedfeatured_image: { $ifNull: [`$featured_image.${language}`, ""] },
            localizedDescription: { $ifNull: [`$description.${language}`, ""] },
            localizedCategoryName: { $ifNull: [`$categoryResult.name.${language}`, ""] }
          }
        },
        {
          $match: {
            $and: [
              { localizedTitle: { $ne: "" } },
              { localizedDescription: { $ne: "" } },
              { localizedCategoryName: { $ne: "" } },
              { localizedfeatured_image: { $ne: "" } }
            ]
          }
        }
      ];

      // Apply search filter
      if (searchData) {
        pipeline.push({
          $match: {
            localizedTitle: { $regex: searchData, $options: "i" }
          }
        });
      }

      pipeline.push({
        $project: {
          _id: 1,
          title: "$localizedTitle",
          description: "$localizedDescription",
          featured_image: "$localizedfeatured_image",

          createdAt: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$createdAt",
              timezone: "Asia/Kolkata"
            }
          },
          categoryName: "$localizedCategoryName"
        }
      });

      const audios = await Audio.aggregate(pipeline);

      const finalData = audios.map(item => ({
        _id: item._id,
        title: item.title.trim(),
        description: item.description.trim(),
        createdAt: item.createdAt,
        categoryName: item.categoryName.trim(),
        image: item.featured_image ? `${process.env.IMAGE_BASE_URL}/uploads/${item.featured_image}` : ""
      }));

      return res.status(200).json({
        status: true,
        code: 200,
        message: "List of top audio fetched successfully",
        topArticles: finalData
      });

    }
    //Video Cast
    if (typeQuery === '2') {
      const filter = {
        isDeleted: false,
        doctorId: doctorId,
      };

      const pipeline = [
        { $match: filter },
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
          $addFields: {
            localizedTitle: { $ifNull: [`$title.${language}`, ""] },
            localizedfeatured_image: { $ifNull: [`$featured_image.${language}`, ""] },
            localizedDescription: { $ifNull: [`$description.${language}`, ""] },
            localizedCategoryName: { $ifNull: [`$categoryResult.name.${language}`, ""] }
          }
        },
        {
          $match: {
            $and: [
              { localizedTitle: { $ne: "" } },
              { localizedDescription: { $ne: "" } },
              { localizedCategoryName: { $ne: "" } },
              { localizedfeatured_image: { $ne: "" } }
            ]
          }
        }
      ];

      // Apply search filter
      if (searchData) {
        pipeline.push({
          $match: {
            localizedTitle: { $regex: searchData, $options: "i" }
          }
        });
      }

      pipeline.push({
        $project: {
          _id: 1,
          title: "$localizedTitle",
          description: "$localizedDescription",
          featured_image: "$localizedfeatured_image",
          createdAt: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$createdAt",
              timezone: "Asia/Kolkata"
            }
          },
          categoryName: "$localizedCategoryName"
        }
      });

      const videos = await Video.aggregate(pipeline);

      const finalData = videos.map(item => ({
        _id: item._id,
        title: item.title.trim(),
        description: item.description.trim(),
        createdAt: item.createdAt,
        categoryName: item.categoryName.trim(),
        image: item.featured_image ? `${process.env.IMAGE_BASE_URL}/uploads/${item.featured_image}` : ""
      }));

      return res.status(200).json({
        status: true,
        code: 200,
        message: "List of top video fetched successfully",
        data: finalData
      });
    }

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}




