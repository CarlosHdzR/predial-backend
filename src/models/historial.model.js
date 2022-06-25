const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const historialSchema = new Schema({
    author: {
        type: String
    },
    id_author: {
        type: Number
    },
    action: {
        type: String
    },
    fecha: {
        type: Date
    },
    code: {
        type: String
    }
})

exports.historialModel = mongoose.model("historial", historialSchema);
