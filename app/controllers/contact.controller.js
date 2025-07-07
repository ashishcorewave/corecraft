const Contact = require("../models/contact.model.js")
const ContactCategory = require("../models/contactCategory.model.js")
const upload = require("../utility/fileUpload")
const messages = require("../utility/messages")
const userHelper = require("../utility/UserHelper")
const config = require("config");
const mongoose = require('mongoose');

//created new
exports.create = async (req, res) => {
  try {
    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);
    const { category, name, email, contact_number, website, pincode,whatsapp_number, specialization, education, office_hours, institution, city, address, remarks, state } = req.body;
    const language = req.headers["language"] || req.body.language;

    const contacts = new Contact({
      category: category,
      state: state,
      website:website,
      pincode:pincode,
      name: { [language]: name },
      email: email,
      contact_number: contact_number,
      whatsapp_number: whatsapp_number,
      specialization: { [language]: specialization },
      education: { [language]: education },
      office_hours: { [language]: office_hours },
      institution: { [language]: institution },
      city: { [language]: city },
      address: { [language]: address },
      remarks: { [language]: remarks },
      created_by: userDetail.data.user_id,
    });

    if (req.body.latitude && req.body.longitude) {
      contacts.loc.coordinates = [req.body.latitude, req.body.longitude]
    }

    let contactPhoto = req.files?.photo
    if (contactPhoto) {
      let imageData = await upload.uploadImage(contactPhoto);
      if (imageData.status === true) {
        contacts.photo = imageData.name
      } else {
        return res.send({ status: false, message: imageData.message })
      }
    }

    await ContactCategory.updateOne({ _id: category }, { $push: { contacts: contacts._id } });

    await contacts.save();
    return res.status(201).json({ code: "201", status: true, message: 'Contact created successfully' });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || "Internal Server Error" });
  }
}

//created new
exports.getAll = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    const language = req.query.language || req.headers["language"] || "en";

    const aggregationPipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "contactcategories",
          localField: "category",
          foreignField: "_id",
          as: "categoryResult"
        }
      },
      {
        $unwind: {
          path: "$categoryResult",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "states",
          localField: "state",
          foreignField: "_id",
          as: "stateResult"
        }
      },
      {
        $unwind: {
          path: "$stateResult",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          category: 1,
          name: { $ifNull: [`$name.${language}`, ""] },
          email: 1,
          pincode:1,
          contact_number: 1,
          whatsapp_number: 1,
          specialization: { $ifNull: [`$specialization.${language}`, ""] },
          education: { $ifNull: [`$education.${language}`, ""] },
          office_hours: { $ifNull: [`$office_hours.${language}`, ""] },
          institution: { $ifNull: [`$institution.${language}`, ""] },
          city: { $ifNull: [`$city.${language}`, ""] },
          address: { $ifNull: [`$address.${language}`, ""] },
          remarks: { $ifNull: [`$remarks.${language}`, ""] },
          loc: 1,
          state:  { $ifNull: [`$stateResult.label.${language}`, ""] },
          categoryResult: {
            _id: "$categoryResult._id",
            name: { $ifNull: [`$categoryResult.name.${language}`, ""] },
            icon: "$categoryResult.icon",
            created_by: "$categoryResult.created_by",
            contacts: "$categoryResult.contacts"
          }
        }
      },
      {
        $match: {
          name: { $ne: "" }  // Filter: Only include items with non-empty name in that language
        }
      }
    ];

    const finalData = await Contact.aggregate(aggregationPipeline).sort({ _id: -1 });
    return res.status(200).json({ status: true, code: "200", message: `contact category filtered by language successfully`, data: finalData });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
};

//created new
exports.update = async (req, res) => {
  try {
    const language = req.headers["language"] || req.body.language;
    const contactId = req.params.contactId;

    const updateQuery = {};

    // Multilingual fields
    const multilingualFields = [
      "name",
      "specialization",
      "education",
      "office_hours",
      "institution",
      "city",
      "address",
      "remarks"
    ];

    multilingualFields.forEach((field) => {
      if (req.body[field]) {
        updateQuery[`${field}.${language}`] = req.body[field];
      }
    });

    // Non-multilingual fields
    if (req.body.email) updateQuery.email = req.body.email;
    if (req.body.contact_number) updateQuery.contact_number = req.body.contact_number;
    if (req.body.whatsapp_number) updateQuery.whatsapp_number = req.body.whatsapp_number;
    if (req.body.category) updateQuery.category = req.body.category;

    // Location update
    if (req.body.latitude && req.body.longitude) {
      updateQuery["loc"] = {
        type: "Point",
        coordinates: [req.body.latitude, req.body.longitude]
      };
    }

    // Optional: Handle photo update
    let contactPhoto = req.files?.photo;
    if (contactPhoto) {
      let imageData = await upload.uploadImage(contactPhoto);
      if (imageData.status === true) {
        updateQuery.photo = imageData.name;
      } else {
        return res.send({ status: false, message: imageData.message });
      }
    }

    const updated = await Contact.findByIdAndUpdate(contactId, { $set: updateQuery }, { new: true });

    if (!updated) {
      return res.status(404).json({ status: false, code: 404, message: "Contact not found" });
    }

    return res.status(200).json({ status: true, code: 200, message: "Contact updated successfully" });
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || "Internal Server Error" });
  }
};


//created new
exports.getById = async (req, res) => {
  try {
    const language = req.query.language || req.headers["language"] || "en";

    const filter = {
      isDeleted: false,
      _id: new mongoose.Types.ObjectId(req.params.contactId)
    };

    const aggregationPipeline = [
      {
        $match: filter
      },
      {
        $lookup: {
          from: "contactcategories",
          localField: "category",
          foreignField: "_id",
          as: "categoryResult"
        }
      },
      {
        $unwind: {
          path: "$categoryResult",
          preserveNullAndEmptyArrays: true
        }
      },
      {
    $lookup: {
      from: "states",
      localField: "state",
      foreignField: "_id",
      as: "stateResult"
    }
  },
  {
    $unwind: {
      path: "$stateResult",
      preserveNullAndEmptyArrays: true
    }
  },
      {
        $project: {
          _id: 1,
          email: 1,
          contact_number: 1,
          whatsapp_number: 1,
          pincode:1,
          website:1,
          loc:1,
          name: { $ifNull: [`$name.${language}`, ""] },
          city: { $ifNull: [`$city.${language}`, ""] },
          specialization: { $ifNull: [`$specialization.${language}`, ""] },
          education: { $ifNull: [`$education.${language}`, ""] },
          office_hours: { $ifNull: [`$office_hours.${language}`, ""] },
          institution: { $ifNull: [`$institution.${language}`, ""] },
          address: { $ifNull: [`$address.${language}`, ""] },
          remarks: { $ifNull: [`$remarks.${language}`, ""] },
          contactCategoryName: { $ifNull: [`$categoryResult.name.${language}`, ""] },
          state: { $ifNull: [`$stateResult.label.${language}`, ""] },
          stateId: "$stateResult._id",
          contactCategoryId: "$categoryResult._id"
        }
      }
    ];
    const contactQuery = await Contact.aggregate(aggregationPipeline);
    return res.status(200).json({ status: true, code: 200, message: messages.read.success, data: contactQuery[0] })
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

//created new
exports.delete = async (req, res) => {
  try {
    const filter = {
      _id: new mongoose.Types.ObjectId(req.params.contactId),
      isDeleted: false,
    };
    const update = {
      isDeleted: true,
    };

    const options = { new: true };
    await Contact.findByIdAndUpdate(filter, update, options);
    return res.status(201).json({ status: true, code: 201, message: messages.delete.success })
  } catch (err) {
    return res.status(500).json({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}




exports.searchContact = async (req, res) => {
  const { searchQuery } = req.query
  try {
    let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
    limit = limit > config.limit ? config.limit : limit
    let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

    const search = new RegExp(searchQuery, "i")
    const contacts = await Contact.find(
      {
        $or: [{ name: search }, { email: search }]
      },
      {},
      { limit: limit, skip: offset, sort: { _id: -1 } }
    )

    const count = await Contact.find(
      {
        $or: [{ name: search }, { email: search }]
      },
      {},
      {}
    ).count({}, function (err, count) {
      return count
    })

    res.json({
      status: true,
      data: contacts,
      count: count,
      message: messages.read.success
    })
  } catch (error) {
    res.status(404).json({ message: messages.read.error })
  }
}


exports.getContactbyCategoryId = (req, res) => {
  const query = {}
  if (req.params.id) {
    query.category = req.params.id
  }

  let limit = parseInt(req.query.limit ? req.query.limit : config.limit)
  limit = limit > config.limit ? config.limit : limit
  let offset = parseInt(req.query.offset ? req.query.offset : config.offset)

  let count = ""
  Contact.count(query, function (err, countt) {
    count = countt
  })

  Contact.find(query, {}, { limit: limit, skip: offset })
    .then((data) => {
      return res.send({
        status: true,
        message: messages.read.success,
        data: data,
        count: count
      })
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || messages.read.error
      })
    })
}


exports.downloadContact = async (req, res) => {
  let userDetail = await userHelper.detail(req.headers["access-token"])
  if (userDetail.status === 1 && userDetail.data.isAdmin === true) {
    const excel = require("exceljs");

    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet("Contact");

    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Email", key: "email" },
      { header: "Contact Number", key: "contact_number" },
      { header: "Specialization", key: "specialization" },
      { header: "Education", key: "education" },
      { header: "Office Hours", key: "office_hours" },
      { header: "Institution", key: "institution" },
      { header: "City", key: "city" },
      { header: "Address", key: "address" },
      { header: "Remarks", key: "remarks" }
    ];

    // Add Array Rows
    let query = { isDeleted: false }

    let data = await Contact.find(query, { "name.en": 1, email: 1, contact_number: 1, "specialization.en": 1, "education.en": 1, "office_hours.en": 1, "institution.en": 1, "city.en": 1, "address.en": 1, "remarks.en": 1 }).lean()

    if (data.length > 0) {
      let language = "en";
      data.forEach((d) => {
        d.name = d.name[language] ? d.name[language] : (d.name.en || "")
        d.specialization = d.specialization[language] ? d.specialization[language] : (d.specialization.en || "")
        d.education = d.education[language] ? d.education[language] : (d.education.en || "")
        d.office_hours = d.office_hours[language] ? d.office_hours[language] : (d.office_hours.en || "")
        d.institution = d.institution[language] ? d.institution[language] : (d.institution.en || "")
        d.city = d.city[language] ? d.city[language] : (d.city.en || "")
        d.address = d.address[language] ? d.address[language] : (d.address.en || "")
        d.remarks = d.remarks[language] ? d.remarks[language] : (d.remarks.en || "")
      })
    }
    worksheet.addRows(data);

    try {
      const data = await workbook.xlsx.writeFile(`./uploads/temp/contacts.xlsx`)
        .then(() => {
          res.send({
            status: true,
            message: messages.read.success,
            path: `${config.imageUrl}/temp/contacts.xlsx`,
          });
        });
    } catch (err) {
      res.send({
        status: false,
        message: messages.read.error,
      });
    }

  }
}