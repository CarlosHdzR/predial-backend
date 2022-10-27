const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recordsSchema = new Schema(
    {
        author: {
            type: String,
            required: true
        },
        author_id: {
            type: Schema.Types.ObjectId,
            required: true
        },
        action: {
            type: String,
            required: true
        },
        property_code: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
)

exports.recordModel = mongoose.model("records", recordsSchema);
