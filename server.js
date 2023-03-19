const express = require("express")
const app = express()
const cors = require("cors")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const cloudinary = require("cloudinary").v2

const authRoute = require("./routes/auth")
const roomRoute = require("./routes/room")
const fileRoute = require("./routes/file")
const folderRoute = require("./routes/folder")

dotenv.config()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser : true,
    useUnifiedTopology : true
})
.then(console.log("Connected to MongoDB"))
.catch(err => console.log(err))

app.use("/api/auth", authRoute)
app.use("/api/room", roomRoute)
app.use("/api/file", fileRoute)
app.use("/api/folder", folderRoute)

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
  });

  // const res = cloudinary.uploader.upload('https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg', {public_id: "photos/flags/olympic_flag"})

  // res.then((data) => {
  //   console.log(data);
  //   console.log(data.secure_url);
  // }).catch((err) => {
  //   console.log(err);
  // });

const port = process.env.PORT || 8082

app.listen(port, () => console.log(`Server running on port ${port}`))
