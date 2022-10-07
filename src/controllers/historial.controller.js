const { historialModel } = require('../models/historial.model');

// Listar historial de actividad de predios:
exports.getHistorial = async (req, res) => {
    try {
        const historial = await historialModel.find({})
        if (historial !== null) {
            return res.send({ status: "ok", msg: "Historial encontrado!!!", historial });
        } else {
            return res.send({ status: "error", msg: "Historial NO encontrado!!!" });
        }
    } catch (error) {
        console.log(error)
    }
}

// Crear historial de actividad de predios:
exports.createHistorial = (user, action, codigo) => {
    try {
        const historial = new historialModel()
        historial.author = user.name
        historial.action = action
        historial.fecha = Date.now()
        historial.code = codigo
        historial.save()
        return historial;
    } catch (error) {
        console.log("Error guardando historial: " + error)
    }
}
