const express = require("express");
const router = express.Router();
const doctor = require('../controllers/doctor.controller');


router.post('/doctor', doctor.createDoctor);
router.get('/doctor', doctor.getAllDoctors);
router.get('/doctor-by-category', doctor.getDoctorByCategory);
router.post('/mark-top-doctor', doctor.isTopDoctorMark);
router.get('/top-doctors', doctor.listOfTopDoctors);
router.put('/inactive-doctor', doctor.inActiveDoctor);
router.get('/doctor-details', doctor.doctorDetails);
router.put('/edit-doctor', doctor.editDoctor);

module.exports = router;