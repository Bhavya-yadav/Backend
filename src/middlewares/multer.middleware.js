import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
  
  // Random file name so there is no name collision. 
  // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
  // cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  
  cb(null, file.originalname)
  }
})

export const upload = multer({ 
  storage,  
})