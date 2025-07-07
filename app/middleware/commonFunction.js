const path = require("path");
const fs = require("fs");

const allowedImageFile = [".jpg", ".jpeg", ".png"]; // Define allowed extensions
const constantFilePath = path.join(__dirname, "uploads"); // Define a base path for uploads

module.exports.uploadSingleFile = async (image, folderName, resp) => {
    try {
        const fileExtension = path.extname(image.name).toLowerCase();
        if (!allowedImageFile.includes(fileExtension)) {
            return { status: 422, message: "Please upload images in jpg or png format" };
        }

        let directoryPath = path.join(constantFilePath, folderName);
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }
        const fileName = Date.now() + fileExtension;
        const filePath = path.join(folderName, fileName);
        const storedFilePath = path.join(constantFilePath, filePath);

        await image.mv(storedFilePath);
        return { status: 200, filePath };
    } catch (e) {
        return { status: 500, message: "Files Not Uploaded", error: e.message };
    }
};


module.exports.uploadMultipleFile = async (multipleImage, folderName) => {
    try {

        const allFileExtension = multipleImage.map(image => path.extname(image.name).toLowerCase());
        const isAllValidExt = allFileExtension.every(ext => allowedImageFile.includes(ext));

        if (!isAllValidExt) {
            return { status: 422, message: "Please upload images in jpg or png format" };
        }

        let directoryPath = path.join(constantFilePath, folderName);
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        const allFilePath = await Promise.all(multipleImage.map(async (item, index) => {
            const generateFileName = `${Date.now()}${index}${allFileExtension[index]}`;
            const dbFilePath = path.join(folderName, generateFileName);
            const storeFilePath = path.join(constantFilePath, dbFilePath);

            await item.mv(storeFilePath);
            return dbFilePath;
        }));
        return { status: 200, files: allFilePath };
    } catch (e) {
        return { status: 500, message: "Files Not Uploaded", error: e.message };
    }
};
