
const express = require("express");
const router = express.Router();
const categories = require('../controllers/articleCategory.controller.js');

router.post('/articleCategory', categories.create);//done
router.get('/articleCategory', categories.getAll);//done
router.get('/articleCategory/:categoryId', categories.getById);//done
router.put('/articleCategory/:categoryId', categories.update);//done
router.delete('/articleCategory/:categoryId', categories.delete);//done


router.post('/mark-top-category', categories.isTopCategoryMark);
router.get('/top-category', categories.listOfTopCategory);
router.get('/all-category', categories.allCategory);
module.exports = router;