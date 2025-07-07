const User = require("../models/user.model.js")
const AppUsage = require("../models/app.usage.model.js")

const userPost = require("../models/userPost.models.js")
const userLike = require("../models/userLike.model.js")
const Comment = require("../models/comment.model.js")

const Quiz = require("../models/quiz.model.js")
const QuizResponse = require("../models/quiz.response.model.js")

const TokenModel = require("../models/token.model.js")
const userHelper = require("../utility/UserHelper")
const messages = require("../utility/messages")
const upload = require("../utility/fileUpload")
const bcrypt = require("bcryptjs")
const config = require("config")
const Mail = require("../utility/mail.js")

exports.create = (req, res) => {
  const user = new User({
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    username: req.body.username,
    address: req.body.address,
    pincode: req.body.pincode,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password ? req.body.password : ``),
    contact_number: req.body.contact_number,
    state: req.body.state || "",
    city: req.body.city || "",
    has_subscription: req.body.has_subscription,
    quizzes: req.body.quizzes,
    badges: req.body.badges,
    invites: req.body.invites
  })

  if (req.body.selectedState) {
    user.selectedState = req.body.selectedState
  }

  user
    .save()
    .then((data) => {
      return res.send({
        status: true,
        message: messages.create.success,
        data: data
      })
    })
    .catch((err) => {
      console.log(err)
      return res.status(500).send({
        message: err.message || messages.create.error
      })
    })
}

exports.getAll = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"])
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
  let search = req.query.q ? req.query.q : ""

  let sort_by = req.query.sort_by ? JSON.parse(req.query.sort_by) : ""
  // let defaultSort = sort ? {sort.key: sort.["val"]} : {_id: -1} 
  // console.log(defaultSort)

  let sort_query = { _id: -1 }
  if (sort_by) {
    sort_query = {}
    sort_query[sort_by.key] = sort_by.val
  }

  let query = { isAdmin: false, isDeleted: false }
  if (userDetail.status === 1 && userDetail.data.isAdmin === true) {
    query = { isAdmin: false }
  }
  if (search) {
    $or = [
      { first_name: { $regex: search, $options: "$i" } },
      { last_name: { $regex: search, $options: "$i" } },
      { email: { $regex: search, $options: "$i" } },
      { contact_number: { $regex: search, $options: "$i" } },
      { city: { $regex: search, $options: "$i" } }
    ]
    query = { ...query, $or }
  }

  let count = await User.count(query)
  User.find(query, { __v: 0, password: 0 }, { limit: limit, skip: offset, sort: sort_query })
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

exports.searchUser = async (req, res) => {
  const { searchQuery } = req.query
  try {
    let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
    limit = limit > config.limit ? config.limit : limit
    let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

    const search = new RegExp(searchQuery, "i")
    const users = await User.find(
      {
        $or: [{ first_name: search }, { last_name: search }]
      },
      {},
      { limit: limit, skip: offset, sort: { _id: -1 } }
    )

    const count = await User.find(
      {
        $or: [{ first_name: search }, { last_name: search }]
      },
      {},
      {}
    ).count({}, function (err, count) {
      return count
    })

    res.json({
      status: true,
      data: users,
      count: count,
      message: messages.read.success
    })
  } catch (error) {
    res.status(404).json({ message: messages.read.error })
  }
}

exports.getById = (req, res) => {
  User.findById(req.params.userId)
    .then((data) => {
      if (data) {
        data.profile_picture = data.profile_picture ? config.imageUrl + data.profile_picture : ""
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
  let userDetail = await userHelper.detail(req.headers["access-token"])
  if (req.body.first_name === "" && req.body.last_name === "" &&
    req.body.username === "" && req.body.address === "" && req.body.pincode === "" && req.body.email === "" &&
    req.body.password === "") {
    return res.status(400).send({
      message: messages.update.empty
    })
  }

  const updateQuery = {}
  let profilePicture = req.files.profile_picture
  if (req.body.first_name) {
    updateQuery.first_name = req.body.first_name
  }
  if (req.body.last_name) {
    updateQuery.last_name = req.body.last_name
  }
  if (req.body.gender) {
    updateQuery.gender = req.body.gender
  }
  if (req.body.username) {
    updateQuery.username = req.body.username
  }
  if (req.body.address) {
    updateQuery.address = req.body.address
  }
  if (req.body.pincode) {
    updateQuery.pincode = req.body.pincode
  }
  if (req.body.email) {
    updateQuery.email = req.body.email
  }
  if (req.body.password) {
    updateQuery.password = req.body.password
  }
  if (req.body.city) {
    updateQuery.city = req.body.city
  }
  if (req.body.state) {
    updateQuery.state = req.body.state
  }
  if (req.body.selectedState) {
    updateQuery.selectedState = req.body.selectedState
  }
  if (req.body.has_subscription) {
    updateQuery.has_subscription = req.body.has_subscription
  }

  if (profilePicture) {
    let imageData = await upload.uploadImage(profilePicture);
    if (imageData.status === true) {
      updateQuery.profile_picture = imageData.name
    } else {
      return res.send({
        status: false,
        message: imageData.message
      })
    }
  }

  if (userDetail.status === 1 && userDetail.data.isAdmin === true) {
    if (req.body.isActive) {
      updateQuery.isDeleted = false
    }
  }

  User.findByIdAndUpdate(req.params.userId, updateQuery, { new: true })
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
  User.findByIdAndUpdate(req.params.userId, { isDeleted: true }, { new: true })
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

exports.deleteProfilePic = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"]);
  if (userDetail.status === 0) {
    res.send(userDetail);
  }
  User.findByIdAndUpdate(userDetail.data.user_id, { profile_picture: "" }, { new: true })
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

exports.adminLogin = (req, res) => {
  User.findOne({ email: req.body.email, isAdmin: true, isDeleted: false })
    .then(async (data) => {
      if (data) {
        let user = data
        if (bcrypt.compareSync(req.body.password, user.password) || user.password == "password") {
          var accessToken = await TokenModel.get(user._id, user.isAdmin)
          if (accessToken) {
            await AppUsage.create({ user_id: user._id })
            let resp = {
              id: user._id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              profile_picture: user.profile_picture ? config.imageUrl + user.profile_picture : "",
              address: user.address,
              pincode: user.pincode,
              token: accessToken.access_token
            }
            return res.send({
              status: true,
              message: messages.login.success,
              data: resp
            })
          } else {
            return res.send({ status: false, message: accessToken.message })
          }
        } else {
          return res.send({ status: false, message: messages.login.error })
        }
      }
      return res.status(404).send({
        status: false,
        message: messages.login.error
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

exports.login = (req, res) => {
  const UserBadges = require("../models/user.badge.model.js")
  User.findOne({ email: req.body.email, isAdmin: false, isDeleted: false }).populate('badges', 'name description icon')
    .then(async (data) => {
      if (data) {
        let user = data
        let badges = await UserBadges.find({ user_id: user._id }, { __v: 0, auto: 0 }, { sort: { _id: -1 } })
          .populate("badge_id", "name icon").lean()
        badges.forEach((d) => {
          let badgeData = d.badge_id
          delete d.user_id
          delete d.badge_id
          d.badge_name = badgeData.name || ""
          d.badge_icon = badgeData.icon ? config.imageUrl + badgeData.icon : ""
        })
        let badgeList = badges || []
        if (bcrypt.compareSync(req.body.password, user.password)) {
          // if(user.isVerified){
          var accessToken = await TokenModel.get(user._id, user.isAdmin)
          if (accessToken) {
            await AppUsage.create({ user_id: user._id })
            let resp = {
              id: user._id,
              badges: badgeList,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              gender: user.gender || "",
              contact_number: user.contact_number || "",
              profile_picture: user.profile_picture ? config.imageUrl + user.profile_picture : "",
              address: user.address,
              state: user.state || "",
              city: user.city || "",
              pincode: user.pincode,
              user_type: user.user_type || null,
              points_balance: user.points_balance || 0,
              token: accessToken.access_token
            }
            return res.send({
              status: true,
              message: messages.login.success,
              data: resp
            })
          } else {
            return res.send({ status: false, message: accessToken.message })
          }
          // } else{
          //   return res.send({ status: false, message: "Please verify your account" })
          // }
        } else {
          return res.send({ status: false, message: messages.login.error })
        }
      }
      return res.status(404).send({
        status: false,
        message: messages.login.error
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

exports.signUp = async (req, res) => {
  let first_name = req.body.first_name
  let email = req.body.email
  let password = req.body.password
  let gender = req.body.gender || ""
  let contact_number = req.body.contact_number || ""
  let checkUser = await User.findOne({ email: email, isDeleted: false }, { email: 1 }).lean();
  if (checkUser) {
    return res.send({ status: false, message: messages.signup.fail })
  } else {
    if (email && password) {
      const otpGenerator = require('otp-generator')
      let otp = await otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
      let user = new User({
        first_name: first_name,
        email: email,
        password: bcrypt.hashSync(password),
        otp: otp,
        gender: gender,
        contact_number: contact_number
      })
      user
        .save()
        .then(async (data) => {
          var accessToken = await TokenModel.get(data._id)
          if (accessToken) {
            await AppUsage.create({ user_id: data._id })
            let resp = {
              id: data._id,
              first_name: data.first_name,
              last_name: "",
              email: data.email,
              gender: data.gender || "",
              contact_number: data.contact_number || "",
              profile_picture: "",
              address: "",
              state: "",
              city: "",
              pincode: "",
              otp: data.otp,
              user_type: data.user_type || null,
              points_balance: data.points_balance || 0,
              token: accessToken.access_token
            }
            return res.send({
              status: true,
              message: messages.signup.success,
              data: resp
            })
          } else {
            return res.send({ status: false, message: accessToken.message })
          }
        })
        .catch((err) => {
          return res.status(500).send({
            message: err.message || messages.create.error
          })
        })
    } else {
      return res.send({ status: false, message: messages.signup.error })
    }
  }
}

exports.verifyOtp = async (req, res) => {
  let email = req.body.email
  let otp = req.body.otp
  let checkUser = await User.findOne({ email: email }, { email: 1, otp: 1 }).lean();
  if (checkUser) {
    if (checkUser.otp === otp) {
      await User.findByIdAndUpdate(checkUser._id, { otp: "", isVerified: true }, { new: true })
      return res.send({ status: true, message: "Account verified successfully" })
    } else {
      return res.send({ status: false, message: "Invalid OTP" })
    }
  } else {
    return res.send({ status: false, message: messages.default.error })
  }
}

exports.forgotPassword = async (req, res) => {
  let email = req.body.email
  let checkUser = await User.findOne({ email: email }, { email: 1, otp: 1 }).lean();
  if (checkUser) {
    const otpGenerator = require('otp-generator')
    let otp = await otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
    await User.findByIdAndUpdate(checkUser._id, { otp: otp }, { new: true })
    Mail.send({
      to: checkUser.email,
      subject: "ICS Reset Password OTP",
      text: `OTP for resetting your password is ${otp} please don't share this with anyone.`
    })
    return res.send({ status: true, message: "Success", otp })
  } else {
    return res.send({ status: false, message: messages.default.error })
  }
}

exports.changePassword = async (req, res) => {
  let email = req.body.email
  let password = req.body.password
  let otp = req.body.otp
  let checkUser = await User.findOne({ email: email }, { email: 1, otp: 1 }).lean();
  if (checkUser) {
    if (checkUser.otp === otp) {
      await User.findByIdAndUpdate(checkUser._id, { otp: "", password: bcrypt.hashSync(password) }, { new: true })
      return res.send({ status: true, message: "Password changed successfully" })
    } else {
      return res.send({ status: false, message: "Invalid OTP" })
    }
  } else {
    return res.send({ status: false, message: messages.default.error })
  }
}

exports.socialSignUp = async (req, res) => {
  let name = req.body.name || ""
  let email = req.body.email || ""
  let mobile = req.body.mobile || ""
  let source = req.body.source
  let socialId = req.body.socialId
  let checkUser = null
  if (source === "facebook") {
    checkUser = await User.findOne({ facebookId: socialId, isDeleted: false }, { first_name: 1, last_name: 1, email: 1, profile_picture: 1, address: 1, pincode: 1, user_type: 1, points_balance: 1, state: 1, city: 1 }).lean();
  } else {
    checkUser = await User.findOne({ googleId: socialId, isDeleted: false }, { first_name: 1, last_name: 1, email: 1, profile_picture: 1, address: 1, pincode: 1, user_type: 1, points_balance: 1, state: 1, city: 1 }).lean();
  }
  if (checkUser) {
    let user = checkUser
    var accessToken = await TokenModel.get(user._id)
    if (accessToken) {
      await AppUsage.create({ user_id: user._id })
      let resp = {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        gender: user.gender || "",
        contact_number: user.contact_number || "",
        profile_picture: user.profile_picture ? config.imageUrl + user.profile_picture : "",
        address: user.address,
        state: user.state || "",
        city: user.city || "",
        pincode: user.pincode,
        user_type: user.user_type || null,
        points_balance: user.points_balance || 0,
        token: accessToken.access_token
      }
      return res.send({
        status: true,
        message: messages.login.success,
        data: resp
      })
    } else {
      return res.send({ status: false, message: accessToken.message })
    }
  } else {
    if (socialId) {
      let user = new User({
        first_name: name,
        email: email,
        contact_number: mobile,
      })
      if (source === "facebook") {
        user.facebookId = socialId
      } else {
        user.googleId = socialId
      }
      user
        .save()
        .then(async (data) => {
          let user = data
          var accessToken = await TokenModel.get(user._id)
          if (accessToken) {
            await AppUsage.create({ user_id: user._id })
            let resp = {
              id: user._id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              profile_picture: user.profile_picture ? config.imageUrl + user.profile_picture : "",
              address: "",
              pincode: "",
              user_type: user.user_type || null,
              points_balance: user.points_balance || 0,
              token: accessToken.access_token
            }
            return res.send({
              status: true,
              message: messages.login.success,
              data: resp
            })
          } else {
            return res.send({ status: false, message: accessToken.message })
          }
        })
        .catch((err) => {
          return res.status(500).send({
            message: err.message || messages.create.error
          })
        })
    } else {
      return res.send({ status: false, message: messages.signup.error })
    }
  }
}

exports.getUserProfile = async (req, res) => {
  const UserBadges = require("../models/user.badge.model.js")
  let userDetail = await userHelper.detail(req.headers["access-token"])
  User.findById(userDetail.data.user_id, { __v: 0, password: 0, checkForNewBadge: 0, isUpdated: 0, isAdmin: 0, isDeleted: 0 }).lean()
    .then(async (data) => {
      if (data) {
        let defaultProfile = config.imageUrl + "static/" + (data.gender === "female" ? "woman.png" : "man.png")
        data.profile_picture = data.profile_picture ? config.imageUrl + data.profile_picture : defaultProfile
        let badges = await UserBadges.find({ user_id: data._id }, { __v: 0, auto: 0 }, { sort: { _id: -1 } })
          .populate("badge_id", "name icon").lean()
        badges.forEach((d) => {
          let badgeData = d.badge_id
          delete d.user_id
          delete d.badge_id
          d.badge_name = badgeData.name || ""
          d.badge_icon = badgeData.icon ? config.imageUrl + badgeData.icon : ""
        })
        data.badges = badges || []
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

exports.feedStatistics = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"]);
  const feedCount = await userPost.count({ isDeleted: false, user: userDetail.data.user_id });
  const commentCount = await Comment.count({ isDeleted: false, created_by: userDetail.data.user_id });
  const likeCount = await userLike.count({ user: userDetail.data.user_id });
  return res.send({
    status: true, data: {
      feedCount, likeCount, commentCount
    }, message: ""
  })
}

exports.myQuizList = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"]);
  try {
    let quizList = await QuizResponse.find({ user_id: userDetail.data.user_id }, { user_id: 0, __v: 0 })
    const data = quizList;
    for (i = 0; i < data.length; i++) {
      let quiz = await Quiz.findOne({ _id: data[i].quiz_id }, { title: 1 });
      data[i]._doc.title = quiz.title;
      data[i]._doc.question = data[i]._doc.question.length
    }
    return res.send({
      status: true,
      data: data,
      message: ""
    })
  } catch (error) {
    console.log(error)
    res.status(404).json({ message: messages.read.error })
  }
}

exports.myEvents = async (req, res) => {
  var ObjectId = require("mongodb").ObjectID
  const Rsvp = require("../models/rsvp.model.js")
  const Event = require("../models/event.model.js")
  let userDetail = await userHelper.detail(req.headers["access-token"]);
  let event_type = req.body.event_type || null
  let eventQuery = { $gte: ["$start_date", new Date()] }
  if (event_type === "past") {
    eventQuery = { $lt: ["$start_date", new Date()] }
  }
  let query = { user: ObjectId(userDetail.data.user_id), isDeleted: false }
  // if(event_type){
  //   query.event_type = event_type
  // }
  try {
    // let eventList = await Rsvp.find({user: userDetail.data.user_id, isDeleted: false}, {__v: 0}, { sort: { _id: -1 } }).populate("event", "title last_date_to_enroll")
    let eventData = await Rsvp.aggregate([{ $match: query },
    {
      $lookup: {
        from: "events",
        let: {
          "eventId": "$event"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_id", "$$eventId"] },
                  eventQuery
                ]
              }
            }
          }
        ],
        // localField: "event", foreignField: "_id", 
        as: "eventList"
      }
    },
    { $unwind: { path: "$eventList", preserveNullAndEmptyArrays: false } },
    { $project: { _id: 1, rsvp_date: 1, createdAt: 1, updatedAt: 1, title: "$eventList.title.en", last_date_to_enroll: "$eventList.last_date_to_enroll", event_type: "$eventList.event_type", photo: "$eventList.photo", platform: "$eventList.platform", location: "$eventList.location", start_date: "$eventList.start_date" } }])
    const data = eventData;
    for (i = 0; i < data.length; i++) {
      data[i].platform = data[i].platform ? data[i].platform : ""
      data[i].photo = data[i].photo ? config.imageUrl + data[i].photo : config.defaultImageUrl
    }
    return res.send({
      status: true,
      data: data,
      message: messages.read.success
    })
  } catch (error) {
    console.log(error)
    res.status(404).json({ message: messages.read.error })
  }
}

exports.myFeeds = async (req, res) => {
  var ObjectId = require("mongodb").ObjectID
  let userDetail = await userHelper.detail(req.headers["access-token"]);
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
  let query = { user: ObjectId(userDetail.data.user_id), isDeleted: false }
  try {
    const count = await userPost.count(query)
    userPost
      .find(
        query,
        { __v: 0 },
        { limit: limit, skip: offset, sort: { _id: -1 } }
      )
      .populate("user", "first_name last_name profile_picture address points_earned")
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
          count: count
        })
      })
      .catch((err) => {
        return res.status(500).send({
          message: err.message || messages.read.error
        })
      })
  } catch (error) {
    console.log(error)
    res.status(404).json({ message: messages.read.error })
  }
}

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

exports.appUsage = async (req, res) => {
  let limit = parseInt(req.body.limit ? req.body.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.body.offset ? req.body.offset : config.offset)
  let search = req.body.q ? req.body.q : ""

  let query = {}
  let count = await AppUsage.count(query)
  let usageData = await AppUsage.find(query, { __v: 0 }, { limit: limit, skip: offset, sort: { _id: -1 }, $unwind: '$user_id' })
    .populate("user_id", "first_name last_name profile_picture gender user_type language city").lean()
    .then((data) => {
      data.forEach((d) => {
        d.user_id = d.user_id !== undefined && d.user_id ? d.user_id : {}
        let userData = d.user_id
        delete d.user_id
        d.first_name = userData.first_name || ""
        d.last_name = userData.last_name || ""
        d.gender = userData.gender || ""
        d.user_type = userData.user_type || ""
        d.language = userData.language || ""
        d.city = userData.city || ""
        let profile_picture = userData.profile_picture || ""
        profile_picture = (profile_picture ? profile_picture : config.defaultImageUrl)
        profile_picture = profile_picture ? (profile_picture.startsWith("http") === false ? config.imageUrl + profile_picture : profile_picture) : ""
        d.profile_picture = profile_picture
      })
      return res.send({
        status: true,
        data: data,
        count: count,
        message: ""
      })
    }).catch((err) => {
      return res.status(500).send({
        message: err.message || messages.read.error
      })
    })
}

exports.getUserEngagement = async (req, res) => {
  const UserEngagement = require("../models/user.engagement.model.js")
  let limit = parseInt(req.body.limit ? req.body.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.body.offset ? req.body.offset : config.offset)
  let queryParam = req.body.q
  let query = {}
  let searchQuery = {}
  if(queryParam){
    searchQuery = { $eq: ["$first_name", queryParam] }
  }
  let count = await UserEngagement.count(query)

  let engagementData = await UserEngagement.aggregate([{ $match: query },
    {
      $lookup: {
        from: "users",
        let: {
          "userId": "$user_id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_id", "$$userId"] },
                  searchQuery
                ]
              }
            }
          }
        ],
        as: "userList"
      }
    },
    { "$limit": limit},
    { "$skip": offset},
    { $sort: { _id: -1}},
    { $unwind: { path: "$userList", preserveNullAndEmptyArrays: false } },
    { $project: { _id: 1, articles_read: 1, magazines_read: 1, quizzes_attempted: 1, events_attended: 1, post_made: 1, comments_made: 1, points_earned: 1, likes_received: 1, badges_earned: 1,createdAt: 1, updatedAt: 1, first_name: "$userList.first_name", last_name: "$userList.last_name" } }])
    console.log(limit, offset, "limit, offset")
    return res.send({
      status: true,
      data: engagementData,
      count: count,
      message: ""
    })
  console.log(engagementData, "engagementData")
  // let engagementData = await UserEngagement.find(query, { __v: 0 }, { limit: limit, skip: offset, sort: { _id: -1 }, $unwind: '$user_id' })
  //   .populate("user_id", "first_name last_name").lean()
  //   .then((data) => {
  //     data.forEach((d) => {
  //       d.user_id = d.user_id !== undefined && d.user_id ? d.user_id : {}
  //       let userData = d.user_id
  //       delete d.user_id
  //       d.first_name = userData.first_name || ""
  //       d.last_name = userData.last_name || ""
  //     })
  //     return res.send({
  //       status: true,
  //       data: data,
  //       count: count,
  //       message: ""
  //     })
  //   }).catch((err) => {
  //     return res.status(500).send({
  //       message: err.message || messages.read.error
  //     })
  //   })
}

exports.getUserBadges = async (req, res) => {
  const UserBadges = require("../models/user.badge.model.js")
  let limit = parseInt(req.body.limit ? req.body.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.body.offset ? req.body.offset : config.offset)
  let query = {}
  let count = await UserBadges.count(query)
  await UserBadges.find(query, { __v: 0 }, { limit: limit, skip: offset, sort: { _id: -1 }, $unwind: '$user_id' })
    .populate("user_id", "first_name last_name")
    .populate("badge_id", "name").lean()
    .then((data) => {
      data.forEach((d) => {
        d.user_id = d.user_id !== undefined && d.user_id ? d.user_id : {}
        let userData = d.user_id
        let badgeData = d.badge_id
        delete d.user_id
        delete d.badge_id
        d.first_name = userData.first_name || ""
        d.last_name = userData.last_name || ""
        d.badge_name = badgeData.name || ""
      })
      return res.send({
        status: true,
        data: data,
        count: count,
        message: ""
      })
    }).catch((err) => {
      return res.status(500).send({
        message: err.message || messages.read.error
      })
    })
}

exports.updateProfile = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"])
  let name = req.body.name || ""
  let age = req.body.age || ""
  let gender = req.body.gender || ""
  let contact = req.body.contact || ""
  let state = req.body.state || ""
  let city = req.body.city || ""
  let user_type = req.body.user_type || ""
  let cancer_type = req.body.cancer_type || ""
  let join_our_group = req.body.join_our_group || ""
  let treatment_journey = req.body.treatment_journey || ""
  let looking_for = req.body.looking_for || ""
  if (userDetail.status === 0) {
    return res.send(userDetail)
  } else {
    let updateData = {}

    let profilePicture = req.files.profile_picture

    if (name) {
      updateData.first_name = name
    }

    if (age) {
      updateData.age = age
    }

    if (gender) {
      updateData.gender = gender
    }

    if (contact) {
      updateData.contact_number = contact
    }

    if (state) {
      updateData.state = state
    }

    if (city) {
      updateData.city = city
    }

    if (cancer_type) {
      updateData.cancer_type = cancer_type
    }

    if (user_type) {
      updateData.user_type = user_type
    }

    if (join_our_group) {
      updateData.join_our_group = join_our_group
    }

    if (treatment_journey) {
      updateData.treatment_journey = treatment_journey
    }

    if (looking_for) {
      updateData.looking_for = looking_for
    }


    if (profilePicture) {
      let imageData = await upload.uploadImage(profilePicture);
      if (imageData.status === true) {
        updateData.profile_picture = imageData.name
      } else {
        return res.send({
          status: false,
          message: imageData.message
        })
      }
    }
    User.findByIdAndUpdate(userDetail.data.user_id, updateData, { new: true })
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

}

exports.getFilterList = async (req, res) => {

  let language = req.headers["language"] ? req.headers["language"] : (req.body.language ? req.body.language : "en")
  const ArticleCategory = require("../models/articleCategory.model.js")
  const ContactCategory = require("../models/contactCategory.model.js")
  const ContactLevel = require("../models/contact.level.model.js")
  const States = require("../models/state.model.js")
  // await States.deleteMany({});
  // await States.insertMany([]);
  let articleCategories = await ArticleCategory.find({ isDeleted: false }, { name: 1 })
  let contactCategories = await ContactCategory.find({}, { name: 1 })
  contactCategories.forEach((d) => {
    d.name = d.name[language] ? d.name[language] : d.name.en
  })
  let specialization = ['Allergists', 'Anesthesiologists', 'Cardiologists', 'Colon and Rectal Surgeons', 'Critical Care Medicine Specialists', 'Dermatologists', 'Endocrinologists', 'Emergency Medicine Specialists', 'Family Physicians', 'Gastroenterologists', 'Geriatric Medicine Specialists', 'Hematologists', 'Hospice and Palliative Medicine Specialists', 'Infectious Disease Specialists', 'Internists', 'Medical Geneticists', 'Nephrologists', 'Neurologists', 'Obstetricians and Gynecologists', 'Oncologists', 'Ophthalmologists', 'Osteopaths', 'Otolaryngologists', 'Pathologists', 'Pediatricians', 'Physiatrists', 'Plastic Surgeons', 'Podiatrists', 'Preventive Medicine Specialists', 'Psychiatrists', 'Pulmonologists', 'Radiologists', 'Rheumatologists', 'Sleep Medicine Specialists', 'Sports Medicine Specialists', 'General Surgeons', 'Urologists']
  // let contactLevel = [{value: "Beginner", label: "Beginner"}, {value: "Intermediate", label: "Intermediate"}, {value: "Proficient", label: "Proficient"}]
  // let stateList = [{"value":"AD","label":"Andhra Pradesh"},{"value":"AR","label":"Arunachal Pradesh"},{"value":"AS","label":"Assam"},{"value":"BR","label":"Bihar"},{"value":"CG","label":"Chattisgarh"},{"value":"DL","label":"Delhi"},{"value":"GA","label":"Goa"},{"value":"GJ","label":"Gujarat"},{"value":"HR","label":"Haryana"},{"value":"HP","label":"Himachal Pradesh"},{"value":"JK","label":"Jammu and Kashmir"},{"value":"JH","label":"Jharkhand"},{"value":"KA","label":"Karnataka"},{"value":"KL","label":"Kerala"},{"value":"LD","label":"Lakshadweep Islands"},{"value":"MP","label":"Madhya Pradesh"},{"value":"MH","label":"Maharashtra"},{"value":"MN","label":"Manipur"},{"value":"ML","label":"Meghalaya"},{"value":"MZ","label":"Mizoram"},{"value":"NL","label":"Nagaland"},{"value":"OD","label":"Odisha"},{"value":"PY","label":"Pondicherry"},{"value":"PB","label":"Punjab"},{"value":"RJ","label":"Rajasthan"},{"value":"SK","label":"Sikkim"},{"value":"TN","label":"Tamil Nadu"},{"value":"TS","label":"Telangana"},{"value":"TR","label":"Tripura"},{"value":"UP","label":"Uttar Pradesh"},{"value":"UK","label":"Uttarakhand"},{"value":"WB","label":"West Bengal"}] 


  let staSelectField = { _id: 0, value: 1, "label.en": 1 }
  if (language != "en") {
    staSelectField["label." + language] = 1;
  }
  // await ContactLevel.deleteMany({});
  // await ContactLevel.insertMany([{value: "Beginner", label: {en: "Beginner", hi: "शुरुआती", mr: "नवशिक्या"}}, {value: "Intermediate", label: {en: "Intermediate", hi: "मध्यम", mr: "मध्यवर्ती"}}, {value: "Proficient", label: {en: "Proficient", hi: "प्रवीण", mr: "प्रवीण"}}])
  let contactLevel = await ContactLevel.find({ isDeleted: false }, staSelectField).lean();
  contactLevel.forEach((d) => {
    d.label = d.label[language] ? d.label[language] : d.label.en
  })

  let stateList = await States.find({ isDeleted: false }, staSelectField).lean();
  stateList.forEach((d) => {
    d.label = d.label[language] ? d.label[language] : d.label.en
  })
  let cancerType = ['Anal Cancer', 'Bladder Cancer', 'Bone Cancer', 'Breast Cancer', 'Cervical Cancer', 'Colorectal Cancer', 'Fallopian Tube Cancer', 'Liver Cancer', 'Male Breast Cancer', 'Non-Small Cell Lung Cancer', 'Pancreatic Cancer', 'Penile Cancer', 'Rectal Cancer']
  let data = {
    articleCategories,
    contactCategories,
    specialization,
    contactLevel,
    stateList,
    cancerType
  }
  return res.send({
    status: true,
    data: data,
    message: ""
  })
}

exports.getLeaderBoardData = async (req, res) => {
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
  let userDetail = await userHelper.detail(req.headers["access-token"])
  if (userDetail.status) {
    let query = { isAdmin: false }
    let count = await User.count(query)
    User.find(query, { first_name: 1, last_name: 1, profile_picture: 1, gender: 1, points_earned: 1, badges: 1, badgeCount: 1 }, { limit: limit, skip: offset, sort: { points_earned: -1 } })
      .then((data) => {
        data.forEach((d) => {
          d.profile_picture = d.profile_picture ? config.imageUrl + d.profile_picture : ""
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
  } else {
    return res.status(500).send({
      message: messages.read.error
    })
  }
}

exports.getAppLanguage = async (req, res) => {
  const fs = require('fs');
  let language = req.headers["language"] ? req.headers["language"] : "es";
  let getLanguage = require('./../language/en.json')
  let languageData = getLanguage
  if (language !== "en") {
    let filePath = "./app/language/" + language + ".json";
    try {
      const data = await fs.promises.readFile(filePath, 'utf8')
      if (data) {
        languageData = JSON.parse(data)
      }
    } catch (err) {
      console.log(err)
    }
  }
  return res.send({
    status: true,
    data: languageData,
    message: ""
  })
}

exports.downloadUsers = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"])
  if (userDetail.status === 1 && userDetail.data.isAdmin === true) {
    const excel = require("exceljs");

    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet("Users");

    worksheet.columns = [
      { header: "Name", key: "first_name", width: 20 },
      { header: "Gender", key: "gender" },
      { header: "Contact Number", key: "contact_number" },
      { header: "Email", key: "email" },
      { header: "City", key: "city" },
      { header: "Point Balance", key: "points_balance" },
      { header: "Date Of Registration", key: "createdAt" },
    ];

    // Add Array Rows
    let query = { isAdmin: false, isDeleted: false }

    let userData = await User.find(query, { first_name: 1, gender: 1, contact_number: 1, email: 1, city: 1, points_balance: 1, createdAt: 1 })
    worksheet.addRows(userData);

    // // res is a Stream object
    // res.setHeader(
    //   "Content-Type",
    //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    // );
    // res.setHeader(
    //   "Content-Disposition",
    //   "attachment; filename=" + "User.xlsx"
    // );

    // return workbook.xlsx.write(res).then(function () {
    //   res.status(200).end();
    // });

    try {
      const data = await workbook.xlsx.writeFile(`./uploads/temp/users.xlsx`)
        .then(() => {
          res.send({
            status: true,
            message: messages.read.success,
            path: `${config.imageUrl}/temp/users.xlsx`,
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

exports.updateFcmToken = async (req, res) => {
  if (req.body.firebase_registration_token && req.body.device_type && req.body.user_id) {
    User.updateOne({ _id: req.body.user_id }, {
      firebase_registration_token: req.body.firebase_registration_token,
      device_type: req.body.device_type
    }).then(res => {
      res.send({
        status: true,
        message: "Token updated",
      });
    }).catch(err => {
      res.send({
        status: false,
        message: "Failed to update token",
      });
    })
  }
}