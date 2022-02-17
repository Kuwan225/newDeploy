require("dotenv").config();
const express = require("express");
const sequelize = require("./models/index").sequelize;
const { DataTypes } = require("sequelize");
const User = require("./models/user")(sequelize, DataTypes);
const app = express();
const { hash, compare } = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const port = process.env.PORT || 3000;

const p = require("path");

const storage = multer.diskStorage({
  destination: p.join(__dirname + "/upload"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 3000);
    const splittedFormat = file.mimetype.split("/");
    const extension = splittedFormat[splittedFormat.length - 1];
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + extension);
  },
});

const upload = multer({ storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/upload", express.static(p.join(__dirname + "/upload")));

app.post("/upload_file", upload.single("img"), async (req, res) => {
  console.log(req.file);
  res.status(202).json({ data: req.file });
});

app.post("/create", async (req, res) => {
  try {
    const saltRound = 10;
    const hashPassword = await hash(req.body.password, saltRound);
    const data = await User.create({
      username: req.body.username,
      password: hashPassword,
      email: req.body.email,
    });
    res.status(202).json({ message: "berhasil buat data", data: data });
  } catch (error) {
    res.status(404).json({ message: error.errors[0].message });
  }
});

app.get("/get", async (req, res) => {
  try {
    const data = await User.findAll();
    data.length > 0
      ? res.status(202).json({ message: "berhasil ambil data", data: data })
      : res.status(404).json({ message: "tidak ada data" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

app.get("/get_user", async (req, res) => {
  try {
    const data = await User.findAll({
      offset: JSON.parse(req.query.page),
      limit: JSON.parse(req.query.size),
    });
    data.length > 0
      ? res.status(202).json({ message: "berhasil ambil data", data: data })
      : res.status(404).json({ message: "tidak ada data" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

app.get("/get_one/:id", async (req, res) => {
  try {
    const data = await User.findOne({
      where: {
        id: req.params.id,
      },
    });
    res.status(202).json({ message: "berhasil ambil 1 data", data: data });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

app.put("/update/:id", async (req, res) => {
  try {
    const data = await User.update(
      {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
      },
      {
        where: { id: req.params.id },
      }
    );
    data > 0
      ? res.status(202).json({ message: "berhasil update data" })
      : res.status(404).json({ message: "data tidak ada" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

app.delete("/delete/:id", async (req, res) => {
  try {
    const data = await User.destroy({
      where: { id: req.params.id },
    });
    data > 0
      ? res.status(202).json({ message: "berhasil hapus data" })
      : res.status(404).json({ message: "data tidak ada" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

const autentication = async (req, res, next) => {
  const token = req.headers.authorization;
  const user = jwt.decode(token, "sadboy");
  !user || !token
    ? res.status(405).json({ message: "Login atau register dulu" })
    : res.status(202).json({ message: "login berhasil" });
  next();
};

app.post("/login", autentication, async (req, res) => {});

app.listen(port, console.log(`Listen at PORT ${port}`));
