const express = require("express")
const app = express()
const cors = require("cors")
const dotenv = require("dotenv")
const mongoose = require("mongoose")

dotenv.config()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser : true,
    useUnifiedTopology : true
})
.then(console.log("Connected to MongoDB"))
.catch(err => console.log(err))

const port = process.env.PORT || 8082

app.listen(port, () => console.log(`Server running on port ${port}`))
