const path = require('path')
const multer = require('multer')
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
var storage = multer.diskStorage({
    
    destination: function(req, file, cb) {
        console.log("Inside destination function");
        cb(null, 'uploads/');
    },
    
    filename: function(req, file, cb) {
        let ext = path.extname(file.originalname)
        cb(null, Date.now() + ext)
    }
})

var upload = multer ({
    storage: storage,
    fileFilter: function(req, file, callback) {
        console.log("Inside fileFilter, file type:", file.mimetype);
        
        if (file.mimetype == "image/png" || file.mimetype == "image/jpeg" || file.mimetype == "application/octet-stream") {
            callback(null, true);
        } else {
            console.log("Not allowed type");
            callback(null, false);
        }
    },
    
    limits: {
        fileSize: 1024 * 1024 * 2
    }
})

module.exports = upload