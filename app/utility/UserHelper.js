var jwt = require("jsonwebtoken")
var config = require("config")

const UserHelper = {
  detail: async function (token) {
    console.log(token,"Token");
    return new Promise(async (resolve) => {
      if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
          if (err) {
            var error = { status: 0, message: "Invalid token" }
            resolve(error)
          } else {
            resolve({ status: 1, message: "Valid User", data: decoded })
          }
        })
      } else {
        resolve({
          status: 0,
          message: "No token provided."
        })
      }
    })
  },
  assignPoint: async function (userId, activity_name = "", activity_id = null) {
    const Users = require("../models/user.model.js")
    const Point = require("../models/point.model.js")
    const UserPoint = require("../models/userPoint.model.js")
    let getUserDetail  = await Users.findOne({_id: userId}, {_id: 1}).lean();
    if(getUserDetail){
      let getPoint = await Point.findOne({activity_name}, {activity_name: 1, points: 1}).lean();
      if(getPoint){
        if(getPoint.activity_name === "Read Article"){
          await Users.updateOne({ _id: getUserDetail._id }, { $inc: { read_article_count: +getPoint.points } })
        }
        if(getPoint.activity_name === "Read Magazine"){
          await Users.updateOne({ _id: getUserDetail._id }, { $inc: { magazines_read_count: +getPoint.points } })
        }
        if(getPoint.activity_name === "Participate in Quiz"){
          await Users.updateOne({ _id: getUserDetail._id }, { $inc: { quiz_posted_count: +getPoint.points } })
        }
        if(getPoint.activity_name === "Feed Posted"){
          await Users.updateOne({ _id: getUserDetail._id }, { $inc: { feed_posted_count: +getPoint.points } })
        }
        if(getPoint.activity_name === "Like On Feed"){
          await Users.updateOne({ _id: getUserDetail._id }, { $inc: { feed_like_count: +getPoint.points } })
        }
        if(getPoint.activity_name === "Comment On Feed"){
          await Users.updateOne({ _id: getUserDetail._id }, { $inc: { feed_comment_count: +getPoint.points } })
        }
        if(activity_id){
          let checkUserPoints =  await UserPoint.find({user_id: getUserDetail._id, activity_id: activity_id});
          if(!checkUserPoints){
            await UserPoint.create({user_id: getUserDetail._id, point_id: getPoint._id, activity_id: activity_id, activity_name: getPoint.activity_name, points: getPoint.points})
          }
        }else{
          await UserPoint.create({user_id: getUserDetail._id, point_id: getPoint._id, activity_id: activity_id, activity_name: getPoint.activity_name, points: getPoint.points})
        }
      }
    }
  }
}
module.exports = UserHelper
