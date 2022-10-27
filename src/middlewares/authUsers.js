const { verify } = require('jsonwebtoken');

exports.authUsers = (req, res, next) => {
    try {
        const _id = req.params.user_id // Capturar el "_id" del usuario, si va a editar
        const authorization = req.headers.authorization
        if (!authorization) { // Validar si hay token
            return res.send({ msg: "No estás autenticado!!!", error: "Not authenticated" })
        }
        const token = authorization.split(' ')[1] // Capturar el token
        const payload = verify(token, process.env.JWT_SECRET_KEY) // Obtener carga útil
        if (payload.role !== 1 && payload._id !== _id) { // Verificar rol del usuario y si va a editar sus propios datos
            return res.send({ msg: "No estás autorizado para realizar esta acción!!!", error: "Not authorized" });
        }
    } catch (error) {
        console.log(error)
    }
    return next();
}
