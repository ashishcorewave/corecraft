const Article = require("../models/article.model.js")
const Doctor = require('../models/doctor.model.js');
const ArticleComment = require("../models/article.comment.model.js")
const ArticleLike = require("../models/article.like.model.js")
const QuizResponse = require("../models/quiz.response.model.js")
const messages = require("../utility/messages")
const userHelper = require("../utility/UserHelper")
const User = require("../models/user.model.js")
const upload = require("../utility/fileUpload")
const config = require("config");
const mongoose = require('mongoose');
const { response } = require("express")

// Created New
exports.createArticle = async (req, res) => {
  try {
    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);
    const { title, description, content, tags, category, doctorId, contact_level, sort_order } = req.body;
    const language = req.headers["language"] || req.body.language;
    const newArticle = new Article({
      title: { [language]: title },
      description: { [language]: description },
      content: { [language]: content },
      tags: { [language]: tags },
      availableIn: language,
      category: category,
      doctorId: doctorId,
      contact_level: contact_level,
      sort_order: sort_order || 0,
      created_by: userDetail.data.user_id,
    });
    if (req.body.quiz) {
      newArticle.quiz = req.body.quiz
    };
    if (req.files && req.files.Img) {
      const ImgFile = req.files.Img;
      const imageData = await upload.uploadImage(ImgFile);
      if (imageData.status === true) {
        newArticle.Img = imageData.name;
      } else {
        return res.status(400).json({ status: false, message: imageData.message });
      }
    } else {
      return res.status(400).json({ status: false, message: 'A Img file is required.' });
    }
    await newArticle.save();
    return res.status(201).json({ code: "201", status: true, message: 'Article created successfully' });
  } catch (err) {
    return res.status(500).json({ status: false, messages: err.message || 'Internal Server Error' })
  }
}

//Created New
exports.getAll = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    const offset = +req.query.offset || 0;
    const perPage = +req.query.perPage || 10;
    const q = req.query.q || "";
    let count = await Article.countDocuments(filter)
    const language = req.query.language || req.headers["language"] || "en";
    const article = await Article.find().sort({ _id: -1 }).select("_id title isDeleted availableIn commentCount updatedAt createdAt isTopArticle Img ").lean();

    const filterArticle = article.filter((item) => {
      const articleInLang = item.title && item.title[language];
      if (!articleInLang) return false;
      if (q) {
        return articleInLang.toLowerCase().includes(q.toLowerCase());
      }
      return true;
    });

    const data = filterArticle.slice(offset, offset + perPage)
      .filter(item => item.title && item.title[language])
      .map(item => {
        return {
          _id: item._id,
          title: item.title[language],
          isTopArticle: item.isTopArticle,
          availableIn: item.availableIn,
          updatedAt: item.updatedAt,
          createdAt: item.createdAt,
          isDeleted: item.isDeleted,
          commentCount: item.commentCount,
          shortCode: language,
          Img: item.Img ? `${process.env.IMAGE_BASE_URL}/uploads/${item.Img}` : null
        };
      });
    return res.status(200).json({ status: true, code: "200", message: "Article filtered by language successfully", data, count: count });

  } catch (err) {
    return res.status(500).json({ status: false, message: err.message || "Internal Server Error" });
  }
}


//Created New
exports.getById = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";
    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.params.articleId),
    }

    const aggregationPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "quizzes",
          localField: "quiz",
          foreignField: "_id",
          as: "quizResult"
        }
      },
      {
        $project: {
          _id: 1,
          title: { $ifNull: [`$title.${language}`, ""] },
          description: { $ifNull: [`$description.${language}`, ""] },
          content: { $ifNull: [`$content.${language}`, ""] },
          tags: { $ifNull: [`$tags.${language}`, ""] },
          availableIn: 1,
          category: 1,
          contact_level: 1,
          quiz: 1,
          quizResult: {
            $map: {
              input: "$quizResult",
              as: "quiz",
              in: {
                _id: "$$quiz._id",
                title: { $ifNull: [`$$quiz.title.${language}`, ""] },
                description: { $ifNull: [`$$quiz.description.${language}`, ""] },
                Img: { $ifNull: [`$$quiz.Img.${language}`, ""] },
                questions: "$$quiz.questions",
                created_by: "$$quiz.created_by",
                isDeleted: "$$quiz.isDeleted",
                createdAt: "$$quiz.createdAt",
                updatedAt: "$$quiz.updatedAt"
              }
            }
          },
          sort_order: 1,
          readCount: 1,
          likeCount: 1,
          commentCount: 1,
          created_by: 1,
          isTopArticle: 1,
          doctorId: 1,
          isDeleted: 1,
          Img: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      }
    ];

    const articlesDetailsQuery = await Article.aggregate(aggregationPipeline);
    const item = articlesDetailsQuery[0];
    item.Img = item.Img ? `${process.env.BASE_URL}/uploads/${item.Img}` : null;
    return res.status(200).json({ status: true, code: 200, message: "Get Articles details Successfully", data: item });

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

//Created New
exports.update = async (req, res) => {
  try {
    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);

    const language = req.headers["language"] || req.body.language;
    if (!language) {
      return res.status(400).json({ status: false, message: "Language is required." });
    }

    const filter = {
      _id: req.params.articleId,
      isDeleted: false
    }

    if (!req.params.articleId) {
      return res.status(400).json({ status: false, message: "Article ID is required." });
    }

    const updateQuery = {};

    // Multilingual fields
    if (req.body.title) {
      updateQuery["title." + language] = req.body.title;
    }
    if (req.body.description) {
      updateQuery["description." + language] = req.body.description;
    }
    if (req.body.content) {
      updateQuery["content." + language] = req.body.content;
    }
    if (req.body.tags) {
      updateQuery["tags." + language] = req.body.tags;
    }

    // Add language to availableIn array if not present
    updateQuery.$addToSet = { availableIn: language };

    // Other fields
    if (req.body.category) {
      updateQuery.category = req.body.category;
    }
    if (req.body.doctorId) {
      updateQuery.doctorId = req.body.doctorId;
    }
    if (req.body.contact_level) {
      updateQuery.contact_level = req.body.contact_level;
    }
    if (req.body.sort_order !== undefined) {
      updateQuery.sort_order = req.body.sort_order;
    }
    if (req.body.quiz) {
      updateQuery.quiz = req.body.quiz;
    }

    updateQuery.updated_by = userDetail.data.user_id;

    // Optional image upload
    if (req.files && req.files.Img) {
      const ImgFile = req.files.Img;
      const imageData = await upload.uploadImage(ImgFile, "uploads/articles/");
      if (imageData.status === true) {
        updateQuery.Img = imageData.name;
      } else {
        return res.status(400).json({ status: false, message: imageData.message });
      }
    }

    const updatedArticle = await Article.findOneAndUpdate(filter, updateQuery, { new: true });

    if (!updatedArticle) {
      return res.status(404).json({ status: false, message: "Article not found" });
    }
    return res.status(200).json({ status: true, message: "Article updated successfully" });
  } catch (err) {
    console.error("Error in updating article:", err);
    return res.status(500).json({ status: false, message: err.message || "Internal Server Error" });
  }
};


//Created New



exports.delete = async (req, res) => {
  try {
    const articleId = req.params.articleId;

    // Step 1: Find the article by ID
    const article = await Article.findById(articleId);

    // Step 2: Toggle isDeleted
    const newIsDeletedStatus = !article.isDeleted;

    // Step 3: Update the article
    article.isDeleted = newIsDeletedStatus;
    await article.save();

    return res.status(200).json({
      status: true,
      code: 200,
      message: newIsDeletedStatus ? "Article marked as deleted" : "Article restored successfully",
      data: { isDeleted: newIsDeletedStatus }
    });

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
};

exports.searchArticle = async (req, res) => {
  const { searchQuery } = req.query
  try {
    let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
    limit = limit > config.limit ? config.limit : limit
    let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

    const search = new RegExp(searchQuery, "i")
    const count = await Article.count({
      $or: [{ title: search }, { content: search }]
    })

    await Article.find(
      {
        $or: [{ title: search }, { content: search }]
      },
      {},
      { limit: limit, skip: offset, sort: { _id: -1 } }
    ).then((data) => {
      data.forEach((d) => {
        d.Img = d.Img ? config.imageUrl + d.Img : ""
      })

      return res.send({
        status: true,
        message: messages.read.success,
        data: data,
        count: count
      })
    })
  } catch (error) {
    res.status(404).json({ message: messages.read.error })
  }
}

exports.readArticle = async (req, res) => {
  const ArticleRead = require("../models/article.read.model.js")
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])

  let postId = req.body.article_id
  let getPost = await Article.findOne({ _id: postId }, { _id: 1 });
  if (getPost) {
    const read = new ArticleRead({
      user_id: userDetail.data.user_id,
      article_id: postId
    })

    read
      .save()
      .then(async (data) => {
        await Article.updateOne({ _id: postId }, { $inc: { readCount: +1 } })
        await userHelper.assignPoint(userDetail.data.user_id, "Read Article")
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

exports.reportArticle = async (req, res) => {
  const ArticleReport = require("../models/article.report.model.js")
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])

  let postId = req.body.article_id
  let reportText = req.body.reportText || ""
  let getPost = await Article.findOne({ _id: postId }, { _id: 1 });
  if (getPost) {
    const report = new ArticleReport({
      user_id: userDetail.data.user_id,
      article_id: postId,
      report_text: reportText
    })

    read
      .save()
      .then(async (data) => {
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

exports.createComment = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers['authorization']);
  if (userDetail.status === 0) {
    return res.send(userDetail)
  }

  let postId = req.body.article_id
  let parentId = req.body.parent_id
  let getPost = await Article.findOne({ _id: postId })
  if (getPost) {
    const comments = new ArticleComment({
      body: req.body.body,
      article: postId,
      parent_id: parentId,
      created_by: userDetail.data.user_id
    })

    comments
      .save()
      .then(async (data) => {
        await Article.updateOne({ _id: postId }, { $inc: { commentCount: +1 } })
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
  if (req.query.article_id) {
    query.article = req.query.article_id
  }
  if (req.query.comment_id) {
    query.parent_id = req.query.comment_id
  }
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
  ArticleComment.find(query, {}, { limit: limit, skip: offset, sort: { _id: -1 } })
    .populate("article", "title")
    .populate("created_by", "first_name last_name profile_picture")
    .lean()
    .then((data) => {
      data.forEach((d) => {
        let article = d.article !== undefined && d.article ? d.article : {}
        delete d.article
        d.article = article._id || ""
        d.title = article.title || ""
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
  ArticleComment.findByIdAndUpdate(req.params.commentId, { isDeleted: true }, { new: true })
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

exports.uploadArticleImage = async (req, res) => {

  let articleImage = req.files.image
  if (articleImage) {
    let imageData = await upload.uploadImage(articleImage, "uploads/article/");
    if (imageData.status === true) {
      res.send({
        status: true,
        filename: config.articleImageUrl + imageData.name
      })
    } else {
      return res.send({
        status: false,
        filename: messages.read.error,
        message: imageData.message
      })
    }
  } else {
    res.send({
      status: false,
      filename: messages.read.error
    })
  }
}

exports.likeArticle = async (req, res) => {
  console.log("Hello hllo hello");
  console.log(req.headers, "Headers");
  const token = req.headers['access-token'] || req.headers['authorization'];
  const userDetail = await userHelper.detail(token);
  // let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])
  if (userDetail.status === 0) {
    return res.send(userDetail)
  }
  let postId = req.body.article_id
  let getPost = await Article.findOne({ _id: postId })
  if (getPost) {
    let isLiked = await ArticleLike.findOne({
      article_id: postId,
      user_id: userDetail.data.user_id
    })
    if (isLiked === null) {
      const like = new ArticleLike({
        article_id: postId,
        user_id: userDetail.data.user_id
      })
      like
        .save()
        .then(async (data) => {
          await Article.updateOne({ _id: postId }, { $inc: { likeCount: +1 } })
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
      ArticleLike
        .findByIdAndUpdate(
          isLiked._doc._id,
          { isLiked: isLiked._doc.isLiked ? false : true },
          { new: true }
        )
        .then(async (data) => {
          await Article.updateOne(
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
  let isLiked = await ArticleLike.findOne({
    user_id: userDetail.user_id,
    article_id: postId,
    isLiked: true
  })
  if (isLiked) {
    return true
  } else {
    return false
  }
}

exports.isQuizCompleted = async (userDetail, data) => {
  let quizId = data.quiz && data.quiz.length > 0 ? data.quiz[0]._id : null
  let getQuizResp = await QuizResponse.findOne({
    user_id: userDetail.user_id,
    quiz_id: quizId
  })
  if (getQuizResp) {
    return true
  } else {
    return false
  }
}


exports.isTopArticlesMarks = async (req, res) => {
  try {
    const filter = { isDeleted: false, _id: req.body.articalId };

    const article = await Article.findOne({
      _id: req.body.articalId,
      isDeleted: false,
    });

    const update = {
      isTopArticle: article.isTopArticle === true ? false : true,
    };
    const options = { new: true };

    await Article.findByIdAndUpdate(filter, update, options);

    return res.status(201).json({ status: true, code: "201", message: update.isTopArticle ? "Marked as top article" : "Unmarked as top article" });
  } catch (err) {
    return res.status(500).json({ status: false, code: "500", message: err.message || 'Internal Server Error' });
  }
}

//List of top Doctor artilcle

exports.listOfTopDoctorArticles = async (req, res) => {
  try {
    const language = req.query.language || req.headers['language'] || 'en';
    const searchData = (req.query.searchData || "").trim();
    const filter = {
      isDeleted: false,
      doctorId: new mongoose.Types.ObjectId(req.query.doctorId)
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
          localizedDescription: { $ifNull: [`$description.${language}`, ""] },
          localizedCategoryName: { $ifNull: [`$categoryResult.name.${language}`, ""] }
        }
      }
    ];

    // Apply search if searchData exists
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
        image: "$Img",
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

    const articles = await Article.aggregate(pipeline);

    const finalData = articles.map(item => ({
      _id: item._id,
      title: item.title.trim(),
      description: item.description.trim(),
      createdAt: item.createdAt,
      categoryName: item.categoryName.trim(),
      image: item.image ? `${process.env.IMAGE_BASE_URL}/uploads/${item.image}` : ""
    }));
    return res.status(200).json({ status: true, code: "200", message: "List of top articles fetched successfully", topArticles: finalData });
  } catch (err) {
    return res.status(500).json({ status: false, code: "500", message: err.message || 'Internal Server Error' });
  }
};



exports.detailsOfArticle = async (req, res) => {
  try {
    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);
    const language = req.query.language || req.headers["language"] || "en";
    const userId = userDetail.data.user_id; // 👈 Make sure this is passed

    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.query.articleId),
    };
    console.log(filter, "Filter");

    const pipeline = [
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryResult",
        },
      },
      {
        $unwind: {
          path: "$categoryResult",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorResult",
        },
      },
      {
        $unwind: {
          path: "$doctorResult",
          preserveNullAndEmptyArrays: true,
        },
      },
      // ✅ Article Like Lookup by userId
      {
        $lookup: {
          from: "articlelikes",
          let: {
            articleId: "$_id",
            userId: new mongoose.Types.ObjectId(userId),
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$article_id", "$$articleId"] },
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$isLiked", true] },
                  ],
                },
              },
            },
          ],
          as: "likeArticleResult",
        },
      },
      {
        $addFields: {
          isLiked: { $gt: [{ $size: "$likeArticleResult" }, 0] },
        },
      },
      {
        $project: {
          _id: 1,
          title: "$title",
          description: "$description",
          image: "$Img",
          createdAt: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            },
          },
          categoryName: "$categoryResult.name",
          authorName: "$doctorResult.doctorName",
          likeCount: 1,
          doctorImage: "$doctorResult.doctorImage",
          isLiked: 1,
        },
      },
    ];

    const result = await Article.aggregate(pipeline);

    if (!result.length) {
      return res.status(404).json({
        status: false,
        code: "404",
        message: "Article not found",
        articlesDetails: null,
      });
    }

    const article = result[0];

    // Dynamically fetch based on language with fallback
    const title = article.title?.[language] || "";
    const description = article.description?.[language] || "";
    const image = article.image || "";
    const categoryName = article.categoryName?.[language] || "";
    const authorName = article.authorName?.[language] || "";
    const finalData = {
      _id: article._id,
      title: title.trim(),
      description: description.trim(),
      categoryName: categoryName.trim(),
      createdAt: article.createdAt,
      authorName: authorName,
      likeCount: article.likeCount || 0,
      image: image ? `${process.env.IMAGE_BASE_URL}/uploads/${image}` : null,
      doctorImage: article.doctorImage ? `${process.env.IMAGE_BASE_URL}/uploads/${article.doctorImage}` : null,
      isLiked: article.isLiked,
    };

    return res.status(200).json({
      status: true,
      code: "200",
      message: "Details of article fetched successfully",
      articlesDetails: finalData,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      code: "500",
      message: err.message || "Internal Server Error",
    });
  }
};


exports.ArticleByCategory = async (req, res) => {
  try {
    const language = req.query.language || req.headers['language'] || 'en';

    const filter = {
      isDeleted: false,
      category: new mongoose.Types.ObjectId(req.query.categoryId)
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
        $project: {
          _id: 1,
          title: "$title",
          description: "$description",
          image: "$Img",
          createdAt: {
            $dateToString: {
              format: "%d-%m-%Y",
              date: "$createdAt",
              timezone: "Asia/Kolkata"
            }
          },
          categoryName: "$categoryResult.name"
        }
      }
    ];

    const articles = await Article.aggregate(pipeline);

    const finalData = articles
      .map(item => {
        const title = item.title?.[language] || "";
        const description = item.description?.[language] || "";
        const image = item.image;
        const categoryName = item.categoryName?.[language] || "";

        return {
          _id: item._id,
          title: title.trim(),
          description: description.trim(),
          createdAt: item.createdAt,
          categoryName: categoryName.trim(),
          image: image ? `${process.env.IMAGE_BASE_URL}/uploads/${image}` : ""
        };
      })
      .filter(item => item.title);

    return res.status(200).json({ status: true, code: "200", message: "List of top articles fetched successfully", topArticles: finalData });

  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message })
  }
}


exports.listOfTopArticles = async (req, res) => {
  try {
    const language = req.query.language || req.headers['language'] || 'en';
    const searchData = (req.query.searchData || "").trim();
    const filter = {
      isDeleted: false,
      isTopArticle: true
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
          localizedDescription: { $ifNull: [`$description.${language}`, ""] },
          localizedCategoryName: { $ifNull: [`$categoryResult.name.${language}`, ""] }
        }
      }
    ];

    // Apply search if searchData exists
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
        image: "$Img",
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

    const articles = await Article.aggregate(pipeline);

    const finalData = articles.map(item => ({
      _id: item._id,
      title: item.title.trim(),
      description: item.description.trim(),
      createdAt: item.createdAt,
      categoryName: item.categoryName.trim(),
      image: item.image ? `${process.env.IMAGE_BASE_URL}/uploads/${item.image}` : ""
    }));
    return res.status(200).json({ status: true, code: "200", message: "List of top articles fetched successfully", topArticles: finalData });
  } catch (err) {
    return res.status(500).json({ status: false, code: "500", message: err.message || 'Internal Server Error' });
  }
};


const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // months are zero-based
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

//List of All Articles 
exports.listOfAllArticles = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";
    const searchData = (req.query.searchData || "").trim();
    const type = req.query.type;
    const id = req.query.id;
    const categoryNameFilter = (req.query.categoryName || "").trim();
    const contactLevelFilter = (req.query.contact_level || "").trim();

    if (type && id) {
      const objectId = new mongoose.Types.ObjectId(id);

      // TYPE 0: Doctor-wise articles
      if (type === "0") {
        const pipeline = [
          { $match: { doctorId: objectId, isDeleted: false } },
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
              localizedDescription: { $ifNull: [`$description.${language}`, ""] },
              localizedCategoryName: { $ifNull: [`$categoryResult.name.${language}`, ""] }
            }
          }
        ];

        // Filters
        const matchConditions = [];

        if (searchData) {
          matchConditions.push({ localizedTitle: { $regex: searchData, $options: "i" } });
        }

        if (categoryNameFilter) {
          matchConditions.push({ localizedCategoryName: { $regex: categoryNameFilter, $options: "i" } });
        }

        if (contactLevelFilter) {
          matchConditions.push({ contact_level: { $regex: contactLevelFilter, $options: "i" } });
        }

        if (matchConditions.length > 0) {
          pipeline.push({ $match: { $and: matchConditions } });
        }

        pipeline.push({
          $project: {
            _id: 1,
            title: "$localizedTitle",
            description: "$localizedDescription",
            image: "$Img",
            contact_level: 1,
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

        const articles = await Article.aggregate(pipeline);

        const finalDoctorArticles = articles.map(item => ({
          _id: item._id,
          title: item.title.trim(),
          description: item.description.trim(),
          createdAt: item.createdAt,
          categoryName: item.categoryName.trim(),
          contact_level: item.contact_level,
          image: item.image ? `${process.env.IMAGE_BASE_URL}/uploads/${item.image}` : ""
        }));
        return res.status(200).json({
          status: true,
          code: "200",
          message: "List of top articles fetched successfully",
          data: finalDoctorArticles
        });
      }

      // TYPE 1: Category-wise articles
      if (type === "1") {
        const filter = {
          isDeleted: false,
          category: new mongoose.Types.ObjectId(req.query.id)
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
              localizedDescription: { $ifNull: [`$description.${language}`, ""] },
              localizedCategoryName: { $ifNull: [`$categoryResult.name.${language}`, ""] }
            }
          }
        ];

        // Filters
        const matchConditions = [];

        if (searchData) {
          matchConditions.push({ localizedTitle: { $regex: searchData, $options: "i" } });
        }

        if (categoryNameFilter) {
          matchConditions.push({ localizedCategoryName: { $regex: categoryNameFilter, $options: "i" } });
        }

        if (contactLevelFilter) {
          matchConditions.push({ contact_level: { $regex: contactLevelFilter, $options: "i" } });
        }

        if (matchConditions.length > 0) {
          pipeline.push({ $match: { $and: matchConditions } });
        }

        pipeline.push({
          $project: {
            _id: 1,
            title: "$localizedTitle",
            description: "$localizedDescription",
            image: "$Img",
            contact_level: 1,
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

        const articles = await Article.aggregate(pipeline);

        const finalData = articles.map(item => ({
          _id: item._id,
          title: item.title.trim(),
          description: item.description.trim(),
          createdAt: item.createdAt,
          categoryName: item.categoryName.trim(),
          contact_level: item.contact_level,
          image: item.image ? `${process.env.IMAGE_BASE_URL}/uploads/${item.image}` : ""
        }));

        return res.status(200).json({
          status: true,
          code: "200",
          message: "Category articles fetched successfully",
          data: finalData
        });
      }
    }

    // Default listing (no type/id)
    const filter = { isDeleted: false };

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
          localizedTitle: {
            $ifNull: [
              { $getField: { field: language, input: "$title" } },
              ""
            ]
          },
          localizedDescription: {
            $ifNull: [
              { $getField: { field: language, input: "$description" } },
              ""
            ]
          },
          localizedCategoryName: {
            $ifNull: [
              { $getField: { field: language, input: "$categoryResult.name" } },
              ""
            ]
          }
        }
      }
    ];

    const matchConditions = [];

    if (searchData) {
      matchConditions.push({
        $or: [
          { localizedTitle: { $regex: searchData, $options: "i" } },
          { localizedCategoryName: { $regex: searchData, $options: "i" } },
          { localizedDescription: { $regex: searchData, $options: "i" } }
        ]
      });
    }

    if (categoryNameFilter) {
      matchConditions.push({
        localizedCategoryName: { $regex: categoryNameFilter, $options: "i" }
      });
    }

    if (contactLevelFilter) {
      matchConditions.push({
        contact_level: { $regex: contactLevelFilter, $options: "i" }
      });
    }

    if (matchConditions.length > 0) {
      pipeline.push({ $match: { $and: matchConditions } });
    }

    pipeline.push({
      $project: {
        _id: 1,
        title: "$localizedTitle",
        description: "$localizedDescription",
        image: "$Img",
        contact_level: 1,
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

    const articles = await Article.aggregate(pipeline);

    const finalData = articles.map(item => ({
      _id: item._id,
      title: item.title.trim(),
      description: item.description.trim(),
      createdAt: item.createdAt,
      contact_level: item.contact_level,
      categoryName: item.categoryName.trim(),
      image: item.image ? `${process.env.IMAGE_BASE_URL}/uploads/${item.image}` : ""
    }));

    return res.status(200).json({
      status: true,
      code: "200",
      message: "List of all articles fetched successfully",
      data: finalData
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      code: 500,
      message: err.message || "Internal Server Error"
    });
  }
};


