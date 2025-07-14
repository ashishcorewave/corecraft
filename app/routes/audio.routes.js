const express = require('express');
const router = express.Router();
const audios = require("../controllers/audio.controller.js")
const upload = require("../middleware/upload.js")
const uploadAudio = require("../middleware/uploadAudio.js")



router.post("/audio", audios.create)

router.get("/audio", audios.getAll)

router.get("/audio/search", audios.searchAudio)

router.get("/audio/:audioId", audios.getById)

router.put("/audio/:audioId", audios.update)

router.delete("/audio/:audioId", audios.delete)

router.post("/insert/audio/comment", audios.createComment)

router.get("/get/audio/comments", audios.getAllComments)

router.delete("/delete/audio/comment/:commentId", audios.deleteComment)

router.post("/likeAudio", audios.likeAudio);

router.get('/audio-filter', audios.getAudioLanguageFilter);



router.post('/audio-insert', audios.createAudio);
router.put('/update-audio/:audioId', audios.updateAudioWithTranslation);


router.post('/mark-top-audio-cast', audios.isTopAudioCastMark);
router.get('/top-audio-video-cast', audios.listOfTopAudioCastOrVideoCast);
router.get('/list-top-audio-video-cast', audios.listOfAllTopAudioCastOrVideoCast);
router.get('/audio-cast-by-category', audios.audioCastByCategoryId);
router.get('/audio-details', audios.detailsOfAudioCast);
router.get('/top-doctor-audio-video', audios.listOfTopDoctAudioOrVideo);//Not use
module.exports = router
