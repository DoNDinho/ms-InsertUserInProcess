const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usuarioSchema = new Schema({
    auth_code: Number,
    email: String,
    user_encrypted: String,
    fech_exp: String,
    registered: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('UsuarioEnProceso', usuarioSchema);
