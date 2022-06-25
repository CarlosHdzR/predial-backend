const { verify } = require("jsonwebtoken");
const { config } = require("../config");

exports.getPayload = (auth) => {
    const token = auth.split(' ')[1]
    const payload = verify(token, config.JWT_SECRET_KEY)
    return payload
}
