const express = require('express');
const router = express.Router();
const magazines = require('../controllers/magazine.controller.js');

router.post('/magazine', magazines.create);//done
router.get('/magazine', magazines.getAll);//done
router.get('/magazine/search', magazines.searchMagazine);//done
router.get('/magazine/:magazineId', magazines.getById);//done
router.put('/magazine/:magazineId', magazines.update);//done
router.delete('/magazine/:magazineId', magazines.delete);//done
router.post('/readMagazine', magazines.readMagazine);//done

module.exports = router;