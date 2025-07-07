const userStories = require('../controllers/userStory.controller.js');
const upload = require('../middleware/upload.js');
const express = require('express');
const router = express.Router();

router.post('/userStory', upload.array('photos'), userStories.create);

router.get('/userStory', userStories.getAll);

router.get('/userStory/:userStoryId', userStories.getById);

router.put('/userStory/:userStoryId', upload.array('photos'), userStories.update);

router.delete('/userStory/:userStoryId', userStories.delete);


module.exports = router;