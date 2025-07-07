const express = require('express');
const router = express.Router();
const points = require("../controllers/point.controller.js")

router.post("/point", points.create)//done
router.get("/point", points.getAll)//done
router.get("/point/:pointId", points.getById)//done
router.put("/point/:pointId", points.update)//done
router.delete("/point/:pointId", points.delete)//done
router.post("/point/getReferral", points.getReferralPoints)//pending

module.exports = router;
