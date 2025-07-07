const express = require('express');
const router = express.Router();
const eventBookmarks = require("../controllers/event.controller")


router.post("/eventBookmark", eventBookmarks.bookmarkEvent)

// router.get("/eventBookmark", eventBookmarks.isBookMarked)// Not correct this api yet.

// router.get("/eventBookmark/:eventBookmarkId", eventBookmarks.getById)

// router.delete("/eventBookmark/:eventBookmarkId", eventBookmarks.delete)

module.exports = router;


