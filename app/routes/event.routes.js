const events = require("../controllers/event.controller.js");
const express = require("express");
const router = express.Router();

// Event Routes
router.post("/event", events.create);//done
router.get("/event", events.getAllEvent);//done
router.get("/event/search", events.searchEvent);
router.get("/event/:eventId", events.getById);//done
router.put("/event/:eventId", events.update);//done
router.delete("/event/:eventId", events.delete);//done

// Event Interactions
router.post("/event/like", events.likeEvent);//done
router.post("/event/bookmark", events.bookmarkEvent);//done
router.post("/download", events.downloadEvents);



module.exports = router; 
