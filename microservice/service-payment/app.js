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
const voitureRouter = require("./routes/voiture");
const paymentRouter = require("./routes/payment");

const app = express();
app.use(express.json());

// Set view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");

// Main routes
app.get("/", (req, res) => {
  res.render("payment");
});
app.get("/payment", (req, res) => {
  // Render the UI page for payments
  res.render("payment");
});

// register to discovery service
const serviceName = "service-payment";
const discoveryServiceUrl = "http://localhost:4000/register";

const registerService = async () => {
  try {
    await axios.post(discoveryServiceUrl, {
      name: serviceName,
      address: "http://localhost",
      port: 3000,
    });
    console.log(serviceName + " bien enregistre");
  } catch (error) {
    console.log("erreur dans d'enregistrement :" + error.message);
  }
};
registerService();

app.use("/test", testRouter);
app.use("/voiture", voitureRouter);

// Mount API routes under a distinct path to avoid conflict with the UI route
app.use("/api/payments", paymentRouter);

const server = http.createServer(app);
console.log("Server running");
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
