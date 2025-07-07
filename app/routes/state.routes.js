const express = require('express');
const router = express.Router();
const states = require('../controllers/state.controller.js');


router.post('/state', states.create);

router.get('/state', states.getAll);

router.get('/state/:stateId', states.getById);

router.put('/state/:stateId', states.update);

router.delete('/state/:stateId', states.delete);


module.exports = router;