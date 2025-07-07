const express = require("express");
const router = express.Router();
const posts = require('../controllers/userPost.controller.js');
const upload = require('../middleware/upload.js');
// const uploadFeed = require("../middleware/uploadFeed.js")

router.post('/post', posts.create);

router.get('/post', posts.getAll);

router.get('/post/search', posts.searchUserPosts);

router.get('/post/:postId', posts.getById);

// router.put('/post/:postId', upload.array('images'), posts.update);

router.put('/post/:postId', posts.update);

router.delete('/post/:postId', posts.delete);

router.post('/likePost', posts.likePost);

router.post('/deletePost', posts.deletePost);

router.post('/downloadFeed', posts.downloadFeed);

router.post("/uploadFeedImage", posts.uploadFeedImage)

router.get('/feed', posts.feedPosts);

module.exports = router;