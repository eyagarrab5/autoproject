const http = require('http');
const express = require('express');
const mongo = require('mongoose');
const db = require('./config/dbconnection.json');

mongo.connect(db.url)
  .then(
    console.log('database connected')
  )
  .catch((err) => {
    console.log(err);
  });



const app = express();
app.use(express.json());


const server = http.createServer(app);
console.log('Serveur en cours de démarrage...');

server.listen(3000, () => {
  console.log('Serveur lancé sur le port 3000');
});
