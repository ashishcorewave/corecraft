const express = require('express');
const router = express.Router();
const contacts = require("../controllers/contact.controller.js")
const upload = require('../middleware/upload.js')



router.post("/createContact", contacts.create)

router.get("/getContactList", contacts.getAll)

router.get("/contact/search", contacts.searchContact)

router.get("/contact/:contactId", contacts.getById)

router.get("/contact/category/:id", contacts.getContactbyCategoryId)

router.put("/updateContact/:contactId", contacts.update)

router.delete("/deleteContact/:contactId", contacts.delete)

router.post("/downloadContact", contacts.downloadContact)

router.get('/all-contact', contacts.allContactList);
router.get('/state-base-pincode', contacts.getStateBasePinCode);
router.get('/contact-details/:contactId', contacts.allContactDetails);
module.exports = router;