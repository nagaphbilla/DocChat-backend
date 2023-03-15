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
        required: true,
        default: false
    },

    url: {
        type: String,
        required: true
    }, 

    size: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("File", fileSchema);