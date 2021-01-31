const logger = require('../config/log4js_config');
const mongoose = require('mongoose');
const URIDB = process.env.URIDB;

mongoose
    .connect(URIDB, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then((db) => logger.info('Conectado a Base de Datos'))
    .catch((err) => logger.error('Error al conectar a DB', err));
