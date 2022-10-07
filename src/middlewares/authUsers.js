const { verify } = require('jsonwebtoken');

exports.authUsers = (req, res, next) => {
    try {
        const _id = req.params._id // Capturar el "_id" del usuario, si va a editar
        const authorization = req.headers.authorization
        if (!authorization) { // Validar si hay token
            return res.send({ status: "error", msg: "NO AUTORIZADO" })
        }
        const token = authorization.split(' ')[1] // Capturar el token
        const payload = verify(token, process.env.JWT_SECRET_KEY) // Obtener carga útil
        if (payload.role !== 1 && payload._id !== _id) { // Verificar rol del usuario y si va a editar sus propios datos
            return res.send({ status: "error", msg: "No estás autorizado para realizar esta acción!!!" });
        }
    } catch (error) {
        console.log(error)
    }
    return next();
}
