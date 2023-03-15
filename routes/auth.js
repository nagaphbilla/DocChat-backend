const router = require("express").Router()
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const User = require("../models/userSchema")

function validAuth(data, register) {
    let errors = {}

    if(data.email == "" || data.email == null) {
        errors.email = "Email field is required"
    }

    if(register == true && (data.name == "" || data.name == null)) {
        errors.name = "Name field is required"
    }

    if(data.password == "" || data.password == null) {
        errors.password = "Password is required"
    }
    else if(data.password.length < 8) {
        errors.password = "Password must contain atleast 8 characters"
    }

    let noOfErrors = Object.keys(errors).length

    return {errors, noOfErrors}
}

router.post("/register", async (req, res) => {
    const {errors, noOfErrors} = validAuth(req.body, true)

    if(noOfErrors > 0) {
        return res.status(400).json(errors)
    }

    User.findOne({email : req.body.email})
    .then(user => {
        if(user) {
            return res.status(401).json({ email : "Email already exists"})
        }
            const newUser = new User({
                name : req.body.name,
                email : req.body.email,
                password : req.body.password
            })

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if(err)
                        throw err
                    newUser.password = hash
                    newUser.save()
                    .then(user => {
                        if(!user) {
                            return res.status(500).json({ err : "Unable to update database"})
                        }
                        res.status(200).json(user)
                    })
                })
            })
        }
    )
})

router.post("/login", (req, res) => {
    const {errors, noOfErrors} = validAuth(req.body, false)

    if(noOfErrors > 0) {
        return res.status(400).json(errors)
    }

    const {email, password} = req.body

    User.findOne({ email })
    .then(user => {
        if(!user) {
            return res.status(404).json({ emailNotFound : "Email doesn't exist"})
        }

        bcrypt.compare(password, user.password)
        .then(matched => {
            if(matched) {
                const payload = {
                    id : user.id,
                    email
                }
                jwt.sign(
                    payload,
                    process.env.SECRET_KEY,
                    {
                        expiresIn : "365d"
                    },
                    (err, token) => {
                        user["password"] = undefined
                        res.status(200).json(
                            {"user" : user,
                            "token" :
                            {
                            success : true,
                            token : "Bearer " + token
                            }
                        }
                        )
                    }
                )
            }
            else {
                res.status(400).json({passwordIncorrect : "Password is incorrect"})
            }
        })
    })
})

module.exports = router