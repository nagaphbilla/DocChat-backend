const router = require("express").Router()

const Room = require("../models/roomSchema")
const User = require("../models/userSchema")
const verifyUser = require("../authenticate");

function validRoom(data, newRoom) {
    let errors = {}

    if(newRoom == true) {
        if(data.name == "" || data.name == null) {
            errors.name = "Name field is required"
        }
    
        if(data.maxUsers < 1) {
            errors.maxUsers = "Minimum 1 user should belong to a room"
        }
    }
    if(data.user == null || data.user == "") {
        errors.user = "User field is required"
    }
    if(!newRoom && (data.room == "" || data.room == null)) {
        errors.room = "Room field is required"
    }

    let noOfErrors = Object.keys(errors).length

    return {errors, noOfErrors}
}

router.post("/newRoom", verifyUser, async (req, res) => {
    const {errors, noOfErrors} = validRoom(req.body, true)
    const { name, maxUsers, user} = req.body
    
    if(noOfErrors > 0) {
        return res.status(400).json(errors)
    }

    var member = []
    member.push(user)    

    const newRoom = new Room({
        name : name,
        maxUsers : maxUsers,
        members : member,
        createdBy : user
    })

    newRoom.save()
    .then((room) => {
        if(!room) {
            return res.status(401).json({ err : "Failed to create room"} )
        }
        User.findByIdAndUpdate(user, {
            $push : {rooms : room._id}
        })
        .then(user => {
            res.status(200).json(user)
        })
    })
})

router.post("/joinRoom", verifyUser, async (req, res) => {
    const {errors, noOfErrors} = validRoom(req.body, false)
    const { user, room } = req.body
    
    if(noOfErrors > 0) {
        return res.status(400).json(errors)
    }

    User.findByIdAndUpdate(user, {
        $addToSet : { rooms : room }
    }, { new : true })
    .then(newUser => {
        Room.findByIdAndUpdate(room, {
            $addToSet : { members : user }
        })
        .then(() => res.status(200).json(newUser))
    })
})

module.exports = router