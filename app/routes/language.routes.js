const express = require('express');
const router = express.Router();
const language = require("../controllers/language.controller.js")
const static = require("../controllers/static.controller.js")


// router.get("/language", language.getAll)
router.get('/about', static.getAbout)
router.get('/terms', static.getTerms)
router.get('/privacy', static.getPrivacy)
router.get('/disclaimer', static.getDisclaimer)
//CMS
router.post('/privacy', static.createPrivacy);//New
router.post('/about', static.createAbout);//New
router.post('/terms', static.createTerms);//New
router.post('/disclaimer', static.createDisclaimer);//New

router.get('/static', static.getById)
router.put('/static', static.update)


//New api
router.post('/language', language.insertLanguage);
router.put('/language', language.editLanguage);
router.get('/all-language', language.getAll);
router.get('/details-language', language.detailsLanguage);
router.delete('/inactive-language', language.inActiveLanguage);
module.exports = router;
