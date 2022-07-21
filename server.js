require("dotenv").config();
const bcrypt = require("bcrypt");
const multer = require("multer");
const mongoose = require("mongoose");
const express = require("express");
const File = require("./models/File");
const app = express();
const upload = multer({ dest: "uploads" });
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
mongoose.connect(process.env.DATABASE_URL, {}, () => {
  console.log("connected to db");
});
app.get("/", (req, res) => {
  res.render("index");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const fileData = {
    path: req.file.path,
    originalName: req.file.originalname,
  };
  if (req.body.password != null && req.body.password !== "") {
    fileData.password = await bcrypt.hash(req.body.password, 10);
  }
  const file = await File.create(fileData);
  res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` });
});
app.route("/file/:id").get(handelDonwload).post(handelDonwload);

async function handelDonwload(req, res) {
  const file = await File.findById(req.params.id);
  if (file.password != null) {
    if (req.body.password == null) {
      res.render("password");
      return;
    }
    if (!(await bcrypt.compare(req.body.password, file.password))) {
      res.render("password", { error: true });
      return;
    }
  }
  file.downloadCount++;
  await file.save();
  console.log(file.downloadCount);

  res.download(file.path, file.originalName);
}
app.listen(process.env.PORT);
