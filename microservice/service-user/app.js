const http = require("http");
const express = require("express");
const mongo = require("mongoose");
const path = require("path");
const axios = require("axios");
const db = require("./config/dbconnection.json");
mongo
  .connect(db.url)
  .then(console.log("database connected"))
  .catch((err) => {
    console.log(err);
  });
const testRouter = require("./routes/test");
//const voitureRouter = require("./routes/voiture");

const app = express();
const serviceName = "monservice user";
const discovryserviceurl = "http://localhost:4000/register";

const registerService = async () => {
  try {
    await axios.post(discovryserviceurl, {
      name: "service-user",
      address: "http://localhost",
      port: 3000,
    });
    console.log(serviceName + "bien enregistre");
  } catch (error) {
    console.log("erreur dans d'enregistrement :" + error.message);
  }
};
registerService();

app.use(express.json());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");

app.use("/test", testRouter);
//app.use("/voiture", voitureRouter);
app.get("/", (req, res) => {
  res.send("bienvenue dans votre service : " + serviceName);
});

const server = http.createServer(app, console.log("server run"));
const io = require("socket.io")(server);
io.on("connection", (socket) => {
  socket.emit("msg", "user connected");

  socket.on("send", (data) => {
    io.emit("send", data);
  });

  socket.on("disconnect", () => {
    io.emit("msg", "user disconnect");
  });
});
server.listen(3000);
