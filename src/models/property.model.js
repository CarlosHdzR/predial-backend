const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const propertySchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    owner_name: {
        type: String,
        required: true
    },
    owner_id_number: {
        type: Number,
        required: true
    },
    owner_email: {
        type: String,
        required: true
    },
    built_area: {
        type: String,
        required: true
    },
    total_area: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true,
        unique: true
    },
    neighborhood: {
        type: String,
        required: true
    },
    payment_date_1: {
        type: String
    },
    payment_date_2: {
        type: String
    },
    payment_date_3: {
        type: String
    },
    value: {
        type: String,
        required: true
    },
    tax_value: {
        type: String
    },
    tax_paid: {
        type: Boolean,
        default: false,
        required: true
    },
    active: {
        type: Boolean,
        default: true,
        required: true
    },
    associated: {
        type: Boolean,
        default: false,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'users',
    },
})

exports.propertyModel = mongoose.model("properties", propertySchema);
