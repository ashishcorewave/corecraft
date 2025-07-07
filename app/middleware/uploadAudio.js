const path = require('path')
const multer = require('multer')

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/audio/')
    },
    filename: function(req, file, cb) {
        let ext = path.extname(file.originalname)
        cb(null, Date.now() + ext)
    }
})

var upload = multer ({
    storage: storage,
    fileFilter: function(req, file, callback) {
        if (file.mimetype == "audio/mpeg" || file.mimetype == "video/mp4" || file.mimetype == "video/mpeg" || file.mimetype == "application/vnd.apple.installer+xml")  {
            callback(null, true)
        } else {
            console.log("not allowed type")
            callback(null, false)
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 2
    }
})

module.exports = upload