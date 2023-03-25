const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const folderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    folders: [{
        type: ObjectId,
        ref: "Folder"
    }],

    files: [{
        type: ObjectId,
        ref: "File"
    }],

    path: {
        type: String,
        required: true,
        unique: true,
    },

    isFile : {
        type : Boolean,
        default : false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Folder", folderSchema);