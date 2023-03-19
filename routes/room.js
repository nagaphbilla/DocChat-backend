const router = require("express").Router()

const Room = require("../models/roomSchema")
const User = require("../models/userSchema")

function validRoom(data, register) {
    let errors = {}

    if(register == true && (data.name == "" || data.name == null)) {
        errors.name = "Name field is required"
    }

    if(data.maxUsers < 1) {
        errors.maxUsers = "Minimum 1 user should belong to a room"
    }

    if(data.creator == null) {
        errors.creator = "Creator field is required"
    }

    let noOfErrors = Object.keys(errors).length

    return {errors, noOfErrors}
}

router.post("/newRoom", async (req, res) => {
    const {errors, noOfErrors} = validRoom(req.body, true)
    const { name, maxUsers, creator} = req.body
    
    if(noOfErrors > 0) {
        return res.status(400).json(errors)
    }

    var member = []
    member.push(creator)    

    const newRoom = new Room({
        name : name,
        maxUsers : maxUsers,
        members : member
    })

    newRoom.save()
    .then((room) => {
        if(!room) {
            return res.status(401).json({ err : "Failed to create room"} )
        }
        User.findByIdAndUpdate(creator, {
            $push : {rooms : room._id}
        })
        .then(res => console.log(res))

        res.status(200).json(room)
    })
})

module.exports = router