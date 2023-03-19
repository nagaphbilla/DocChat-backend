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

function validPath(data) {
    let errors = {}

    if(!data.name) {
        errors.name = "Name field is required"
    }

    if(!data.path) {
        errors.path = "Path field is required"
    }

    else if(data.path.slice(0, 2) != "./") {
        errors.Invalidpath = "Path always start with ./"
    }

    // else if(data.path.split('/').at(-1) != data.name) {
    //     errors.Invalidpath = "Path doesn't match with folder name"
    // }

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

router.post('/newFolder', verifyUser, (req, res) => {
    const {errors, noOfErrors} = validPath(req.body)
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

module.exports = router;