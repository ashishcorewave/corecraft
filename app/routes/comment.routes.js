const express = require('express');
const router = express.Router();
const comments = require('../controllers/comment.controller.js');



router.post('/comment', comments.create);

router.post('/downloadComment', comments.downloadComment);

router.get('/comment', comments.getAll);

router.get('/comment/post/search/:id', comments.searchComment);

router.get('/comment/post/:id', comments.getCommentsbyPostId);

router.get('/comment/:commentId', comments.getById);

router.put('/comment/:commentId', comments.update);

router.delete('/comment/:commentId', comments.delete);

module.exports = router;