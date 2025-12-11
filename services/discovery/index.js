const express = require("express");

const app = express();
const port = process.env.PORT || 4000;

let services = [];

app.use(express.json());

// Register a service
app.post("/register", (req, res) => {
  const { name, address, port } = req.body;
  
  // Check if service already exists and update it
  const existingIndex = services.findIndex((s) => s.name === name);
  if (existingIndex !== -1) {
    services[existingIndex] = { name, address, port };
    console.log("Service mis a jour: " + name);
  } else {
    services.push({ name, address, port });
    console.log("Service enregistre: " + name);
  }
  
  res.json({ message: "Service enregistre avec succes" });
});

// Get all services
app.get("/services", (req, res) => {
  res.json(services);
});

app.listen(port, () => {
  console.log("Service de decouverte en execution sur le port " + port);
});