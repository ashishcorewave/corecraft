const NewResourceItem = require('../models/new.resource.item.model');
const userHelper = require('../utility/UserHelper');
const upload = require('../utility/fileUpload');
const mongoose = require('mongoose');

//Created new
exports.createNewResourceItem = async (req, res) => {
    try {
        const token = req.headers['access-token'] || req.headers['authorization'];
        const userDetail = await userHelper.detail(token);
        const { specialistName, mobileNo, email, address, landmark, resourceId, city, pincode, description, stateId, alternateNo, whatsappNo } = req.body;
        const language = req.headers["language"] || req.body.language;

        const newResource = new NewResourceItem({
            specialistName: { [language]: specialistName },
            email: email,
            mobileNo: mobileNo,
            alternateNo: alternateNo,
            whatsappNo: whatsappNo,
            stateId: stateId,
            resourceId: resourceId,
            address: { [language]: address },
            landmark: { [language]: landmark },
            city: { [language]: city },
            description: { [language]: description },
            pincode: pincode,
            created_by: userDetail.data.user_id,
        });

        if (req.files && req.files.specialistImage) {
            const doctorImageFile = req.files.specialistImage;
            const imageData = await upload.uploadImage(doctorImageFile);
            if (imageData.status === true) {
                newResource.specialistImage = imageData.name;
            } else {
                return res.status(400).json({ status: false, message: imageData.message });
            }
        } else {
            return res.status(400).json({ status: false, message: 'A specialistImage file is required.' });
        }


        if (req.files && req.files.icon) {
            const iconImage = req.files.icon;
            const imageData = await upload.uploadImage(iconImage);
            if (imageData.status === true) {
                newResource.icon = imageData.name;
            } else {
                return res.status(400).json({ status: false, message: imageData.message });
            }
        } else {
            return res.status(400).json({ status: false, message: 'A icon file is required.' });
        }
        await newResource.save();
        return res.status(201).json({ code: "201", status: true, message: 'Resources Item created successfully' });
    } catch (err) {
        return res.status(500).json({ status: false, message: err.message || 'Internal Server Error' });
    }
};


exports.listAllResourceItems = async (req, res) => {
    try {
        const language = req.headers["language"] || "en";
        const searchData = (req.query.searchData || "").trim();

        let filter = { isDeleted: false };

        if (searchData) {
            filter[`specialistName.${language}`] = { $regex: searchData, $options: "i" };
        }

        const resources = await NewResourceItem.find(filter).populate("resourceId").populate("stateId").sort({ _id: -1 });

        const responseData = resources.map(item => ({
            _id: item._id,
            specialistName: item.specialistName?.[language] ,
            resourceName: item.resourceId?.name?.[language] ,
            state: item.stateId?.label?.[language] ,
            resourceId: item.resourceId?._id,
            stateId: item.stateId?.label?._id,
            mobileNo: item.mobileNo,
            alternateNo: item.alternateNo,
            whatsappNo: item.whatsappNo,
            email: item.email,
            shortCode:language,
            address: item.address?.[language] ,
            landmark: item.landmark?.[language] ,
            city: item.city?.[language] ,
            description: item.description?.[language] ,
            pincode: item.pincode,
            specialistImage: item.specialistImage || null,
            icon: item.icon || null,
            created_by: item.created_by,
            createdAt: item.createdAt,
        }));

        const finalData = responseData.map((item) => {
            return ({
                ...item,
                specialistImage: `${process.env.IMAGE_BASE_URL}/${item.specialistImage}`,
                icon: `${process.env.IMAGE_BASE_URL}/${item.icon}`
            })
        })

        return res.status(200).json({
            code: "200",
            status: true,
            message: "Resources fetched successfully",
            data: finalData
        });

    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message || "Internal Server Error"
        });
    }
};

exports.getSingleResourceItemById = async (req, res) => {
    try {
        const language = req.headers["language"] || "en";
        const resourceId = req.params.resourceId;

        const resource = await NewResourceItem.findOne({ _id: resourceId, isDeleted: false }).populate("resourceId");

        if (!resource) {
            return res.status(404).json({ code: "404", status: false, message: "Resource not found" });
        }

        const responseData = {
            _id: resource._id,
            specialistName: resource.specialistName?.[language] || "",
            resourceName: resource.resourceId?.name?.[language] || "",
            resourceId: resource.resourceId?._id,
            mobileNo: resource.mobileNo,
            alternateNo: resource.alternateNo,
            whatsappNo: resource.whatsappNo,
            email: resource.email,
            shortCode:language,
            address: resource.address?.[language] || "",
            landmark: resource.landmark?.[language] || "",
            city: resource.city?.[language] || "",
            state: resource.state?.[language] || "",
            description: resource.description?.[language] || "",
            pincode: resource.pincode,
            specialistImage: resource.specialistImage ? `${process.env.IMAGE_BASE_URL}/${resource.specialistImage}` : null,
            icon: resource.icon ? `${process.env.IMAGE_BASE_URL}/${resource.icon}` : null,
        };

        return res.status(200).json({ code: "200", status: true, message: "Resource fetched successfully", data: responseData });
    } catch (err) {
        return res.status(500).json({ status: false, message: err.message || "Internal Server Error" });
    }
};



exports.updateResourceItemById = async (req, res) => {
    try {
        const language = req.headers["language"] || req.body.language;
        const { specialistName, mobileNo, email, address, landmark, city, state, description, pincode, resourceId } = req.body;
        const updateQuery = {};
        // Update multilingual and regular fields
        if (specialistName) updateQuery["specialistName." + language] = specialistName;
        if (address) updateQuery["address." + language] = address;
        if (landmark) updateQuery["landmark." + language] = landmark;
        if (city) updateQuery["city." + language] = city;
        if (state) updateQuery["state." + language] = state;
        if (description) updateQuery["description." + language] = description;

        if (mobileNo) updateQuery.mobileNo = mobileNo;
        if (alternateNo) updateQuery.alternateNo = alternateNo;
        if (whatsappNo) updateQuery.whatsappNo = whatsappNo;
        if (email) updateQuery.email = email;
        if (pincode) updateQuery.pincode = pincode;
        if (resourceId) updateQuery.resourceId = resourceId;

        // Upload new specialist image if provided
        if (req.files && req.files?.specialistImage) {
            const imageFile = req.files.specialistImage;
            const imageData = await upload.uploadImage(imageFile);
            if (imageData.status === true) {
                updateQuery.specialistImage = imageData.name;
            } else {
                return res.status(400).json({ status: false, message: imageData.message });
            }
        }

        // Upload new icon if provided
        if (req.files && req.files?.icon) {
            const iconFile = req.files.icon;
            const imageData = await upload.uploadImage(iconFile);
            if (imageData.status === true) {
                updateQuery.icon = imageData.name;
            } else {
                return res.status(400).json({ status: false, message: imageData.message });
            }
        };

        const updatedResource = await NewResourceItem.findByIdAndUpdate(req.params.resourceId, updateQuery, { new: true });
        await updatedResource.save();
        return res.status(201).json({ code: "201", status: true, message: "updateQuery updated successfully" });
    } catch (err) {
        return res.status(500).json({ status: false, message: err.message || "Internal Server Error" });
    }
};


exports.deleteResourceItem = async (req, res) => {
    try {
        const filter = {
            isDeleted: false,
            _id: req.params.resourceId
        };

        const update = {
            isDeleted: true
        };
        const options = { new: true };
        await NewResourceItem.findByIdAndUpdate(filter, update, options);
        return res.status(201).json({ status: true, code: 201, message: "Item resources deleted successfully" });
    } catch (err) {
        return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
    }
}

//Mobile Application New Resource API

exports.allResourcesList = async (req, res) => {
    try {
        const language = req.headers["language"] || req.query.language || "en";
        const pincode = req.query.pincode || null;
        const state = req.query.state ? req.query.state.trim() : null;
        const searchData = req.query.searchData || ""


        const filter = {
            isDeleted: false,
            resourceId: new mongoose.Types.ObjectId(req.query.resourceId),
        };

        const pipeline = [
            {
                $match: filter
            },
            {
                $lookup: {
                    from: "states",
                    localField: "stateId",
                    foreignField: "_id",
                    as: "stateData"
                }
            },
            {
                $unwind: {
                    path: "$stateData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    specialistName: { $ifNull: [`$specialistName.${language}`, ""] },
                    address: { $ifNull: [`$address.${language}`, ""] },
                    landmark: { $ifNull: [`$landmark.${language}`, ""] },
                    city: { $ifNull: [`$city.${language}`, ""] },
                    state: { $ifNull: [`$stateData.label.${language}`, ""] },
                    pincode: 1,
                    mobileNo: 1,
                    email: 1,
                    alternateNo: 1,
                    whatsappNo: 1,
                    specialistImage: {
                        $cond: {
                            if: { $ne: ["$specialistImage", null] },
                            then: { $concat: [process.env.IMAGE_BASE_URL || "", "/uploads/", "$specialistImage"] },
                            else: null
                        }
                    }
                }
            },
            {
                $match: {
                    $and: [
                        { specialistName: { $ne: "" } },
                        { address: { $ne: "" } },
                        { landmark: { $ne: "" } },
                        { city: { $ne: "" } },
                        { state: { $ne: "" } }
                    ]
                }
            }
        ];

        if (searchData) {
            pipeline.push({
                $match: {
                    specialistName: { $regex: searchData, $options: "i" }
                }
            });
        }

        //  Filter non-empty essential fields
        pipeline.push({
            $match: {
                $and: [
                    { specialistName: { $ne: "" } },
                    { address: { $ne: "" } },
                    { landmark: { $ne: "" } },
                    { city: { $ne: "" } },
                    { state: { $ne: "" } }
                ]
            }
        });


        //  Apply optional filters
        if (pincode) {
            pipeline.push({ $match: { pincode: pincode } });
        }

        if (state) {
            pipeline.push({
                $match: {
                    state: { $regex: state, $options: "i" }
                }
            });
        }
        const resources = await NewResourceItem.aggregate(pipeline);
        return res.status(200).json({ code: 200, status: true, message: "Resources fetched successfully", data: resources });

    } catch (err) {
        return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
    }
};


exports.getResourceItemDetailsById = async (req, res) => {
    try {
        const language = req.headers["language"] || req.query.language || "en";
        const resourceId = req.params.resourceId;

        const resource = await NewResourceItem.findOne({ _id: resourceId, isDeleted: false }).populate("stateId");

        if (!resource) {
            return res.status(404).json({ code: 404, status: false, message: "Resource not found" });
        }

        // Language-specific field resolution
        const specialistName = resource.specialistName?.[language] || "";
        const address = resource.address?.[language] || "";
        const landmark = resource.landmark?.[language] || "";
        const city = resource.city?.[language] || "";
        const state = resource.stateId?.label?.[language] || "";
        const description = resource.description?.[language] || "";

        // Return only if key fields are present in selected language
        if (!specialistName || !address || !city || !state) {
            return res.status(200).json({ code: 200, status: false, message: `Data not available in ${language} language`, data: [] });
        }

        const data = {
            _id: resource._id,
            specialistName,
            address,
            landmark,
            city,
            state,
            description,
            whatsappNo: resource.whatsappNo,
            alternateNo: resource.alternateNo,
            pincode: resource.pincode,
            mobileNo: resource.mobileNo,
            email: resource.email,
            // specialistImage: resource.specialistImage ? `${process.env.IMAGE_BASE_URL}/${resource.specialistImage}`: null,
            icon: resource.icon ? `${process.env.IMAGE_BASE_URL}/uploads/${resource.icon}` : null,
        };
        return res.status(200).json({ code: 200, status: true, message: "Resource details fetched successfully", data });
    } catch (err) {
        console.error("Details Error:", err);
        return res.status(500).json({ status: false, message: err.message || "Internal Server Error" });
    }
};


exports.getStateBasePinCode = async (req, res) => {
    try {
        const filter = {
            isDeleted: false,
            stateId: new mongoose.Types.ObjectId(req.query.stateId),
        }
        const getDataQuery = await NewResourceItem.find(filter).select("_id pincode").lean();
        return res.status(200).json({ code: 200, status: true, message: "Get State base pincode successfully", getDataQuery });
    } catch (err) {
        console.error("Details Error:", err);
        return res.status(500).json({ status: false, message: err.message || "Internal Server Error" });
    }
}







