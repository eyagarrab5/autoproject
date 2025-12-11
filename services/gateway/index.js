const express = require("express");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 5000;
const servicedecouverteurl = process.env.DISCOVERY_URL || "http://localhost:4000/services";

app.use(express.json());

// Middleware to find target service from discovery
app.use(async (req, res, next) => {
  try {
    const reponse = await axios.get(servicedecouverteurl);
    const services = reponse.data;

    // Route to auth-service
    if (req.path.startsWith("/auth-service")) {
      req.targetService = services.find((s) => s.name === "auth-service");
    } 
    // Route to cars-service
    else if (req.path.startsWith("/cars-service")) {
      req.targetService = services.find((s) => s.name === "cars-service");
    }
    // Route to payment-service
    else if (req.path.startsWith("/payment-service")) {
      req.targetService = services.find((s) => s.name === "payment-service");
    }
    // Route to reservation-service
    else if (req.path.startsWith("/reservation-service")) {
      req.targetService = services.find((s) => s.name === "reservation-service");
    }

    if (req.targetService) {
      req.targetServiceUrl = `${req.targetService.address}:${req.targetService.port}`;
      console.log("Target Service URL: " + req.targetServiceUrl);
      next();
    } else {
      res.status(404).send({ message: "Service non trouvable" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Erreur de connexion au service de decouverte" });
  }
});

// Proxy requests to target service
app.use(async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const reponse = await axios({
      method: req.method,
      url: `${req.targetServiceUrl}${req.originalUrl.replace(
        /^\/(auth-service|cars-service|payment-service|reservation-service)/,
        ""
      )}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      }
    });
    console.log("Response data:", reponse.data);
    res.send(reponse.data);
  } catch (error) {
    console.log("Proxy error:", error.message);
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).send({ message: "Erreur de proxy", error: error.message });
    }
  }
});

app.listen(port, () => {
  console.log("Gateway en execution sur le port " + port);
  console.log("Routes configurees:");
  console.log("  - /auth-service/* -> auth-service");
  console.log("  - /cars-service/* -> cars-service");
  console.log("  - /payment-service/* -> payment-service");
  console.log("  - /reservation-service/* -> reservation-service");
});