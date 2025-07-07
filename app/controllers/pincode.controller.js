const pincode = require('../models/pincode.model');
const userHelper = require('../utility/UserHelper');
const upload = require('../utility/fileUpload');
const mongoose = require('mongoose');


exports.insertPincode = async (req, res) => {
    try {
        const token = req.headers['access-token'] || req.headers['authorization'];
        const userDetail = await userHelper.detail(token);
        const insertQuery = new pincode({
            pincode: req.body.pincode,
            stateId:req.body.stateId,
            created_by: userDetail.data.user_id,
        });
        await insertQuery.save();
        return res.status(201).json({ code: "201", status: true, message: 'Pincode insert successfully' });

    } catch (err) {
        return res.status(500).json({ status: false, code: 500, message: "Internal Server Error" });
    }
}


exports.listAllPincode = async (req, res) => {
    try {
        const filter = { isDeleted: false };
        const getQuery = await pincode.find(filter).sort({ _id: -1 }).select("_id pincode addedDate").lean();
        return res.status(200).json({ code: "200", status: true, message: 'Get Pincode successfully', data: getQuery });
    } catch (err) {
        return res.status(500).json({ status: false, code: 500, message: "Internal Server Error" });
    }
}


exports.editPincode = async (req, res) => {
    try {
        const filter = {
            isDeleted: false,
            _id: req.body.pincodeId
        }

        const update = {
            pincode: req.body.pincode,
        };

        const options = { new: true };
        await pincode.findByIdAndUpdate(filter, update, options);
        return res.status(201).json({ code: 201, status: true, message: 'Pincode updated successfully' });
    } catch (err) {
        return res.status(500).json({ code: 500, status: false, message: "Internal Server Error" });
    }
};


exports.deletePincode = async (req, res) => {
    try {
        const filter = {
            isDeleted: false,
            _id: req.body.pincodeId
        }

        const update = {
            isDeleted: true,
        };

        const options = { new: true };
        await pincode.findByIdAndUpdate(filter, update, options);
        return res.status(201).json({ code: 201, status: true, message: 'Pincode updated successfully' });
    } catch (err) {
        return res.status(500).json({ code: 500, status: false, message: "Internal Server Error" });
    }
};

