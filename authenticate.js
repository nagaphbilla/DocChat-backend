const jwt = require('jsonwebtoken');
 
const verifyUser = (req, res, next) => {
    const { authorization } = req.headers

    if (!authorization) {
        return res.status(400).json({err: "You are not authorized to view this content"})
    }

    const token = authorization.replace("Bearer ", "")
    jwt.verify(token, process.env.SECRET_KEY, (err, payload) => {
        if (err) {
            return res.status(401).json({err: "Invalid Session"})
        }
                
        req.isUserVerified = true
        next()
    });
}

module.exports = verifyUser;

