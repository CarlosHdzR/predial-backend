require("dotenv").config();

exports.config = {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
    MAIL: {
        USER: process.env.USER_MAIL_SERVER,
        PASSWORD: process.env.PASS_MAIL_SERVER
    },
    PATH: {
        ADMIN: process.env.ADMIN_PATH,
        USER_EXT: process.env.USER_EXT_PATH
    },
    CLOUD: {
        CLOUD_NAME: process.env.CLOUD_NAME,
        CLOUD_API_KEY: process.env.CLOUD_API_KEY,
        CLOUD_API_SECRET: process.env.CLOUD_API_SECRET
    },
    CLIENT_HOST: process.env.CLIENT_HOST
}
