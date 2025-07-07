const express = require('express');
const router = express.Router();
const audioComplaints = require('../controllers/audioComplaint.controller.js');

router.post('/audioComplaint', audioComplaints.create);

router.get('/audioComplaint', audioComplaints.getAll);

router.get('/audioComplaint/:audioComplaintsId', audioComplaints.getById);

router.put('/audioComplaint/:audioComplaintsId', audioComplaints.update);

router.delete('/audioComplaint/:audioComplaintsId', audioComplaints.delete);


module.exports = router;

