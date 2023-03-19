const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const roomSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },

    createdBy : {
        type : ObjectId,
        required : true,
        ref : "User"
    },

    members: [{
        type: ObjectId,
        ref: "User"
    }],

    private : {
        type : Boolean,
        default : false
    },

    maxUsers : {
        type : Number,
        required : true
    }
    
})

module.exports = mongoose.model("Room", roomSchema)