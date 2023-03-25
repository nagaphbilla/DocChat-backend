const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    fileType: {
        type: String,
        required: true
    },

    path: {
        type: String,
        required: true,
        unique: true
    },

    isShareable: {
        type: Boolean,
        default: false
    },

    url: {
        type: String,
        required: true
    }, 

    size: {
        type: String
    },

    isFile : {
        type : Boolean,
        default : true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("File", fileSchema);