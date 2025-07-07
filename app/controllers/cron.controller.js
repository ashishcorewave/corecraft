const messages = require("../utility/messages")

const ArticleRead = require("../models/article.read.model.js")
const Badge = require("../models/badge.model.js")
const Comment = require("../models/comment.model.js")
const Rsvp = require("../models/rsvp.model.js")
const MagazineRead = require("../models/magazine.read.model.js")
const QuizResponse = require("../models/quiz.response.model.js")
const UserEngagement = require("../models/user.engagement.model.js")
const Users = require("../models/user.model.js")
const UserBadge = require("../models/user.badge.model.js")
const UserLikes = require("../models/userLike.model.js")
const UserPoint = require("../models/userPoint.model.js")
const UserPost = require("../models/userPost.models.js")
const NotificationModel = require("../models/notification.model.js")
const Event = require("../models/event.model");
const moment = require("moment")

exports.updateAppUsage = async (req, res) => {
	let getUsers = await Users.find({ isUpdated: 0 }, { _id: 1, points_used: 1 }, { limit: 10 }).lean();
	if (getUsers.length > 0) {
		for (var i = getUsers.length - 1; i >= 0; i--) {
			let user = getUsers[i];
			let points_used = user.points_used || 0
			let articles_read = await ArticleRead.countDocuments({ user_id: user._id })
			let magazines_read = await MagazineRead.countDocuments({ user_id: user._id })
			let quizzes_attempted = await QuizResponse.countDocuments({ user_id: user._id });
			let events_attended = await Rsvp.countDocuments({ user: user._id });
			let post_made = await UserPost.countDocuments({ user: user._id });
			let comments_made = await Comment.countDocuments({ created_by: user._id, isDeleted: false });
			// await UserPoint.create({user_id: user._id, points: 10})
			let points_earned = await UserPoint.aggregate([
				{
					$match: {
						user_id: user._id
					}
				},
				{
					$group: {
						_id: 1, points: { $sum: "$points" }
					}
				},
				{
					$project: {
						_id: 0,
						points: 1
					}
				}
			]);
			points_earned = points_earned.length > 0 ? points_earned[0]['points'] : 0
			let points_balance = points_earned - points_used
			let likes_received = await UserLikes.countDocuments({ user: user._id, isLiked: true });
			let badges_earned = await UserBadge.countDocuments({ user_id: user._id });
			let userEngagement = {
				user_id: user._id,
				articles_read,
				magazines_read,
				quizzes_attempted,
				events_attended,
				post_made,
				comments_made,
				points_earned,
				likes_received,
				badges_earned
			}
			await UserEngagement.findOneAndUpdate({ user_id: user._id }, userEngagement, { upsert: true, new: true, setDefaultsOnInsert: true })
			await Users.findOneAndUpdate({ _id: user._id }, { isUpdated: 1, points_earned, points_balance }, { new: true })
		}
	} else {
		await Users.updateMany({}, { $set: { isUpdated: 0 } })
	}
	res.send({
		status: true,
		message: messages.read.success
	})
}

exports.autoAssignBadge = async (req, res) => {
	let getUsers = await Users.find({ checkForNewBadge: 0 }, { magazines_read_count: 1, feed_comment_count: 1, feed_like_count: 1, feed_posted_count: 1, quiz_posted_count: 1, read_article_count: 1, points_earned: 1, points_used: 1, points_balance: 1, badgeCount: 1 }, { limit: 1 }).lean();

	if (getUsers.length > 0) {
		for (var i = getUsers.length - 1; i >= 0; i--) {
			let user = getUsers[i];
			let magazines_read_count = user.magazines_read_count || 0
			let feed_comment_count = user.feed_comment_count || 0
			let feed_like_count = user.feed_like_count || 0
			let feed_posted_count = user.feed_posted_count || 0
			let quiz_posted_count = user.quiz_posted_count || 0
			let read_article_count = user.read_article_count || 0
			let points_earned = user.points_earned || 0
			let points_used = user.points_used || 0
			let points_balance = user.points_balance || 0
			let badgeCount = user.badgeCount || 0
			if (magazines_read_count > 0) {
				let getUserBadges = await UserBadge.find({ user_id: user._id }, { badge_id: 1 }).lean()
				badgeCount = getUserBadges.length
				const badgeIds = getUserBadges.map(item => item.badge_id);
				let getBadge = await Badge.findOne({
					points: {
						$gt: 0,
						$lt: magazines_read_count
					}, _id: { $nin: badgeIds }, badgeType: "Read Magazine"
				}).lean();
				if (getBadge) {
					let badge_id = getBadge._id;
					let points = getBadge.points
					points_used = points_used + points
					points_balance = points_earned - points_used
					magazines_read_count = magazines_read_count - points
					await UserBadge.create({ user_id: user._id, badge_id, points })
				}
			}
			if (feed_comment_count > 0) {
				let getUserBadges = await UserBadge.find({ user_id: user._id }, { badge_id: 1 }).lean()
				badgeCount = getUserBadges.length
				const badgeIds = getUserBadges.map(item => item.badge_id);
				let getBadge = await Badge.findOne({
					points: {
						$gt: 0,
						$lt: feed_comment_count
					}, _id: { $nin: badgeIds }, badgeType: "Comment On Feed"
				}).lean();
				if (getBadge) {
					let badge_id = getBadge._id;
					let points = getBadge.points
					points_used = points_used + points
					points_balance = points_earned - points_used
					feed_comment_count = feed_comment_count - points
					await UserBadge.create({ user_id: user._id, badge_id, points })
				}
			}
			if (feed_like_count > 0) {
				let getUserBadges = await UserBadge.find({ user_id: user._id }, { badge_id: 1 }).lean()
				badgeCount = getUserBadges.length
				const badgeIds = getUserBadges.map(item => item.badge_id);
				let getBadge = await Badge.findOne({
					points: {
						$gt: 0,
						$lt: feed_like_count
					}, _id: { $nin: badgeIds }, badgeType: "Like On Feed"
				}).lean();
				if (getBadge) {
					let badge_id = getBadge._id;
					let points = getBadge.points
					points_used = points_used + points
					points_balance = points_earned - points_used
					feed_like_count = feed_like_count - points
					await UserBadge.create({ user_id: user._id, badge_id, points })
				}
			}
			if (feed_posted_count > 0) {
				let getUserBadges = await UserBadge.find({ user_id: user._id }, { badge_id: 1 }).lean()
				badgeCount = getUserBadges.length
				const badgeIds = getUserBadges.map(item => item.badge_id);
				let getBadge = await Badge.findOne({
					points: {
						$gt: 0,
						$lt: feed_posted_count
					}, _id: { $nin: badgeIds }, badgeType: "Feed Posted"
				}).lean();
				if (getBadge) {
					let badge_id = getBadge._id;
					let points = getBadge.points
					points_used = points_used + points
					points_balance = points_earned - points_used
					feed_posted_count = feed_posted_count - points
					await UserBadge.create({ user_id: user._id, badge_id, points })
				}
			}
			if (quiz_posted_count > 0) {
				let getUserBadges = await UserBadge.find({ user_id: user._id }, { badge_id: 1 }).lean()
				badgeCount = getUserBadges.length
				const badgeIds = getUserBadges.map(item => item.badge_id);
				let getBadge = await Badge.findOne({
					points: {
						$gt: 0,
						$lt: quiz_posted_count
					}, _id: { $nin: badgeIds }, badgeType: "Participate in Quiz"
				}).lean();
				if (getBadge) {
					let badge_id = getBadge._id;
					let points = getBadge.points
					points_used = points_used + points
					points_balance = points_earned - points_used
					quiz_posted_count = quiz_posted_count - points
					await UserBadge.create({ user_id: user._id, badge_id, points })
				}
			}
			if (read_article_count > 0) {
				let getUserBadges = await UserBadge.find({ user_id: user._id }, { badge_id: 1 }).lean()
				badgeCount = getUserBadges.length
				const badgeIds = getUserBadges.map(item => item.badge_id);
				let getBadge = await Badge.findOne({
					points: {
						$gt: 0,
						$lt: read_article_count
					}, _id: { $nin: badgeIds }, badgeType: "Read Article"
				}).lean();
				if (getBadge) {
					let badge_id = getBadge._id;
					let points = getBadge.points
					points_used = points_used + points
					points_balance = points_earned - points_used
					read_article_count = read_article_count - points
					await UserBadge.create({ user_id: user._id, badge_id, points })
				}
			}

			await Users.findOneAndUpdate({ _id: user._id }, { checkForNewBadge: 1, magazines_read_count, feed_comment_count, feed_like_count, feed_posted_count, quiz_posted_count, read_article_count, points_earned, points_used, points_balance, badgeCount }, { new: true })
		}
	} else {
		await Users.updateMany({}, { $set: { checkForNewBadge: 0 } })
	}
	res.send({
		status: true,
		message: messages.read.success
	})
}

exports.autoAssignBadgeOld = async (req, res) => {
	let getUsers = await Users.find({ checkForNewBadge: 0 }, { points_earned: 1, points_used: 1, points_balance: 1 }, { limit: 1 }).lean();

	if (getUsers.length > 0) {
		for (var i = getUsers.length - 1; i >= 0; i--) {
			let user = getUsers[i];
			let points_earned = user.points_earned || 0
			let points_used = user.points_used || 0
			let points_balance = user.points_balance || 0
			if (points_balance > 0) {
				let getUserBadges = await UserBadge.find({ user_id: user._id }, { badge_id: 1 }).lean()
				const badgeIds = []//getUserBadges.map(item => item.badge_id);
				let getBadge = await Badge.findOne({
					points: {
						$gt: 0,
						$lt: points_balance
					}, _id: { $nin: badgeIds }
				}).lean();
				if (getBadge) {
					let badge_id = getBadge._id;
					let points = getBadge.points
					points_used = points_used + points
					points_balance = points_earned - points_used
					// console.log(badge_id, "badgeId", points_earned, points, points_used, points_balance)
					await UserBadge.create({ user_id: user._id, badge_id, points })
				}
			}
			await Users.findOneAndUpdate({ _id: user._id }, { checkForNewBadge: 1, points_earned, points_used, points_balance }, { new: true })
		}
	} else {
		await Users.updateMany({}, { $set: { checkForNewBadge: 0 } })
	}
	res.send({
		status: true,
		message: messages.read.success
	})
}


exports.springer = async (req, res) => {
	const Springer = require("../models/springer.model.js")
	const Cursor = require("../models/cursor.model.js")
	let startPoint = await Cursor.findOne().lean();
	if (startPoint) {
		const api_key = "c3a37be96ee853a91da052441f701b67";
		const start = startPoint.start;
		const axios = require('axios/dist/node/axios.cjs'); // node
		const api_url = `http://api.springernature.com/openaccess/json?s=${start}&api_key=${api_key}`;
		let data = await axios.get(api_url);
		data = data.data
		// data = JSON.parse(data)
		if (data) {
			let result = data.result[0]
			// res.json({start: start,data: data});
			if (result.pageLength > 0) {
				let nextPage = start + parseInt(result.pageLength)
				let records = data.records
				await Springer.insertMany(records);
				await Cursor.findOneAndUpdate({ _id: startPoint._id }, { start: nextPage }, { new: true })
				res.json({ done: 1, start, nextPage });
			}
		}
	}

}
exports.eventRsvpNotification = async (req, res) => {
	res.send({ status: true, message: "Initiated" })
	let date1 = moment().add(1, 'day').format('YYYY-MM-DD')
	let date2 = moment().add(2, 'day').format('YYYY-MM-DD')
	// console.log("date", date1, date2);
	let event = await Event.findOne({ start_date: { $gt: new Date(date1 + "T00:00:00.000Z"), $lt: new Date(date2 + "T00:00:00.000Z") }, notified: false }).sort({ _id: -1 });
	// console.log("event", event);
	if (event) {
		let title = "Event coming tomorrow";
		let rsvp = await Rsvp.find({ event: event._id, isDeleted: false }).populate(['user']);
		if (rsvp && rsvp.length) {
			try {
				for (let i = 0; i < rsvp.length; i++) {
					//Send notification
					if (rsvp[i].user && rsvp[i].user.firebase_registration_token) {
						let detail = "Hi " + rsvp[i].user.first_name + " you have Event " + (event.title && event.title.en) + " to attend.";
						let noti = await NotificationModel.sendNotification(rsvp[i].user.firebase_registration_token, title, detail);
						let updRsvp = await Rsvp.updateOne({ _id: rsvp[i]._id }, { notified: true })
					}
				}
			} catch (err) {
				console.log('err on sending Notification', err)
			}
		}
		let updEvent = await Event.updateOne({ _id: event._id }, { notified: true })
	}
}
exports.userAgeUpdate = async (req, res) => {
	res.send({ status: true, message: "Initiated" })
	let year = moment().format("YYYY");
	// console.log('year', year);
	Users.find({ age: { $ne: "" }, lastAgeUpdate: { $ne: year } }, async function (err, res) {
		if (err) return console.log(err);
		if (res && res.length) {
			for (let i = 0; i < res.length; i++) {
				let createdYear = moment(res[i].createdAt).format('YYYY');
				// console.log('createdYear', createdYear);
				let newAge = res[i].age && parseInt(res[i].age) || "";
				// console.log('age', newAge);
				if (newAge && createdYear) {
					let diffYear = parseInt(year) - parseInt(createdYear);
					if (diffYear) {
						newAge += diffYear
					}
				}
				// console.log('newAge', newAge);
				let upd = await Users.updateOne({ _id: res[i]._id }, { age: newAge, lastAgeUpdate: parseInt(year) })
			}
		}
	}).limit(100)
}
exports.testNotification = async (req, res) => {
	let noti = await NotificationModel.sendNotification("dkNjMJlGSfKGpIHlOCQVHj:APA91bGpsdi8ZYxV7rliRrskl2XFeOx7wiVZ-DC1BLhBq0-4CLHf8KN95RiMbOWwAzOigSTp0uePmNt8uotFtoDFNvAocXTvxUvIDAYhs9KIplOI6288fAWbwwGUYpzpZEAcMa0JkrT9", "Test title", "Test message for notification");
	console.log(noti);
	res.send(null)
}

//Onetime Data Fix
exports.updateVideoSortOrder = async (req, res) => {
	const Video = require("../models/video.model.js")
	Video.find({}, async function (err, res) {
		if (err) return console.log(err);
		if (res && res.length) {
			for (let i = 0; i < res.length; i++) {
				let sortOrder = res[i].sort_order;
				let OldValue = res[i].sort_order.en && parseInt(res[i].sort_order.en) || 0;
				sortOrder.hi = OldValue
				sortOrder.mr = OldValue
				sortOrder.be = OldValue
				sortOrder.ka = OldValue
				
				let upd = await Video.updateOne({ _id: res[i]._id }, { sort_order: sortOrder})
			}
		}
	}).limit(200)
}
exports.updateVideoDuration = async (req, res) => {
	const Video = require("../models/video.model.js")
	Video.find({}, async function (err, res) {
		if (err) return console.log(err);
		if (res && res.length) {
			for (let i = 0; i < res.length; i++) {
				let durationData = res[i].duration
				let duration = res[i].duration;
				if(duration.en){
					if(duration.en.length > 5){
						durationData.en = duration.en.substring(0,5)
					}
				}
				if(duration.hi){
					if(duration.hi.length > 5){
						durationData.hi = duration.hi.substring(0,5)
					}
				}
				if(duration.mr){
					if(duration.mr.length > 5){
						durationData.mr = duration.mr.substring(0,5)
					}
				}
				if(duration.be){
					if(duration.be.length > 5){
						durationData.be = duration.be.substring(0,5)
					}
				}
				
				let upd = await Video.updateOne({ _id: res[i]._id }, { duration: durationData})
			}
		}
	}).limit(200)
}