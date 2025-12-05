const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Route de test
app.get('/service-car', (req, res) => {
    res.json({
        service: 'service-car',
        status: 'running',
        message: 'Service de voiture fonctionnel!',
        timestamp: new Date().toISOString()
    });
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Service de voiture démarré sur http://localhost:${port}`);
});
