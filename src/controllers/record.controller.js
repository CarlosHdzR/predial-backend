const { recordModel } = require('../models/record.model');
const { userModel } = require('../models/user.model');

// Listar registros de actividad de predios:
exports.getRecords = async (req, res) => {
    try {
        const records = await recordModel.find({})
        if (records !== null && records.length > 0) {
            return res.status(200).send({ msg: "Registros encontrados!!!", records });
        }
        return res.send({ msg: "No existen registros de actividad en la base de datos!!!" });
    } catch (error) {
        console.log(error)
        return res.status(500).send();
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
