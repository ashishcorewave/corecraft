const Event = require("../models/event.model.js")
const EventLike = require("../models/event.like.model.js")
const EventBookmark = require("../models/event.bookmark.model.js")
const Rsvp = require("../models/rsvp.model.js")
const messages = require("../utility/messages")
const userHelper = require("../utility/UserHelper")
const upload = require("../utility/fileUpload")
const config = require("config")
const isUrl = require("is-url")
const path = require('path');

exports.create = async (req, res) => {
  try {
    const { start_date, end_date, last_date_to_enroll, meeting_link } = req.body;
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    // const lastDateToEnroll = new Date(last_date_to_enroll);

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "Invalid start date format provided" });
    }
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Invalid end date format provided" });
    }
    // if (isNaN(lastDateToEnroll.getTime())) {
    //   return res.status(400).json({ message: "Invalid last date to enroll format provided" });
    // }

    if (startDate >= endDate) {
      return res.status(400).json({ message: "End date must be greater than start date" });
    }

    // if (lastDateToEnroll >= startDate) {
    //   return res.status(400).json({ message: "Last date to enroll must be before start date" });
    // }

    if (meeting_link && !isUrl(meeting_link)) {
      return res.status(400).json({ message: "Please enter a valid URL" });
    }

    let uploadedPhoto = null;
    if (req.files && req.files.photo) {
      let imageData = await upload.uploadImage(req.files.photo);
      if (imageData.status) {
        uploadedPhoto = imageData.name;
      } else {
        return res.status(400).json({ status: false, message: imageData.message });
      }
    }

    if (!uploadedPhoto) {
      return res.status(400).json({ status: false, message: "Event photo is required." });
    }

    const events = new Event({
      title: { en: req.body.title },
      description: { en: req.body.description || "" },
      event_type: req.body.event_type,
      platform: req.body.platform,
      location: req.body.location,
      photo: uploadedPhoto, // Assign the uploaded photo
      venueDetail: { en: req.body.venueDetail || "" },
      meeting_link: req.body.meeting_link,
      minimum_participants: req.body.minimum_participants,
      maximum_participants: req.body.maximum_participants,
      spoc_name: { en: req.body.spoc_name || "" },
      spoc_number: req.body.spoc_number || "",
      spoc_email: req.body.spoc_email || "",
      comments: req.body.comments,
      status: "Event_Created",
      start_date: startDate,
      end_date: endDate,
      // last_date_to_enroll: lastDateToEnroll
    });

    if (req.body.latitude && req.body.longitude) {
      events.loc = {
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      };
    }

    const data = await events.save();
    return res.status(201).json({ status: true, message: "Event created successfully" });

  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: err.message || "Internal Server Error" });
  }
};

exports.getAllEvent = async (req, res) => {
  try {
    let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"]);
    let limit = parseInt(req.query.limit ? req.query.limit : config.limit);
    limit = limit > config.limit ? config.limit : limit;
    let offset = parseInt(req.query.offset ? req.query.offset : config.offset);
    let event_type = req.query.event_type ? req.query.event_type : "";
    let search = req.query.q ? req.query.q : "";
    let defaultSort = req.query.sort ? JSON.parse(req.query.sort) : "";
    let language = req.headers["language"] ? req.headers["language"] : (req.query.language ? req.query.language : "en");

    let sort_query = { isExpired: 1, _id: -1 };
    if (defaultSort) {
      sort_query = {};
      sort_query[defaultSort.key] = defaultSort.val;
    }

    let query = {};
    if (userDetail.status === 1 && userDetail.data.isAdmin === false) {
      query.isDeleted = false;
      query.end_date = { $gte: new Date(new Date().setMonth(new Date().getMonth() - 3)) };
    }

    if (search) {
      if (language) {
        let searchField = {};
        searchField["title." + language] = { $regex: search, $options: "i" };
        query = {
          ...query,
          $or: [
            searchField,
            { "title.en": { $regex: search, $options: "i" } }
          ]
        };
      } else {
        query["title.en"] = { $regex: search, $options: "i" };
      }
    }

    if (event_type) {
      query.event_type = event_type;
    }

    let selectField = {
      "title.en": 1, "description.en": 1, photo: 1, start_date: 1, end_date: 1, event_type: 1,
      location: 1, loc: 1, platform: 1, meeting_link: 1, minimum_participants: 1,
      maximum_participants: 1, "spoc_name.en": 1, spoc_number: 1, spoc_email: 1, status: 1,
      attendeeCount: 1, likeCount: 1, bookmarkCount: 1, isExpired: 1, isDeleted: 1,
      createdAt: 1, updatedAt: 1
    };

    if (language !== "en") {
      selectField["title." + language] = 1;
      selectField["description." + language] = 1;
      selectField["spoc_name." + language] = 1;
    }

    let count = await Event.countDocuments(query);
    let data = await Event.find(query, selectField, { limit, skip: offset, sort: sort_query }).lean();

    for (let i = 0; i < data.length; i++) {
      let location = data[i].loc ? data[i].loc.coordinates : [];
      data[i].title = data[i].title[language] ? data[i].title[language] : data[i].title.en;
      data[i].description = data[i].description?.[language] || data[i].description?.en || "";
      data[i].photo = data[i].photo ? config.imageUrl + data[i].photo : config.defaultImageUrl;
      data[i].attendeeCount = data[i].attendeeCount || 0;
      data[i].likeCount = data[i].likeCount || 0;
      data[i].loc = { coordinates: { lat: location[0] || 0, lng: location[1] || 0 } };
      data[i].minimum_participants = data[i].minimum_participants || 0;
      data[i].maximum_participants = data[i].maximum_participants || 0;
      data[i].spoc_name = data[i].spoc_name[language] ? data[i].spoc_name[language] : data[i].spoc_name.en;
      data[i].spoc_number = data[i].spoc_number || "";
      data[i].spoc_email = data[i].spoc_email || "";
      data[i].youLiked = userDetail?.data ? await this.isLiked(userDetail.data, data[i]._id) : false;
      data[i].areYouJoining = userDetail?.data ? await this.checkRsvp(userDetail.data, data[i]._id) : false;
      // data[i].isBookMarked = userDetail?.data ? await this.bookmarkEvent(userDetail.data, data[i]._id) : false;
    }
    return res.send({ status: true, message: messages.read.success, data: data, count: count});

  } catch (err) {
   return res.status(500).json({ message: err.message || "Internal Server Error" });
  }
};

exports.searchEvent = async (req, res) => {
  const { searchQuery } = req.query
  try {
    let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
    limit = limit > config.limit ? config.limit : limit
    let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

    const search = new RegExp(searchQuery, "i")
    const events = await Event.find(
      {
        $or: [{ title: search }, { spoc_name: search }]
      },
      {},
      { limit: limit, skip: offset, sort: { _id: -1 } }
    )

    const count = await Event.find(
      {
        $or: [{ title: search }, { spoc_name: search }]
      },
      {},
      {}
    ).count({}, function (err, count) {
      return count
    })

    res.json({
      status: true,
      data: events,
      count: count,
      message: messages.read.success
    })
  } catch (error) {
    res.status(404).json({ message: messages.read.error })
  }
}

exports.getById = (req, res) => {
  let language = req.headers["language"] ? req.headers["language"] : (req.query.language ? req.query.language : "en")
  Event.findById(req.params.eventId)
    .then((data) => {
      if (data) {
        data.title = data.title[language] ? data.title[language] : ""
        data.description = data.description[language] ? data.description[language] : ""
        data.venueDetail = data.venueDetail[language] ? data.venueDetail[language] : ""
        data.spoc_name = data.spoc_name[language] ? data.spoc_name[language] : ""
        data.photo = data.photo ? config.imageUrl + data.photo : ""
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
  let language = req.headers["language"] ? req.headers["language"] : (req.body.language ? req.body.language : "en")
  if (
    req.body.title === "" &&
    req.body.start_date === "" &&
    req.body.description === "" &&
    req.body.event_type === ""
  ) {
    return res.status(400).send({
      message: messages.update.empty
    })
  }

  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"]);
  const updateQuery = {}
  if (req.body.title) {
    updateQuery["title." + language] = req.body.title
  }
  if (req.body.description) {
    updateQuery["description." + language] = req.body.description
  }
  if (req.body.event_type) {
    updateQuery.event_type = req.body.event_type
  }
  if (req.body.platform) {
    updateQuery.platform = req.body.platform
  }
  if (req.body.location) {
    updateQuery.location = req.body.location
  }

  if (req.body.latitude && req.body.longitude) {
    updateQuery.loc = { coordinates: [req.body.latitude, req.body.longitude] }
  }
  if (req.body.venueDetail) {
    updateQuery["venueDetail." + language] = req.body.venueDetail
  }
  if (req.body.address) {
    updateQuery.address = req.body.address
  }
  if (req.body.meeting_link) {
    updateQuery.meeting_link = req.body.meeting_link
  }
  if (req.body.minimum_participants) {
    updateQuery.minimum_participants = req.body.minimum_participants
  }
  if (req.body.maximum_participants) {
    updateQuery.maximum_participants = req.body.maximum_participants
  }
  if (req.body.spoc_name) {
    updateQuery["spoc_name." + language] = req.body.spoc_name || ""
  }
  if (req.body.spoc_number) {
    updateQuery.spoc_number = req.body.spoc_number || ""
  }
  if (req.body.spoc_email) {
    updateQuery.spoc_email = req.body.spoc_email || ""
  }
  if (req.body.comments) {
    updateQuery.comments = req.body.comments
  }
  if (req.body.start_date) {
    updateQuery.start_date = req.body.start_date
  }
  if (req.body.end_date) {
    updateQuery.end_date = req.body.end_date
  }
  if (req.body.last_date_to_enroll) {
    updateQuery.last_date_to_enroll = req.body.last_date_to_enroll
  }

  let eventPhoto = req.files.photo
  if (eventPhoto) {
    let imageData = await upload.uploadImage(eventPhoto);
    if (imageData.status === true) {
      updateQuery.photo = imageData.name
    } else {
      return res.send({
        status: false,
        message: imageData.message
      })
    }
  }
  if (userDetail.status === 1 && userDetail.data.isAdmin === true) {
    if (req.body.isActivre) {
      updateQuery.isDeleted = false
    }
  }
  Event.findByIdAndUpdate(req.params.eventId, updateQuery, { new: true })
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
  Event.findByIdAndUpdate(req.params.eventId, { isDeleted: true }, { new: true })
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

exports.likeEvent = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])
  if (userDetail.status === 0) {
    return res.send(userDetail)
  }
  let postId = req.body.event_id
  let getPost = await Event.findOne({ _id: postId })
  if (getPost) {
    let isLiked = await EventLike.findOne({
      event_id: postId,
      user_id: userDetail.data.user_id
    })
    if (isLiked === null) {
      const like = new EventLike({
        event_id: postId,
        user_id: userDetail.data.user_id
      })
      like
        .save()
        .then(async (data) => {
          await Event.updateOne({ _id: postId }, { $inc: { likeCount: +1 } })
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
      EventLike
        .findByIdAndUpdate(
          isLiked._doc._id,
          { isLiked: isLiked._doc.isLiked ? false : true },
          { new: true }
        )
        .then(async (data) => {
          await Event.updateOne(
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

exports.bookmarkEvent = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["Authorization"])
  if (userDetail.status === 0) {
    return res.send(userDetail)
  }
  let postId = req.body.event_id
  let getPost = await Event.findOne({ _id: postId })
  if (getPost) {
    let isActive = await EventBookmark.findOne({
      event_id: postId,
      user_id: userDetail.data.user_id
    })
    if (isActive === null) {
      const bookmark = new EventBookmark({
        event_id: postId,
        user_id: userDetail.data.user_id
      })
      bookmark
        .save()
        .then(async (data) => {
          await Event.findByIdAndUpdate({ _id: postId }, { $inc: { bookmarkCount: +1 } })
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
      EventBookmark.findByIdAndUpdate(
          isActive._doc._id,
          { isActive: isActive._doc.isActive ? false : true },
          { new: true }
        )
        .then(async (data) => {
          const result = await Event.updateOne(
            { _id: postId },
            { $inc: { bookmarkCount: isActive._doc.isActive ? -1 : 1 } }
          );
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
  let isLiked = await EventLike.findOne({
    user_id: userDetail.user_id,
    event_id: postId,
    isLiked: true
  })
  if (isLiked) {
    return true
  } else {
    return false
  }
}

exports.checkRsvp = async (userDetail, eventId) => {
  let getRsvp = await Rsvp.findOne({
    user: userDetail.user_id,
    event: eventId,
    isDeleted: false
  })
  if (getRsvp) {
    return true
  } else {
    return false
  }
}

// exports.isBookMarked = async (req, res) => {
//   try {
//     let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"]);
//     const eventData = await Event.findById(req.body.event_id);
//     console.log(eventData, "EventData");
//     // not done yet
//   } catch (err) {
//     console.error("Error in getAll API:", err);
//     return res.status(500).send({
//       message: err.message || messages.read.error
//     });
//   }
// }




// let isBookMarked = await EventBookmark.findOne({
//   user_id: userDetail.user_id,
//   event_id: postId,
//   isActive: true
// })
// if (isBookMarked) {
//   return true
// } else {
//   return false
// }


exports.downloadEvents = async (req, res) => {
  try {

    var moment = require('moment');
    let userDetail = await userHelper.detail(req.headers["access-token"] || req.headers["authorization"])
    if (userDetail.status === 1 && userDetail.data.isAdmin === true) {
      const excel = require("exceljs");

      let eventType = req.body.event_type || "";

      let workbook = new excel.Workbook();
      let worksheet = workbook.addWorksheet("Events");
      let selectField = { "title.en": 1, "description.en": 1, platform: 1, meeting_link: 1, location: 1, venueDetail: 1, attendeeCount: 1, likeCount: 1, minimum_participants: 1, maximum_participants: 1, spoc_name: 1, spoc_number: 1, spoc_email: 1, start_date: 1, end_date: 1, isExpired: 1 }
      if (eventType === "Online") {
        worksheet.columns = [
          { header: "Title", key: "title", width: 20 },
          { header: "Description", key: "description" },
          { header: "Platform", key: "platform" },
          { header: "Meeting Link", key: "meeting_link" },
          { header: "Rsvp Count", key: "attendeeCount" },
          { header: "Start Time", key: "start_date" },
          { header: "End Time", key: "end_date" },
          { header: "Status", key: "status" }
        ];
      } else {
        worksheet.columns = [
          { header: "Title", key: "title", width: 20 },
          { header: "Description", key: "description" },
          { header: "Location", key: "location" },
          { header: "Venue", key: "venueDetail" },
          { header: "Minimum Participants", key: "minimum_participants" },
          { header: "Maximum Participants", key: "maximum_participants" },
          { header: "Spoc Name", key: "spoc_name" },
          { header: "Spoc Number", key: "spoc_number" },
          { header: "Spoc Email", key: "spoc_email" },
          { header: "Rsvp Count", key: "attendeeCount" },
          { header: "Start Time", key: "start_date" },
          { header: "End Time", key: "end_date" },
          { header: "Status", key: "status" }
        ];
      }

      // Add Array Rows
      let query = { isDeleted: false, event_type: eventType }

      let data = await Event.find(query, selectField).lean()

      if (data.length > 0) {
        let language = "en";
        for (i = 0; i < data.length; i++) {
          data[i].title = data[i].title[language] ? data[i].title[language] : data[i].title.en
          data[i].description = data[i].description !== undefined && data[i].description[language] ? data[i].description[language] : (data[i].description !== undefined && data[i].description.en ? data[i].description.en : "")
          data[i].venueDetail = data[i].venueDetail[language] ? data[i].venueDetail[language] : data[i].venueDetail.en
          data[i].photo = data[i].photo ? config.imageUrl + data[i].photo : config.defaultImageUrl
          data[i].attendeeCount = data[i].attendeeCount ? data[i].attendeeCount : 0
          data[i].likeCount = data[i].likeCount ? data[i].likeCount : 0
          data[i].location = data[i].location ? data[i].location : ""
          data[i].platform = data[i].platform ? data[i].platform : ""
          data[i].start_date = data[i].start_date ? moment(data[i].start_date).format('DD MMM YY hh:mm A') : ""
          data[i].end_date = data[i].end_date ? moment(data[i].end_date).format('DD MMM YY hh:mm A') : ""
          data[i].minimum_participants = data[i].minimum_participants ? data[i].minimum_participants : 0
          data[i].maximum_participants = data[i].maximum_participants ? data[i].maximum_participants : 0
          data[i].spoc_name = data[i].spoc_name[language] ? data[i].spoc_name[language] : data[i].spoc_name.en
          data[i].spoc_number = data[i].spoc_number ? data[i].spoc_number : ""
          data[i].spoc_email = data[i].spoc_email ? data[i].spoc_email : ""
          data[i].status = data[i].isExpired ? "Expired" : "Active"
        }
      }
      worksheet.addRows(data);
      try {
        console.log("done", config);
        const data = await workbook.xlsx.writeFile(`./uploads/temp/eventList.xlsx`)
          .then(() => {
            res.send({
              status: true,
              message: messages.read.success,
              path: `${process.env.IMAGE_BASE_URL}/temp/eventList.xlsx`,
            });
          });
      } catch (err) {
        res.send({
          status: false,
          message: messages.read.error,
        });
      }

    }
  } catch (e) {
    return res.send({
      status: false,
      message: messages.read.error,
      data: e.message
    })
  }
}