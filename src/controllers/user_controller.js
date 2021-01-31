'use strict';
const logger = require('../config/log4js_config');
const User = require('../services/user_service');

exports.user = async (req, res) => {
    try {
        let transactionId = req.headers.transaction_id;
        logger.addContext('transaction_id', transactionId);

        let timestamp = req.headers.timestamp;
        let body = req.body.data;
        let auth_code = body.auth_code;
        let email = body.client_data.email;
        let user_encrypted = body.user_encrypted;
        let codigoEstado = '000';
        let descripcionEstado = 'Usuario en proceso insertado';
        let user = new User();

        try {
            await user.validarRequestUser(req, res);

            let usuarioEnProceso = await user.buscarUsuarioPorEmail(email);
            // Valida si usuario existe en la base de datos
            if (!usuarioEnProceso) {
                logger.info('Email no existe en base de datos');
                let fech_exp = user.calcularFechaExpiracion(timestamp);
                // Funcion para insertar usuario en base de datos
                await user.insertarUsuarioEnProceso(auth_code, email, user_encrypted, fech_exp, codigoEstado, descripcionEstado, res);
                //
            } else {
                logger.info('Email existe en base de datos');
                let fech_exp = usuarioEnProceso.fech_exp;
                let fechaValida = user.validarFechaExpiracion(fech_exp);

                // Valida resultado de funcion validarFechaExpiracion
                switch (fechaValida) {
                    // Fecha expiro
                    case 0:
                        fech_exp = user.calcularFechaExpiracion(timestamp);
                        await user.modificarUsuarioEnProceso(auth_code, email, user_encrypted, fech_exp, codigoEstado, descripcionEstado, res);
                        break;
                    // Fecha aun no ha expirado
                    case 1:
                        auth_code = usuarioEnProceso.auth_code;
                        codigoEstado = '001';
                        descripcionEstado = 'Usuario ya se encuentra en proceso de registro';

                        let response = user.generarResponse(codigoEstado, descripcionEstado, auth_code, email);
                        res.json(response);
                        break;
                    // Fecha expira en menos de dos minutos
                    case 2:
                        fech_exp = user.calcularFechaExpiracion(timestamp);
                        await user.modificarUsuarioEnProceso(auth_code, email, user_encrypted, fech_exp, codigoEstado, descripcionEstado, res);
                        break;
                }
            }
        } catch (err) {
            // Devuelve objeto error
            return err;
        }
    } catch (err) {
        logger.error('Ha ocurrido un error en metodo User in Process Controller: ', err);
        return res.status(500).json({
            code: '500',
            message: 'Internal Server Error'
        });
    }
};
