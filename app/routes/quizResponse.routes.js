const express = require('express');
const router = express.Router();
const quizResponse = require('../controllers/quizResponse.controller.js');

router.post('/userAnswer', quizResponse.create);//done
router.get('/userAnswer', quizResponse.getAll);//done
router.get('/userAnswer/:userAnswerId', quizResponse.getById);//done
router.put('/userAnswer/:userAnswerId', quizResponse.update);
router.delete('/userAnswer/:userAnswerId', quizResponse.delete);



module.exports = router;