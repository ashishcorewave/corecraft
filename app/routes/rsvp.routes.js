const express = require("express");
const router = express.Router();
const rsvp = require("../controllers/rsvp.controller.js")

router.get("/rsvp", rsvp.getAll)//done

router.post("/rsvp", rsvp.create)//done

router.get("/rsvp/search", rsvp.searchRsvp)

router.get("/rsvp/:rsvpId", rsvp.getById)//done 

router.delete("/rsvp/:rsvpId", rsvp.delete)

router.post("/un-rsvp", rsvp.unRsvp)//done


module.exports = router;
