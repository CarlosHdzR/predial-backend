const { recordModel } = require('../models/record.model');
const { userModel } = require('../models/user.model');

// Listar registros de actividad de predios:
exports.getRecords = async (req, res) => {
    try {
        const records = await recordModel.find({})
        if (records !== null) {
            return res.send({ status: "ok", msg: "Registros encontrados!!!", records });
        } else {
            return res.send({ status: "error", msg: "Registros NO encontrados!!!" });
        }
    } catch (error) {
        console.log(error)
    }
}

// Crear registro de actividad de predios:
exports.createRecord = async (user_id, action, property_code) => {
    try {
        const record = await new recordModel();
        const user = await userModel.findOne({ _id: user_id });
        record.author = user.name;
        record.author_id = user_id;        
        record.action = action;
        record.property_code = property_code;
        await record.save()
        return record;
    } catch (error) {
        console.log("Error guardando registro: " + error)
    }
}
