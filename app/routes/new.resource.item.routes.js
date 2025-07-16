
const express = require("express");
const router = express.Router();
const newresourceitem = require('../controllers/new.resource.item.controller');

router.post('/new-resource-item', newresourceitem.createNewResourceItem);
router.get('/new-resource-item', newresourceitem.listAllResourceItems);
router.get('/new-resource-item/:resourceId', newresourceitem.getSingleResourceItemById);
router.put('/new-resource-item/:resourceId', newresourceitem.updateResourceItemById);
router.delete('/new-resource-item/:resourceId', newresourceitem.deleteResourceItem);

//Mobile Application
router.get('/all-resource-item', newresourceitem.allResourcesList);
router.get('/all-resource-item/:resourceId', newresourceitem.getResourceItemDetailsById);
module.exports = router;