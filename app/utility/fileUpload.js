var fs = require('file-system');
const path = require('path')
const Utility = {
    // uploadAudio: async (file, uploadPath = "uploads/audio/") => {
    //     return new Promise(async resolve => {
    //         var oldpath = file.file;
    //         var fileName = file.filename;
    //         var extension = fileName.split('.').pop();
    //         var newFileName = file.uuid + "." + extension;
    //         var newpath = uploadPath
    //         if (file.mimetype == "audio/mpeg" || file.mimetype == "video/mp4" || file.mimetype == "video/mpeg" || file.mimetype == "application/vnd.apple.installer+xml" || file.mimetype == "audio/x-m4a" || file.mimetype == "audio/vnd.dlna.adts"){
    //             var insertPath = newpath + newFileName;
    //             fs.rename(oldpath, insertPath, function (err_upload) {
    //                 if (err_upload) {
    //                     resolve({ status: false, message : err_upload.stack });
    //                 } else {
    //                     resolve({ status: true, name: newFileName });
    //                 }
    //             })
    //         } else{
    //             resolve({ status: false, message : "upload valid audio file." });
    //         }
    //     })
    // },

    uploadAudio: async (file, uploadPath = "uploads/audio/") => {
        return new Promise(async (resolve) => {
            try {
                if (!file || !file.name || typeof file.mv !== "function") {
                    return resolve({ status: false, message: "Invalid file data" });
                }

                // Ensure uploadPath exists
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }

                const extension = path.extname(file.name); // includes dot, e.g. ".mp3"
                const uuid = Date.now(); // or use your own uuid logic
                const newFileName = uuid + extension;
                const insertPath = path.join(uploadPath, newFileName);

                file.mv(insertPath, (err) => {
                    if (err) {
                        return resolve({ status: false, message: err.message });
                    }
                    resolve({ status: true, name: newFileName });
                });
            } catch (err) {
                resolve({ status: false, message: err.message });
            }
        });
    },

    uploadImage: async (file, uploadPath = "uploads/images/") => {
        return new Promise((resolve) => {
            if (!file || !file.name) {
                resolve({ status: false, message: "Invalid file object received." });
                return;
            }

            const maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxFileSize) {
                resolve({ status: false, message: "File size must be 5MB or smaller." });
                return;
            }

            // const directoryPath = path.join(__dirname, "..", uploadPath);
            const directoryPath = path.join(__dirname, "../../uploads/");
            if (!fs.existsSync(directoryPath)) {
                fs.mkdirSync(directoryPath, { recursive: true }); // Create directory if not exists
            }

            const fileName = file.name;
            const extension = path.extname(fileName);
            const newFileName = `${Date.now()}${extension}`;
            const newFilePath = path.join(directoryPath, newFileName);

            console.log(newFilePath, "newFilePath");

            if (!["image/png", "image/jpeg", "image/gif"].includes(file.mimetype)) {
                resolve({ status: false, message: "Upload a valid image file (PNG, JPEG, GIF)." });
                return;
            }

            file.mv(newFilePath, (err) => {
                if (err) {
                    resolve({ status: false, message: err.message });
                } else {
                    resolve({ status: true, name: newFileName });
                }
            });
        });
    }
}

function saveImage(category, oldpath, insertPath, newFileName) {

    return new Promise(async resolve => {

        var main_app = config.get("app");
        var main_url = `${main_app.main_url}:${main_app.port}`
        var getFileUrl = `${main_url}/${category}/${newFileName}`
        fs.rename(oldpath, insertPath, function (err_upload) {
            if (err_upload) {
                resolve({ status: 0, message: "fail", error: err_upload });
            } else {
                resolve({ status: 1, message: "Success", data: getFileUrl })
            }
        });
    })


}
module.exports = Utility;