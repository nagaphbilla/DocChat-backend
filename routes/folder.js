const router = require('express').Router();
const cloudinary = require('cloudinary').v2;
const Folders = require('../models/folderSchema');
const Files = require('../models/fileSchema');
const verifyUser = require("../authenticate");

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
})

function validPath(data, newFolder) {
    let errors = {}

    if(newFolder && !data.name) {
        errors.name = "Name field is required"
    }

    if(!data.path) {
        errors.path = "Path field is required"
    }

    else if(data.path.slice(0, 2) != "./") {
        errors.Invalidpath = "Path always start with ./"
    }

    else {
        data.path.split('/').forEach(folder => {
            if(!folder) {
                return errors.Invalidpath = "Invalid path"
            }
        })
    }

    let noOfErrors = Object.keys(errors).length

    return {errors, noOfErrors}
}

/* Creating a new Folder */
router.post('/newFolder', verifyUser, (req, res) => {
    const {errors, noOfErrors} = validPath(req.body, true)
    const { path } = req.body

    if(noOfErrors > 0) {
        return res.status(400).json(errors)
    }

    Folders.findOne({ path }).then((folder) => {
        if (folder) {
            return res.status(400).json({ err: "Folder name already exists" })
        }

        Folders.create(req.body).then(folder => {
            if(!folder) {
                return res.status(500).json({ err : "Failed to create folder"})
            }

            var parent_dir = path.split('/').slice(0,-1).join('/')
            console.log(parent_dir)
            Folders.updateOne({ path : parent_dir }, {
                $push : { folders : folder._id}
            }
            )
            .then(parent => {
                if(parent.matchedCount == 0) {
                    Folders.findByIdAndDelete(folder._id).then(() => {
                        return res.status(501).json({ err : "Failed to locate parent folder" })
                    })
                }
                else {
                    res.status(200).json({ message : "Created folder"})
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
      .then((mainFolder) => {
        if (!mainFolder) {
          return res.status(400).json({ err: "Folder you are trying to access is not present" })
        }
  
        const response = mainFolder["folders"].concat(mainFolder["files"])
        res.status(200).json(response)
      })
  })

module.exports = router;