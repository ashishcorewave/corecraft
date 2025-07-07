const contactCategories = require("../controllers/contactCategory.controller.js")
const express = require('express');
const router = express.Router();


router.post("/contactCategory", contactCategories.create)

router.get("/contactCategory", contactCategories.getAll)

router.get("/contactCategory/:contactCategoryId", contactCategories.getById)

router.put("/contactCategory/:contactCategoryId", contactCategories.update)

router.delete("/contactCategory/:contactCategoryId", contactCategories.delete)

module.exports = router;
