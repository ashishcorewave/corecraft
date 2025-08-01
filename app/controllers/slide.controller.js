const Slider = require("../models/slider.model")
const messages = require("../utility/messages")
const config = require("config")
const upload = require("../utility/fileUpload");


exports.create = async (req, res, next) => {
  let title = req.body.title;
  let sliderType = req.body.sliderType;
  const slide = new Slider({
    title,
    sliderType
  })

  let slideImage = req.files.image
  if (slideImage) {
    let imageData = await upload.uploadImage(slideImage, "uploads/slides/");
    if (imageData.status === true) {
      slide.image = imageData.name
    } else {
      return res.send({
        status: false,
        message: imageData.message
      })
    }
  }

  if (title) {
    slide
      .save()
      .then((data) => {
        return res.send({
          status: true,
          message: messages.create.success,
        })
      })
      .catch((err) => {
        return res.status(500).send({ message: err.message || messages.create.error })
      })
  } else {
    return res.send({ status: false, message: 'Please enter title' })
  }
}

exports.getAll = async (req, res) => {
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
  let search = req.query.q ? req.query.q : ""
  let type = req.query.type ? req.query.type.trim() : null;

  let query = { isDeleted: false }
  if (search) {
    query.title = { $regex: search, $options: "$i" }
  }

  if (type) {
    query.sliderType = type;
  }

  let count = await Slider.countDocuments(query)

  Slider.find(query, {},
    { limit: limit, skip: offset, sort: { title: 1 } }
  )
    .then((data) => {
      data.forEach((d, key) => {
        d.image = d.image ? `${process.env.IMAGE_BASE_URL}/uploads/${d.image}` : null
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
}

exports.getById = (req, res) => {
  Slider.findById(req.params.slideId)
    .then((data) => {
      if (data) {
        data.image = data.image ? config.slideImageUrl + data.image : config.defaultImageUrl
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
  if (req.body.title === "") {
    return res.status(400).send({
      message: messages.update.empty
    })
  }
  const updateQuery = {}

  if (req.body.title) {
    updateQuery.title = req.body.title
  }

  let slideImage = req.files.image
  if (slideImage) {
    let imageData = await upload.uploadImage(slideImage, "uploads/slides/");
    if (imageData.status === true) {
      updateQuery.image = imageData.name
    } else {
      return res.send({
        status: false,
        message: imageData.message
      })
    }
  }

  Slider.findByIdAndUpdate(
    req.params.slideId, updateQuery, { new: true })
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
  Slider.findByIdAndUpdate(req.params.slideId, { isDeleted: true }, { new: true })
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


exports.getAllBannerSlider = async (req, res) => {
  const type = req.query.type ? req.query.type.trim() : null;

  // Optional pagination (fallback to defaults if needed)
  const limit = parseInt(req.query.limit || config.limit);
  const offset = parseInt(req.query.offset || config.offset);
  const search = req.query.q ? req.query.q.trim() : "";

  let query = { isDeleted: false };

  //  Search by title (optional)
  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  //  Type-based filtering
  if (type !== null) {
    switch (type) {
      case "3":
        query.sliderType = "slider" ;
        break;
      case "1":
        query.sliderType = "audiocast";
        break;
      case "2":
        query.sliderType = "videocast";
        break;
      case "0":
        query.sliderType = "article";
        break;
      default:
        query.sliderType = null;
    }
  }

  try {
    const data = await Slider.find(query, {}, {
      limit,
      skip: offset,
      sort: { title: 1 }
    });

    //  Format image URL
    data.forEach((d) => {
      d.image = d.image ? `${process.env.IMAGE_BASE_URL}/uploads/${d.image}` : null;
    });

    return res.send({
      status: true,
      message: messages.read.success,
      data: data,
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || messages.read.error
    });
  }
};


