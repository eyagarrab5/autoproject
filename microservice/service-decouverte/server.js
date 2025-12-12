const express = require("express");

const app = express();
const PORT = process.env.PORT || 4000;

let services = [];

app.use(express.json());

app.post("/register", (req, res) => {
  const { name, address, port } = req.body;
  services.push({ name, address, port });
  console.log("Service enregistre :" + name);
  res.status(201).json({ registered: true });
});
app.get("/services", (req, res) => {
  res.json(services);
});

app.listen(PORT, () => console.log(`Discovery service running on ${PORT}`));
