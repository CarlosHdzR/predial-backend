const { verify } = require('jsonwebtoken');

exports.authPredios = (req, res, next) => {
    try {
        const authorization = req.headers.authorization
        if (!authorization) { // Validar si hay token
            return res.send({ status: "error", msg: "NO AUTORIZADO" });
        }    
        const token = authorization.split(' ')[1] // Capturar el token
        const payload = verify(token, process.env.JWT_SECRET_KEY) // Obtener carga útil
        if (payload.rol === 3) { // Verificar rol del usuario
            return res.send({ status: "error", msg: "No estás autorizado para realizar esta acción!!!" });
        }
    } catch (err) {
        console.log(err);
    }
    return next();
}
