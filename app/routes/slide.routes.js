const express = require('express');
const router = express.Router();
const slider = require('../controllers/slide.controller.js');


router.post('/slide', slider.create);
router.get('/slide', slider.getAll);
router.get('/slide/:slideId', slider.getById);
router.post('/slide/:slideId', slider.update);
router.delete('/slide/:slideId', slider.delete);
router.get('/all-slide', slider.getAllBannerSlider);//type bases
module.exports = router;