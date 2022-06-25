const mongoose = require('mongoose');
const { config } = require('../config');

exports.connectToDB = () => {
    try {
        mongoose.connect(config.MONGODB_URI)
        console.log("Connected to Database!!!")
    } catch (error) {
        console.log("Connection to Database failed!!!");
        console.log(error);
    }
}
