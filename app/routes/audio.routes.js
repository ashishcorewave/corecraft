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

router.post("/audio/comment", audios.createComment)

router.get("/audioComments", audios.getAllComments)

router.delete("/audio/comment/:commentId", audios.deleteComment)

router.post("/likeAudio", audios.likeAudio);

router.get('/audio-filter', audios.getAudioLanguageFilter);



router.post('/audio-insert', audios.createAudio);
router.put('/update-audio/:audioId', audios.updateAudioWithTranslation);


router.post('/mark-top-audio-cast', audios.isTopAudioCastMark);//Not Use
router.get('/top-audio-cast', audios.listOfTopAudioCast);
module.exports = router
