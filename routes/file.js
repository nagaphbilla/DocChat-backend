const router = require("express").Router();
const cloudinary = require("cloudinary").v2;
const Files = require("../models/fileSchema");
const Folders = require("../models/folderSchema");
const verifyUser = require("../authenticate");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
})

function validPath(data, newFile) {
  let errors = {}

  if(newFile) {
    if(!data.name) {
      errors.name = "Name field is required"
    }
    if(!data.fileType) {
      errors.fileType = "File Type field is required"
    }
    if(!data.url) {
      errors.fileUrl = "File URL field is required"
    }    
  }

  if(!data.path) {
      errors.path = "Path field is required"
  }

  else if(data.path.slice(0, 2) != "./") {
      errors.Invalidpath = "Path always starts with ./"
  }

  else if(newFile && data.path.split('/').at(-1) != data.name + '.' + data.fileType) {
      errors.Invalidpath = "Path doesn't match with file name"
  }

  else {
      data.path.split('/').forEach(folder => {
          if(!folder) {
              return errors.Invalidpath = "Invalid Path"
          }
      })
  }

  let noOfErrors = Object.keys(errors).length

  return {errors, noOfErrors}
}

/* Creating a new File */
router.post("/newFile", verifyUser, (req, res) => {
  const {errors, noOfErrors} = validPath(req.body, true)
  const { path } = req.body

  if(noOfErrors > 0) {
      return res.status(400).json(errors)
  }
  
  Files.findOne({ path }).then((file) => {
    if (file) {
        return res.status(400).json({ err: "File already exists" })
    }

    Files.create(req.body).then(file => {
        if(!file) {
            return res.status(500).json({ err : "Failed to upload file"})
        }
        var parent_dir = path.split('/').slice(0,-1).join('/')
        console.log(parent_dir)
        Folders.updateOne({ path : parent_dir }, {
            $push : { files : file._id}
        }
        )
        .then(parent => {
            if(parent.matchedCount == 0) {
                Files.findByIdAndDelete(file._id).then(() => {
                    return res.status(501).json({ err : "Failed to locate parent folder" })
                })
            }
            else {
                res.status(200).json({ message : "Uploaded file" })
            }

        })

    })
})
})

/*Getting all the files and folders */
router.post("/getFiles", verifyUser, (req, res) => {
  const {errors, noOfErrors} = validPath(req.body, false)
  const { path } = req.body

  if(noOfErrors > 0) {
      return res.status(400).json(errors)
  }

  Folders.findOne({ path })
    .populate("folders")
    .populate("files")
    .then((folder) => {
      if (!folder) {
        return res.status(400).json({ err: "Folder you are trying to access is not present" })
      }

      res.status(200).json({ folder })
    })
})

/* Deleting a File */
router.post("/deleteFile", verifyUser, (req, res) => {
  const {errors, noOfErrors} = validPath(req.body, false)
  const { path } = req.body

  if(noOfErrors > 0) {
      return res.status(400).json(errors)
  }

  Files.findOne({ path }).then(file => {
    if(!file) {
      return res.status(400).json({ err : "File does not exists" })
    }

    var parent_dir = path.split('/').slice(0,-1).join('/')
    console.log(parent_dir)
    Folders.updateOne({ path : parent_dir }, {
      $pull : { files : file._id}
  }
  )
  .then(parent => {
      if(parent.matchedCount == 0) {
          return res.status(501).json({ err : "Cannot delete the file from parent directory" })
      }

      Files.findByIdAndDelete(file._id)
      .then(deletedFile => {
        if(!deletedFile) {
          return res.status(502).json({ err : "Failed to delete file" })
        }

        res.status(200).json({ message : "Deleted file" })
      })
  })
  })

  // Files.deleteOne({ _id: id }).then(() => {
  //   console.log("File deleted in mongodb");
  //   cloudinary.uploader.destroy("myFiles" + path, function (error, result) {
  //     console.log(result, error)
  //     res.status(200).json(result)
  //   })
  // })
})

module.exports = router
