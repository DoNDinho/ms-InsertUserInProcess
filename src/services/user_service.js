'use strict';
const logger = require('../config/log4js_config');
const headerSchema = require('../schemas/header_schema');
const userSchema = require('../schemas/user_schema');
const UsuarioEnProceso = require('../models/UsuarioEnProceso');

class User {
    /**
     * @method
     * @description Valida el request de la solicitud
     * @param {object} req Objeto que contiene request de la solicitud
     */
    validarRequestUser(req, res) {
        const Ajv = require('ajv');
        const ajv = new Ajv();
        let headers = req.headers;
        let body = req.body;
        let valid;

        return new Promise((resolve, reject) => {
            logger.info('Validando request de la solicitud');
            // Validando headers de la solicitud
            valid = ajv.validate(headerSchema, headers);
            if (!valid) {
                logger.error('Solicitud invalida - Headers invalidos!');
                return res.status(400).json({
                    code: '400',
                    message: `${ajv.errors[0].message}`
                });
            } else {
                // Validando body de la solicitud
                valid = ajv.validate(userSchema, body);
                if (!valid) {
                    logger.error('Solicitud invalida - Body invalido!');
                    reject(
                        res.status(400).json({
                            code: '400',
                            message: `${ajv.errors[0].dataPath} - ${ajv.errors[0].message}`
                        })
                    );
                } else {
                    logger.info('Solicitud valida!');
                    resolve(req);
                }
            }
        });
    }

    /**
     * @method
     * @description Funcion que busca email en base de datos
     * @param {String} email Fecha de transaccion
     * @returns {object} Devuelve objeto con datos de usuario en proceso
     */
    async buscarUsuarioPorEmail(email) {
        let usuarioEnProceso;

        logger.info('Buscando email en base de datos');
        usuarioEnProceso = await UsuarioEnProceso.findOne({ email: email });

        return usuarioEnProceso;
    }

    /**
     * @method
     * @description Funcion que suma 10 minutos a fecha actual
     * @param {String} timestamp Fecha de transaccion
     * @returns {String} Devuelve fecha expiracion
     */
    calcularFechaExpiracion(timestamp) {
        let fecha = new Date(timestamp);
        let duracionMin = 10;
        fecha.setMinutes(fecha.getMinutes() + duracionMin);

        let year = fecha.getFullYear();
        let month = fecha.getMonth() + 1 < 10 ? '0' + (fecha.getMonth() + 1) : fecha.getMonth() + 1;
        let day = fecha.getDate() < 10 ? '0' + fecha.getDate() : fecha.getDate();
        let hour = fecha.getHours() < 10 ? '0' + fecha.getHours() : fecha.getHours();
        let minutes = fecha.getMinutes() < 10 ? '0' + fecha.getMinutes() : fecha.getMinutes();
        let seconds = fecha.getSeconds() < 10 ? '0' + fecha.getSeconds() : fecha.getSeconds();

        return `${year}-${month}-${day}T${hour}:${minutes}:${seconds}`;
    }

    /**
     * @method
     * @description Metodo para insertar usuario en proceso
     * @param {String} auth_code Codigo autorizacion de registro
     * @param {String} email Email del usuario
     * @param {String} user_encrypted Datos de usuario encriptado
     * @param {String} fech_exp Fecha expiracion de codigo de autorizacion
     * @param {string} codigoEstado Codigo estado solicitud
     * @param {string} descripcionEstado Descripcion estado solicitud
     * @param {object} res Objeto que contiene respuesta de la solicitud
     * @returns {object} Objeto que contiene respuesta de la solicitud
     */
    insertarUsuarioEnProceso(auth_code, email, user_encrypted, fech_exp, codigoEstado, descripcionEstado, res) {
        // Instancia modelo mongoose
        let usuarioEnProceso = new UsuarioEnProceso({
            auth_code,
            email,
            user_encrypted,
            fech_exp
        });

        logger.info('Insertando usuario en proceso en DB');
        usuarioEnProceso.save((err, usuarioDB) => {
            if (err) {
                logger.error('Error al insertar usuario en proceso en DB: ', err);
                return res.status(422).json({
                    code: err.code,
                    message: err.errmsg
                });
            } else {
                logger.info('Usuario en proceso insertado en DB');
                let response = this.generarResponse(codigoEstado, descripcionEstado, auth_code, email);
                res.json(response);
            }
        });
    }

    /**
     * @method
     * @description valida la fecha de expiracion y su diferencia en segundos
     * @param {string} fech_exp fecha de expiracion
     * @returns {int} Retorna un entero 0=fecha expiro , 1=fecha aun no expira , 2=fecha expira en menos de dos minutos
     */
    validarFechaExpiracion(fech_exp) {
        let fechaActual = new Date();
        let fechaExp = new Date(fech_exp);

        logger.info('Validando fecha expiracion');
        if (fechaActual.getTime() > fechaExp.getTime()) {
            logger.info('Fecha ha expirado');
            // 0 = Fecha expiro
            return 0;
        } else {
            let diferencia = (fechaExp.getTime() - fechaActual.getTime()) / 1000;
            // Valida la diferencia en segundos de ambas fechas
            if (diferencia > 120) {
                logger.info('Fecha aun no expira');
                // 1 = Fecha aun no ha expirado
                return 1;
            } else {
                logger.info('Fecha expira en menos de dos minutos');
                // 2 = Fecha expira en menos de dos minutos
                return 2;
            }
        }
    }

    /**
     * @method
     * @description Metodo para actualizar registro existente
     * @param {String} auth_code Codigo autorizacion de registro
     * @param {String} email Email del usuario
     * @param {String} user_encrypted Datos de usuario encriptado
     * @param {String} fech_exp Fecha expiracion de codigo de autorizacion
     * @param {string} codigoEstado Codigo estado solicitud
     * @param {string} descripcionEstado Descripcion estado solicitud
     * @param {object} res Objeto que contiene respuesta de la solicitud
     * @returns {object} Objeto que contiene respuesta de la solicitud
     */
    modificarUsuarioEnProceso(auth_code, email, user_encrypted, fech_exp, codigoEstado, descripcionEstado, res) {
        // Query para buscar y actualizar registro
        let query = { email };
        // Datos que se deben actualizar
        let update = {
            auth_code,
            user_encrypted,
            fech_exp
        };

        logger.info('Actualizando registro de la BD');
        UsuarioEnProceso.findOneAndUpdate(query, update, (err, usuarioDB) => {
            if (err) {
                logger.error('Error al actualizar registro: ', err);
                return res.status(422).json({
                    error: err
                });
            } else {
                if (!usuarioDB) {
                    logger.error('Registro no existe en BD');
                    return res.status(422).json({
                        code: '422',
                        message: 'Registro no existe en BD'
                    });
                } else {
                    logger.info('Registro BD actualizado');
                    let response = this.generarResponse(codigoEstado, descripcionEstado, auth_code, email);
                    return res.json(response);
                }
            }
        });
    }

    /**
     * @method
     * @description Genera estructura JSON de response de microservicio
     * @param {string} code Codigo estado de solicitud
     * @param {String} message Descripcion estado de solicitud
     * @param {string} auth_code Codigo autorizacion de registro
     * @param {string} email Email de usuario
     * @returns {object} Objeto que contiene respuesta de la solicitud
     */
    generarResponse(code, message, auth_code, email) {
        let response = {
            data: {
                status: {
                    code,
                    message
                },
                auth_code,
                client_data: {
                    email
                }
            }
        };

        return response;
    }
}

module.exports = User;
