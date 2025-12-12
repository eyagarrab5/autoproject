const http = require("http");
const express = require("express");
const mongo = require("mongoose");
const path = require("path");
const db = require("./config/dbconnection.json");
mongo
  .connect(db.url, { autoIndex: false })
  .then(() => console.log("database connected"))
  .catch((err) => {
    console.log(err);
  });
const testRouter = require("./routes/test");
const voitureRouter = require("./routes/voiture");
const paymentRouter = require("./routes/payment");
const paymentTransactionRouter = require("./routes/paymentTransaction");
const paymentMethodRouter = require("./routes/paymentMethod");
const refundRouter = require("./routes/refund");
const invoiceRouter = require("./routes/invoice");

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

app.use("/test", testRouter);
app.use("/voiture", voitureRouter);

// Mount API routes under a distinct path to avoid conflict with the UI route
app.use("/api/payments", paymentRouter);
app.use("/api/payment-transactions", paymentTransactionRouter);
app.use("/api/payment-methods", paymentMethodRouter);
app.use("/api/refunds", refundRouter);
app.use("/api/invoices", invoiceRouter);

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
console.log("Server starting...");
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
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
