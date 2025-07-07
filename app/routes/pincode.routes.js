const express = require("express");
const router = express.Router();
const pincode = require('../controllers/pincode.controller');


router.post('/pincode', pincode.insertPincode);
router.get('/pincode', pincode.listAllPincode);
router.put('/pincode', pincode.editPincode);
router.delete('/pincode', pincode.deletePincode);

module.exports = router;