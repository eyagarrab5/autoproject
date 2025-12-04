const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.DB_URL)
  .then(() => console.log("DB connected"))
  .catch((err) => console.error("DB connection error:", err));

// Routes
app.use("/voiture", require("./routes/voiture"));
app.use("/reservation", require("./routes/reservation"));
app.use("/contrat", require("./routes/contrat"));
app.use("/user", require("./routes/user"));

// Static files for generated PDFs
app.use("/files", express.static(path.join(__dirname, "uploads", "contrats")));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server running on port", PORT));