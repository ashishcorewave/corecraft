const Category = require("../models/articleCategory.model")
const messages = require("../utility/messages")
const config = require("config")
const upload = require("../utility/fileUpload")
const userHelper = require('../utility/UserHelper');

//Created New
exports.create = async (req, res) => {
  try {
    const token = req.headers['access-token'] || req.headers['authorization'];
    const userDetail = await userHelper.detail(token);

    const { name } = req.body;
    const language = req.headers["language"] || req.body.language;

    const insertQuery = new Category({
      name: { [language]: name },
      created_by: userDetail.data.user_id,
    });

    if (req.files && req.files.icon) {
      const iconFile = req.files.icon;
      const imageData = await upload.uploadImage(iconFile);

      if (imageData.status === true) {
        insertQuery.icon = imageData.name;
      } else {
        return res.status(400).json({ status: false, message: imageData.message });
      }
    } else {
      return res.status(400).json({ status: false, message: 'A icon file is required.' });
    }

    await insertQuery.save();
    return res.status(201).json({ code: "201", status: true, message: 'Category created successfully' });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message || 'Internal Server Error' });
  }
}

//Created New
exports.getAll = async (req, res) => {
  try {
    const filter = { isDeleted: false };

    const offset = +req.query.offset || 0; // 0-based indexing
    const perPage = +req.query.perPage || 10;
    const q = req.query.q || "";
    let count = await Category.countDocuments(filter)

    const language = req.query.language || req.headers["language"] || "en";
    const category = await Category.find(filter).sort({ _id: -1 }).select("_id name icon isTopCategory addedDate").lean();

    const filteredCategory = category.filter((item) => {
      const categoryInLang = item.name && item.name[language];
      if (!categoryInLang) return false;
      if (q) {
        return categoryInLang.toLowerCase().includes(q.toLowerCase());
      }
      return true;
    });

    const data = filteredCategory
      .filter(item => item.name && item.name[language]).slice(offset, offset + perPage)
      .map(item => {
        return {
          _id: item._id,
          name: item.name[language],
          experience: item.experience,
          isTopCategory: item.isTopCategory,
          addedDate: item.addedDate,
          shortCode: language,
          icon: item.icon ? `${process.env.IMAGE_BASE_URL}/uploads/${item.icon}` : null
        };
      });
    return res.status(200).json({ status: true, code: "200", message: "Category filtered by language successfully", data, count: count });
  } catch (err) {
    return res.status(500).json({ status: false, messages: err.message || 'Internal Server Error' });
  }
}

//Created New
exports.getById = (req, res) => {
  let language = req.headers["language"] ? req.headers["language"] : (req.query.language ? req.query.language : "en")
  Category.findById(req.params.categoryId).lean()
    .then((data) => {
      if (data) {
        data.name = data.name[language] ? data.name[language] : ""
        // data.icon = data.icon ? config.categoryImageUrl + data.icon : config.defaultImageUrl
        data.icon = data.icon ? `${process.env.BASE_URL}/uploads/${data.icon}` : null;
        return res.send({
          status: true,
          message: messages.read.success,
          data: data
        })
      }
      return res.status(404).send({
        message: messages.read.error
      })
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          message: messages.read.error
        })
      }
      return res.status(500).send({
        message: messages.read.error
      })
    })
}


//Created New
exports.update = async (req, res) => {
  try {
    const language = req.headers["language"] || req.body.language;
    const updateQuery = {};

    if (req.body.name) {
      updateQuery["name." + language] = req.body.name;
    }

    if (req.files && req.files?.icon) {
      const imageData = await upload.uploadImage(req.files.icon);
      if (imageData.status === true) {
        updateQuery.icon = imageData.name;
      } else {
        return res.send({ status: false, message: imageData.message });
      }
    };
    const updatedCategory = await Category.findByIdAndUpdate(req.params.categoryId, updateQuery, { new: true });
    if (updatedCategory) {
      return res.send({ status: true, message: "Category updated successfully" });
    } else {
      return res.status(404).send({ status: false, message: "Category not found" });
    }
  } catch (err) {
    return res.status(500).json({ status: false, messages: err.message || 'Internal Server Error' });
  }
}



exports.delete = (req, res) => {
  Category.findByIdAndUpdate(req.params.categoryId, { isDeleted: true }, { new: true })
    .then((data) => {
      if (data) {
        return res.send({ status: true, message: messages.delete.success })
      }
      return res.status(404).send({
        message: messages.delete.error
      })
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          message: messages.delete.error
        })
      }
      return res.status(500).send({
        message: messages.delete.error
      })
    })
}


exports.isTopCategoryMark = async (req, res) => {
  try {
    const filter = { isDeleted: false, _id: req.body.categoryId };

    const category = await Category.findOne({
      _id: req.body.categoryId,
      isDeleted: false,
    });

    const update = {
      isTopCategory: category.isTopCategory === true ? false : true,
    };
    const options = { new: true };

    await Category.findByIdAndUpdate(filter, update, options);
    return res.status(201).json({ status: true, code: "201", message: update.isTopCategory ? "Marked as top category" : "Unmarked as top category" });
  } catch (err) {
    return res.status(500).json({ status: false, code: "500", message: err.message || 'Internal Server Error' });
  }
}



exports.listOfTopCategory = async (req, res) => {
  try {
    const searchData = (req.query.searchData || "").trim();
    const language = req.query.language || req.headers['language'] || 'en';

    const filter = {
      isTopCategory: true
    };

    const pipeline = [
      { $match: filter },
      {
        $addFields: {
          localizedName: {
            $ifNull: [`$name.${language}`, ""]
          }
        }
      }
    ];

    // Add search condition if searchData is provided
    if (searchData) {
      pipeline.push({
        $match: {
          localizedName: {
            $regex: searchData,
            $options: "i"
          }
        }
      });
    }

    pipeline.push({
      $project: {
        icon: 1,
        name: 1,
        localizedName: 1
      }
    });

    const listOfTopCategoryQuery = await Category.aggregate(pipeline);

    // Final formatting
    const finalData = listOfTopCategoryQuery
      .map(item => {
        const name = item.name?.[language] || "";
        return {
          _id: item._id,
          icon: item.icon ? `${process.env.IMAGE_BASE_URL}/uploads/${item.icon}` : null,
          name: name.trim()
        };
      })
      .filter(item => item.name); // Filter out if name is empty

    return res.status(200).json({ status: true, code: "200", message: "List of top category fetched successfully", topCategories: finalData });

  } catch (err) {
    return res.status(500).json({ status: false, code: "500", message: err.message || 'Internal Server Error' });
  }
};

exports.allCategory = async (req, res) => {
  try {
    const filter = {
      isDeleted: false
    };
    const language = req.query.language || req.headers["language"] || "en";
    const category = await Category.find(filter).sort({ _id: -1 }).select("_id name ").lean();
    const data = category
      .filter(item => item.name && item.name[language])
      .map(item => {
        return {
          _id: item._id,
          name: item.name[language],
        };
      });
    return res.status(200).json({ status: true, code: "200", message: "Category filtered by language successfully", data: data });

  } catch (err) {
    return res.status({ status: false, code: 500, message: err.message || 'Internal Server Error' });
  }
}

