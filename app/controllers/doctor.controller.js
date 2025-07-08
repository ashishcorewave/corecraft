const Doctor = require('../models/doctor.model');
const userHelper = require('../utility/UserHelper');
const upload = require('../utility/fileUpload');
const mongoose = require('mongoose');

//Created new
exports.createDoctor = async (req, res) => {
    try {
        const token = req.headers['access-token'] || req.headers['authorization'];
        const userDetail = await userHelper.detail(token);
        const { doctorName, category, experience } = req.body;
        const language = req.headers["language"] || req.body.language;
        const newDoctor = new Doctor({
            doctorName: { [language]: doctorName },
            category: JSON.parse(category),
            experience,
            created_by: userDetail.data.user_id,
        });
        if (req.files && req.files.doctorImage) {
            const doctorImageFile = req.files.doctorImage;
            const imageData = await upload.uploadImage(doctorImageFile);
            if (imageData.status === true) {
                newDoctor.doctorImage = imageData.name;
            } else {
                return res.status(400).json({ status: false, message: imageData.message });
            }
        } else {
            return res.status(400).json({ status: false, message: 'A doctorImage file is required.' });
        }
        await newDoctor.save();
        return res.status(201).json({ code: "201", status: true, message: 'Doctor created successfully' });
    } catch (err) {
        return res.status(500).json({ status: false, message: err.message || 'Internal Server Error' });
    }
};


//Created new

exports.getAllDoctors = async (req, res) => {
    try {
        const filter = { isDeleted: false };
        const offset = +req.query.offset || 0; // 0-based indexing
        const perPage = +req.query.perPage || 10;
        const q = req.query.q || "";
        const language = req.query.language || req.headers["language"] || "en";
        let count = await Doctor.countDocuments(filter)
        // Fetch filtered doctors
        const doctors = await Doctor.find(filter).sort({ _id: -1 }).select('_id doctorName experience addedDate isTopDoctor doctorImage').lean();

        // Filter by selected language and optional search string
        const filteredDoctors = doctors.filter((item) => {
            const doctorNameInLang = item.doctorName && item.doctorName[language];
            if (!doctorNameInLang) return false;
            if (q) {
                return doctorNameInLang.toLowerCase().includes(q.toLowerCase());
            }
            return true;
        });
        // Pagination
        const data = filteredDoctors
            .slice(offset, offset + perPage)
            .map((item) => ({
                _id: item._id,
                doctorName: item.doctorName[language],
                experience: item.experience,
                isTopDoctor: item.isTopDoctor,
                addedDate: item.addedDate,
                shortCode:language,
                doctorImage: item.doctorImage ? `${process.env.IMAGE_BASE_URL}/uploads/${item.doctorImage}` : null,
            }));

        return res.status(200).json({ status: true, code: "200", message: "Doctors fetched successfully",   data, count: count  });
    } catch (err) {
        return res.status(500).json({ status: false, code: "500", message: err.message || 'Internal Server Error' });
    }
};

// exports.getAllDoctors = async (req, res) => {
//     try {
//         const filter = { isDeleted: false };

//         // Get the selected language from query or header (default 'en')
//         const language = req.query.language || req.headers["language"] || "en";

//         const doctors = await Doctor.find(filter)
//             .sort({ _id: -1 })
//             .select('_id doctorName experience addedDate isTopDoctor doctorImage')
//             .lean();

//         // Filter and map doctors who have a name in that language
//         const finalData = doctors
//             .filter(item => item.doctorName && item.doctorName[language]) // only if doctor has name in selected language
//             .map(item => {
//                 return {
//                     _id: item._id,
//                     doctorName: item.doctorName[language],
//                     experience: item.experience,
//                     isTopDoctor: item.isTopDoctor,
//                     addedDate: item.addedDate,
//                     doctorImage: item.doctorImage ? `${process.env.IMAGE_BASE_URL}/uploads/${item.doctorImage}` : null
//                 };
//             });

//         return res.status(200).json({ status: true, code: "200", message: "Doctors filtered by language successfully", data: finalData });

//     } catch (err) {
//         return res.status(500).json({ status: false, code: "500", message: err.message || 'Internal Server Error' });
//     }
// };


//Created new
exports.getDoctorByCategory = async (req, res) => {
    try {
        const filter = { isDeleted: false, category: new mongoose.Types.ObjectId(req.query.categoryId) };
        const language = req.query.language || req.headers["language"] || "en";
        const pipeline = [
            {
                $match: {
                    isDeleted: false,
                    category: new mongoose.Types.ObjectId(req.query.categoryId),
                    [`doctorName.${language}`]: { $exists: true, $ne: null, $ne: "" }
                }
            },
            {
                $project: {
                    _id: 1,
                    doctorName: `$doctorName.${language}`
                }
            }
        ]
        const getDoctorByCategoryQuery = await Doctor.aggregate(pipeline);
        return res.status(200).json({ status: true, code: "200", message: "Doctors By Category successfully", data: getDoctorByCategoryQuery });
    } catch (err) {
        return res.status(500).json({ status: false, code: "500", message: err.message || 'Internal Server Error' });
    }
}


exports.isTopDoctorMark = async (req, res) => {
    try {
        const filter = { isDeleted: false, _id: req.body.doctorId };

        const doctor = await Doctor.findOne({
            _id: req.body.doctorId,
            isDeleted: false,
        });

        const update = {
            isTopDoctor: doctor.isTopDoctor === true ? false : true,
        };
        const options = { new: true };

        await Doctor.findByIdAndUpdate(filter, update, options);

        return res.status(201).json({ status: true, code: "201", message: update.isTopDoctor ? "Marked as top doctor" : "Unmarked as top doctor" });
    } catch (err) {
        return res.status(500).json({ status: false, code: "500", message: err.message || 'Internal Server Error' });
    }
}


exports.listOfTopDoctors = async (req, res) => {
    try {
        const language = req.query.language || req.headers["language"] || "en";

        const filter = { isTopDoctor: true, isDeleted: false };

        const pipeline = [
            {
                $match: filter
            },
            {
                $sort: { _id: -1 }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "category", // assumed to be array or single value
                    foreignField: "_id",
                    as: "categoryResult"
                }
            },
            {
                $lookup: {
                    from: "articles",
                    localField: "_id",
                    foreignField: "doctorId",
                    as: "articles"
                }
            },
            {
                $project: {
                    _id: 1,
                    doctorName: { $ifNull: [`$doctorName.${language}`, ""] },
                    doctorImage: 1,
                    experience: 1,
                    articleCount: { $size: "$articles" },
                    categoryName: {
                        $map: {
                            input: "$categoryResult",
                            as: "cat",
                            in: { $ifNull: [`$$cat.name.${language}`, ""] }
                        }
                    }
                }
            }
        ];


        const listOfTopDoctorsQuery = await Doctor.aggregate(pipeline);

        const finalData = listOfTopDoctorsQuery.map(item => ({
            ...item,
            doctorImage: item.doctorImage ? `${process.env.IMAGE_BASE_URL}/uploads/${item.doctorImage}` : null
        }));

        return res.status(200).json({
            status: true,
            code: "200",
            message: "List of top doctors fetched successfully",
            topDoctors: finalData
        });

    } catch (err) {
        return res.status(500).json({
            status: false,
            code: "500",
            message: err.message || 'Internal Server Error'
        });
    }
};


exports.inActiveDoctor = async (req, res) => {
    try {
        const token = req.headers['access-token'] || req.headers['authorization'];
        const userDetail = await userHelper.detail(token);
        const filter = {
            _id: req.body.doctorId,
            isDeleted: false,
        };

        const update = {
            isDeleted: true,
            created_by: userDetail.data.user_id,
        };

        const options = { new: true };
        await Doctor.findByIdAndUpdate(filter, update, options);
        return res.status(201).json({ status: true, code: "201", message: "InActive doctors successfully" });
    } catch (err) {
        return res.status(500).json({ status: false, code: "500", message: err.message || 'Internal Server Error' });
    }
}

//Created New
exports.doctorDetails = async (req, res) => {
    try {
        const language = req.query.language || req.headers["language"] || "en";

        const filter = {
            _id: new mongoose.Types.ObjectId(req.query.doctorId),
            isDeleted: false,
        };

        const doctorDetailsQuery = await Doctor.findOne(filter).select("_id doctorName experience isTopDoctor doctorImage").lean();

        if (!doctorDetailsQuery) {
            return res.status(404).json({ status: false, code: "404", message: "Doctor not found" });
        }
        const doctorNameObj = doctorDetailsQuery.doctorName || {};
        const doctorName = doctorNameObj[language] || "";
        doctorDetailsQuery.doctorName = doctorName;
        doctorDetailsQuery.shortCode = "en";
        if (doctorDetailsQuery?.doctorImage) {
            doctorDetailsQuery.doctorImage = `${process.env.IMAGE_BASE_URL}/uploads/${doctorDetailsQuery.doctorImage}`;
        }

        return res.status(200).json({
            status: true,
            code: "200",
            message: "Get Details of doctor successfully",
            data: doctorDetailsQuery,
        });

    } catch (err) {
        return res.status(500).json({ status: false, code: "500", message: err.message || 'Internal Server Error' });
    }
};


exports.editDoctor = async (req, res) => {
    try {
        const language = req.headers["language"] || req.body.language;
        console.log("Language:", language);

        const updateQuery = {};

        // Multilingual doctorName update
        if (req.body.doctorName) {
            updateQuery["doctorName." + language] = req.body.doctorName;
        }

        // Optional: Experience update
        if (req.body.experience) {
            updateQuery.experience = req.body.experience;
        }

        // Optional: Category update (stringified array)
        if (req.body.category) {
            updateQuery.category = JSON.parse(req.body.category);
        }

        // Optional: doctorImage file update
        if (req.files && req.files.doctorImage) {
            const imageData = await upload.uploadImage(req.files.doctorImage);
            if (imageData.status === true) {
                updateQuery.doctorImage = imageData.name;
            } else {
                return res.send({
                    status: false,
                    message: imageData.message
                });
            }
        }

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            req.body.doctorId,
            updateQuery,
            { new: true }
        );

        if (updatedDoctor) {
            return res.send({ status: true, message: "Doctor updated successfully", data: updatedDoctor });
        } else {
            return res.status(404).send({ status: false, message: "Doctor not found" });
        }

    } catch (err) {
        return res.status(500).send({
            status: false,
            message: err.message || "Internal Server Error"
        });
    }
};
