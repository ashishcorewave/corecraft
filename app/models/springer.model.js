const mongoose = require("mongoose");

const RecordSchema = new mongoose.Schema(
  {
    // contentType: {
    //   type: String,
    // },
    // identifier: {
    //   type: String,
    // },
    // language: {
    //   type: String,
    // },
    // url: {
    //   type: Object,
    // },
    // title: {
    //   type: String,
    // },
    // creators: {
    //   type: Array,
    // },
    // publicationName: {
    //   type: String,
    // },
    // doi: {
    //   type: String,
    // },
    // publisher: {
    //   type: String,
    // },
    // publisherName: {
    //   type: String,
    // },
    // publicationDate: {
    //   type: String,
    // },
    // publicationType: {
    //   type: String,
    // },
    // issn: {
    //   type: String,
    // },
    // eIssn: {
    //   type: String,
    // },
    // volume: {
    //   type: String,
    // },
    // number: {
    //   type: String,
    // },
    // issueType: {
    //   type: String,
    // },
    // topicalCollection: {
    //   type: String,
    // },
    // genre: {
    //   type: Array,
    // },
    // startingPage: {
    //   type: String,
    // },
    // endingPage: {
    //   type: String,
    // },
    // journalId: {
    //   type: String,
    // },
    // openAccess: {
    //   type: String,
    // },
    // printDate: {
    //   type: String,
    // },
    // onlineDate: {
    //   type: String,
    // },
    // coverDate: {
    //   type: String,
    // },
    // abstract: {
    //   type: String,
    // },
    // subjects: {
    //   type: Array,
    // },
  },
  { strict: false }
);

module.exports = mongoose.model("openaccess4", RecordSchema);
