const Article = require("../models/article.model.js")
const Event = require("../models/event.model.js")
const Quiz = require("../models/quiz.model.js")
const User = require("../models/user.model.js")
const UserPost = require("../models/userPost.models.js")
const userHelper = require('../utility/UserHelper.js');

const messages = require("../utility/messages")
const config = require("config")

exports.adminDashboard = async (req, res) => {
  try {
    let [articles, events, quizzes, users, latestPosts] = await Promise.all([
      await Article.countDocuments(),
      await Event.countDocuments({ isDeleted: false }),
      await Quiz.countDocuments(),
      await User.countDocuments(),
      await UserPost.find({ isDeleted: false }, { __v: 0 }, { limit: 5, sort: { _id: -1 } }).populate('user', 'first_name last_name email').lean()
    ])
    let ongoingEvent = await Event.findOne({ isDeleted: false, isExpired: false, start_date: { $gte: new Date() } }, { "title.en": 1, "description.en": 1, photo: 1, start_date: 1, end_date: 1, location: 1, "venueDetail.en": 1 }, { $sort: -1 });
    if (ongoingEvent === null)
      ongoingEvent = await Event.findOne({ isDeleted: false, isExpired: false, start_date: { $lte: new Date() } }, { "title.en": 1, "description.en": 1, photo: 1, start_date: 1, end_date: 1, location: 1, "venueDetail.en": 1 }, { $sort: -1 });
    if (ongoingEvent) {
      ongoingEvent.title = ongoingEvent.title.en || ""
      ongoingEvent.description = ongoingEvent.description.en || ""
      ongoingEvent.venueDetail = ongoingEvent.venueDetail.en || ""
      ongoingEvent.photo = ongoingEvent.photo ? config.imageUrl + ongoingEvent.photo : ""
    }
    latestPosts = latestPosts.map(item => ({
      ...item,
      images: item.images.map(image => `${process.env.IMAGE_BASE_URL}/${image}`)
    }))
    let data = {
      articles,
      events,
      quizzes,
      users,
      latestPosts,
      ongoingEvent
    }
    return res.send({
      status: true,
      message: messages.create.success,
      data: data
    })
  } catch (e) {
    return res.send({
      status: false,
      message: messages.create.error,
      data: e.message
    })
  }
}

exports.updateUserEngagementData = async (req, res) => {
  let users = await User.find({ isUpdated: 0 }, { _id: 1 }, { limit: 1 }).lean()
  console.log(users)
  if (users.length > 0) {
    for (let inc = 0; inc < users.length; inc++) {
      let user = users[inc];
      let userId = user._id;
      //Event Attended - RSVP Count
      // await User.updateOne({ _id : userId }, { $set: {isUpdated: 1} });
    }
  }
  return res.send({
    status: true,
    message: messages.create.success
  })
}

exports.getCommunityFeeds = async (req, res) => {
  try {
    // Get user details from access token
    let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"]);
    let userRole = userDetail.role; // Assuming role is stored in userDetail

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
    const count = await UserPost.countDocuments(query);

    // Fetch posts sorted by newest first
    const posts = await UserPost
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
    return res.status(500).json({ message: error.message || "Internal Server Error", code: "500" });
  }
};

//  Community Manager Edit API
exports.editCommunityFeed = async (req, res) => {
  try {
    let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"]);
    const { feedId, ...updatedData } = req.body;

    if (!feedId) {
      return res.status(400).json({ error: "Feed ID is required", code: "400" });
    }

    const post = await UserPost.findById(feedId);
    if (!post) {
      return res.status(404).json({ error: "Post not found", code: "404" });
    }

    // Only Admins or Community Managers can edit posts
    if (userDetail.data.isAdmin === true) {
      const allowedUpdates = ["post", "images"]; // Fields CM can edit
      Object.keys(updatedData).forEach(key => {
        if (!allowedUpdates.includes(key)) {
          delete updatedData[key]; // Remove unauthorized updates
        }
      });

      Object.assign(post, updatedData);
      await post.save();

      return res.status(200).json({
        status: true,
        message: "Feed updated successfully by Admin",
        code: "201"
      });
    }

    return res.status(403).json({ error: "Unauthorized access", code: "403" });

  } catch (error) {
    return res.status(500).json({ message: error.message || "Error updating feed", code: "500" });
  }
};


