const Slider = require("../models/slider.model")
const messages = require("../utility/messages")
const config = require("config")
const upload = require("../utility/fileUpload")

exports.create = async (req, res, next) => {
  let title = req.body.title
  const slide = new Slider({
    title
  })

  let slideImage = req.files.image
  if(slideImage){
    let imageData = await upload.uploadImage(slideImage, "uploads/slides/");
    if(imageData.status === true ){
      slide.image = imageData.name
    }else{
      return res.send({
        status: false,
        message: imageData.message
      })
    }
  }

  if(title) {
    slide
    .save()
    .then((data) => {
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
  }else{
    return res.send({
      status: false,
      message: 'Please enter title'
    })
  }
}

exports.getAll = async (req, res) => {
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)
  let search = req.query.q ? req.query.q : ""

  let query = { isDeleted: false }
  if(search){
    query.title = {$regex: search, $options:"$i"}
  }

  let count = await Slider.countDocuments(query)

  Slider.find(query,{},
    { limit: limit, skip: offset, sort: { title: 1 } }
    )
  .then((data) => {
    data.forEach((d, key) => {
      d.image = d.image ? config.slideImageUrl + d.image : config.defaultImageUrl
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

  if(req.body.title) {
    updateQuery.title = req.body.title
  }

  let slideImage = req.files.image
  if(slideImage){
    let imageData = await upload.uploadImage(slideImage, "uploads/slides/");
    if(imageData.status === true ){
      updateQuery.image = imageData.name
    }else{
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
  Slider.findByIdAndUpdate(req.params.slideId, {isDeleted: true}, { new: true })
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
