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

    // else if(data.path.slice(0, 2) != "./" || dir.at(-1) != data.name || dir.length < 3) {
    else if(data.path.slice(0, 2) != "./" || data.path.split('/').at(-1) != data.name) {
        errors.path = "Invalid path"
    }

    else {
        data.path.split('/').forEach(folder => {
            if(!folder) {
                return errors.path = "Invalid path"
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


router.post('/downloadFolder', verifyUser, (req, res) => {
    const { path } = req.body;
    Folders.findOne({ path }).then((folder) => {
        if (!folder) {
            res.statusCode = 422;
            res.setHeader('Content-Type', 'application/json');
            res.json({err: "Folder not present"});
            return;
        }

        if (folder.folders.length == 0 && folder.files.length == 0) {
            res.statusCode = 422;
            res.setHeader('Content-Type', 'application/json');
            res.json({err: "Cannot download empty folder"});
            return;
        }
        var url = cloudinary.utils.download_zip_url({
            prefixes: ['myFiles' + path]
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({url});
    });
});

/* Async while loop */
function asyncLoop(iterations, func, callback, foo) {
    var done = false;
    var loop = {
        next: function () {
            if (done) {
                return;
            }

            if (iterations) {
                func(loop);

            } else {
                done = true;
                if (callback) callback(foo);
            }
        },

        isEnd: function () {
            return done;
        },

        refresh: function (it) {
            iterations = it;
        },

        break: function () {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
}

function bfs (_id ,callback){
    var q = [], subFolders = [], subFiles = [];
    q.push(_id);

    asyncLoop(q.length, function (loop) {
        subFolders.push(q[0]);
        Folders.findOne({ _id: q[0] }).lean().exec(function (err, folder) {
            if (!folder) {
                q.shift();
                loop.next()
            }
            else {
                var sub_folders = folder.folders;
                var sub_files = folder.files;
                if (sub_files.length > 0) {
                    sub_files.forEach(file => {
                        subFiles.push(file);
                    });
                }
                if (err) {
                    console.log(err);
                }
                else {
                    q.shift();
                    loop.refresh(sub_folders.length + q.length);
                    if (sub_folders.length > 0) {
                        sub_folders.forEach(element => {
                            q.push(element);
                        });
                    }
                    loop.next();
                }
            }
        });
    },function(){ callback(subFolders, subFiles) });

}

/* Deleting a Folder */
router.post('/deleteFolder', verifyUser, (req, res) => {
    const { path } = req.body

    let dir = path.split('/')

    if (dir.length < 3) {
        return res.status(400).json({ err : "Cannot delete root folder!"})
    }

    Folders.findOne({ path }).then(folder => {
        if(!folder) {
            return res.status(401).json({ err : "Folder does not exists"})
        }

        var parent_dir = path.split('/').slice(0,-1).join('/')
        console.log(parent_dir)
        Folders.updateOne({ path : parent_dir }, {
            $pull : { folders : folder._id}
        }
        )
        .then(parent => {
            if(parent.matchedCount == 0) {
                return res.status(501).json({ err : "Cannot delete the folder from parent directory" })
            }
        })
    })

    Folders.findOne({ path: path }).lean().exec(function (err, root) {
        // if (err) {
        //     res.statusCode = 422;
        //     res.setHeader('Content-Type', 'application/json');
        //     res.json({err});
        //     return;
        // }

        // Folders.findOneAndUpdate({ path: parent_dir }, {
        //     $pull: { folders: root._id }
        // }, { new: true }, (err, result) => {
        //     if (err) {
        //         res.statusCode = 422;
        //         res.setHeader('Content-Type', 'application/json');
        //         res.json({ err: "Cannot delete the folder from parent directory" });
        //         return;
        //     }
        // });

        bfs(root._id, (folders, files) => {
            console.log(folders);
            console.log(files);

            Folders.deleteMany({_id: { $in: folders}}, function (err) {
                if(err) console.log(err);
                console.log("SubFolders deleted");
            });
            Files.deleteMany({_id: { $in: files}}, function (err) {
                if(err) console.log(err);
                console.log("SubFiles deleted");
            });

            cloudinary.api.delete_resources_by_prefix('myFiles' + path, (err, result) => {
                console.log(result, err);
                cloudinary.api.delete_folder('myFiles' + path, (err, result) => {
                    console.log(result, err);
                });
            });
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({msg: "Folder deleted!"});
    });
});

module.exports = router;