const mongoose = require("mongoose")

const roomSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    files : {
        type : Array,
        default : []
    }
})

module.exports = mongoose.model("Room", roomSchema)