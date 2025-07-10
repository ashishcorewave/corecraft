const express = require('express');
const router = express.Router();
const videos = require('../controllers/video.controller.js');

router.post('/video', videos.create);
router.get('/video', videos.getAll);
router.get('/video/search', videos.searchVideo);
router.get('/video/:videoId', videos.getById);

router.put('/video/:videoId', videos.update);
router.delete('/video/:videoId', videos.delete);
router.post("/video/comment", videos.createComment)
router.get("/videoComments", videos.getAllComments)
router.delete("/video/comment/:commentId", videos.deleteComment)
router.post("/likeVideo", videos.likeVideo)

router.post('/mark-top-video-cast', videos.isTopVideoCastMark);//Not Use
router.get('/top-video-cast', videos.listOfTopVideoCast);
router.get('/video-cast-by-category', videos.videoCastByCategoryId);
router.get('/video-details', videos.videoCastDetails);
module.exports = router;