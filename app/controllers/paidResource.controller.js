const PaidResource = require("../models/paidResource.model.js");
const messages = require("../utility/messages");
const config = require("config");
const isUrl = require('is-url');
exports.create = (req, res) => {
  const paidResources = new PaidResource({
    title: req.body.title,
    description: req.body.description,
    resource_link: req.body.resource_link,
  });

  if (isUrl(req.body.resource_link)) {
    paidResources.resource_link = req.body.resource_link
  } else {
    return res.status(400).send({
      message: 'Please enter a valid url'
   });
  }
  paidResources
    .save()
    .then((data) => {
      return res.send({status : true , message: messages.create.success, data : data});
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || messages.create.error
      });
    });
};

exports.getAll = (req, res) => {
  let limit = parseInt(req.query.limit ? req.query.limit : config.limit);
  limit  = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset);
  PaidResource.find({}, {}, { limit: limit, skip: offset, sort: {_id: -1} })
    .then((data) => {
      return res.send({status : true , message: messages.read.success, data : data});
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || messages.read.error
      });
    });
};

exports.getById = (req, res) => {
  PaidResource.findById(req.params.paidResourceId)
    .then((data) => {
      if (data) {
        return res.send({status : true , message: messages.read.success, data : data});
      }
      return res.status(404).send({
        message: messages.read.error
      });
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: messages.read.error
        });
      }
      return res.status(500).send({
        message: messages.read.error
      });
    });
};

exports.update = (req, res) => {
  if (
    req.body.title === "" &&
    req.body.description === "" &&
    req.body.resource_link === ""
  ) {
    return res.status(400).send({
      message: messages.update.empty,
    });
  }

  const updateQuery = {};
  if (req.body.title) {
    updateQuery.title = req.body.title
  }
  if (req.body.description) {
    updateQuery.description = req.body.description
  }
  if (req.body.resource_link && isUrl(req.body.resource_link)) {
    updateQuery.resource_link = req.body.resource_link
  } else {
    return res.status(400).send({
      message: 'Please enter a valid url'
   });
  }
  
  PaidResource.findByIdAndUpdate(
    req.params.paidResourceId,
    updateQuery,
    { new: true }
  )
    .then((data) => {
      if (data) {
        return res.send({status : true , message: messages.update.success, data : data});
      }
      return res.status(404).send({
        message: messages.update.error
      });
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: messages.update.error
        });
      }
      return res.status(500).send({
        message:
        messages.update.error
      });
    });
};

exports.delete = (req, res) => {
  PaidResource.findByIdAndDelete(req.params.paidResourceId)
    .then((data) => {
      if (data) {
        return res.send({status : true , message: messages.delete.success});
      }
      return res.status(404).send({
        message: messages.delete.error,
      });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message: messages.delete.error
        });
      }
      return res.status(500).send({
        message:
        messages.delete.error
      });
    });
};
