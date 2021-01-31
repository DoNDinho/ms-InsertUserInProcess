'use strict';
const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.PORT;
const bodyParser = require('body-parser');
const logger = require('./config/log4js_config');
const router = require('./routes/user_routes');
require('./database/database');

// Configurando bodyParser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configurando rutas
app.use(router);

// Iniciando servidor
app.listen(port, () => {
    logger.info('Servidor en puerto', port);
});
