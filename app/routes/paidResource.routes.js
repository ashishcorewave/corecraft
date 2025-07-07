const express = require('express');
const router = express.Router();
const paidResources = require("../controllers/paidResource.controller.js");

router.post('/paidResource', paidResources.create);//done
router.get('/paidResource', paidResources.getAll);//done
router.get('/paidResource/:paidResourceId', paidResources.getById);//done
router.put('/paidResource/:paidResourceId', paidResources.update);//done
router.delete('/paidResource/:paidResourceId', paidResources.delete);//done

module.exports = router;