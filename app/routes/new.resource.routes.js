
const express = require("express");
const router = express.Router();
const newresource = require('../controllers/new.resource.controller');

router.post('/new-resource', newresource.create);
router.get('/new-resource', newresource.getAll);
router.get('/new-resource/:resourceId', newresource.getById);
router.put('/new-resource/:resourceId', newresource.update);
router.delete('/new-resource/:resourceId', newresource.delete);


router.get('/all-new-resource', newresource.allResources);
module.exports = router;