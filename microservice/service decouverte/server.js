const express = require("express");

app = express();
port = 4000;

let services = [];

app.use(express.json());

app.post("/register", (req, res) => {
  const { name, address, port } = req.body;
  services.push({ name, address, port });
  console.log("Service enregistre :" + name);
});
app.get("/services", (req, res) => {
  res.json(services);
});

app.listen(port, console.log("service decouverte est en execution"));
