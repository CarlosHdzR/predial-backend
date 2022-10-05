const mongoose = require('mongoose');
const { config } = require('../config');

exports.connectToDB = () => {
    try {
        mongoose.connect(config.MONGODB_URI)
        console.log("\n********** CONNECTION TO DATABASE SUCCESSFUL **********")
    } catch (error) {
        console.log("********** CONNECTION TO DATABASE FAILED **********");
        console.log(error);
    }
}
