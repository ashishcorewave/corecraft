const Invite = require("../models/invite.model.js");
const messages = require("../utility/messages");
const config = require("config");

exports.create = (req, res) => {
  const invites = new Invite({
    message: req.body.message,
    code: req.body.code,
    from_user: req.body.from_user,
    date: req.body.date,
  });

  invites
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
  Invite.find({}, {}, { limit: limit, skip: offset, sort: {_id: -1} })
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
  Invite.findById(req.params.inviteId)
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
    req.body.message === "" &&
    req.body.code === "" &&
    req.body.from_user === "" &&
    req.body.date === ""
  ) {
    return res.status(400).send({
      message: messages.update.empty,
    });
  }

  const updateQuery = {};
  if (req.body.message) {
    updateQuery.message = req.body.message
  }
  if (req.body.code) {
    updateQuery.code = req.body.code
  }
  if (req.body.from_user) {
    updateQuery.from_user = req.body.from_user
  }
  if (req.body.date) {
    updateQuery.date = req.body.date
  }

  Invite.findByIdAndUpdate(
    req.params.inviteId,
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
  Invite.findByIdAndDelete(req.params.inviteId)
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
