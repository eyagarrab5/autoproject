const http = require("http");
const express = require("express");
const mongo = require("mongoose");
const path = require("path");
const axios = require("axios");
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

// register to discovery service
const serviceName = "service-payment";
const discoveryServiceUrl = "http://localhost:4000/register";
const PORT = process.env.PORT || 3010;

const registerService = async (retries = 3, delayMs = 1000) => {
  if (process.env.SKIP_REGISTRATION === 'true') {
    console.log('SKIP_REGISTRATION=true; skipping discovery registration.');
    return;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.post(
        discoveryServiceUrl,
        {
          name: serviceName,
          address: 'http://localhost',
          port: PORT,
        },
        { timeout: 3000 }
      );
      console.log(serviceName + ' bien enregistre', res && res.status ? `status=${res.status}` : '');
      return;
    } catch (error) {
      // Build a richer error object for logging
      const details = {
        message: error && error.message ? error.message : String(error),
        code: error && error.code ? error.code : null,
        stack: error && error.stack ? error.stack.split('\n').slice(0,3).join('\n') : null,
        responseStatus: error && error.response && error.response.status ? error.response.status : null,
        responseData: error && error.response && error.response.data ? error.response.data : null,
        config: error && error.config ? { url: error.config.url, method: error.config.method, timeout: error.config.timeout } : null
      };

      try {
        console.log(`erreur dans d'enregistrement (attempt ${attempt}/${retries}):`, JSON.stringify(details, null, 2));
      } catch (e) {
        console.log(`erreur dans d'enregistrement (attempt ${attempt}/${retries}):`, details);
      }

      if (attempt < retries) {
        const wait = delayMs * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${wait}ms...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      console.log('Registration failed after', retries, 'attempts.');
    }
  }
};
registerService();

app.use("/test", testRouter);
app.use("/voiture", voitureRouter);

// Mount API routes under a distinct path to avoid conflict with the UI route
app.use("/api/payments", paymentRouter);
app.use("/api/payment-transactions", paymentTransactionRouter);
app.use("/api/payment-methods", paymentMethodRouter);
app.use("/api/refunds", refundRouter);
app.use("/api/invoices", invoiceRouter);

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
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
