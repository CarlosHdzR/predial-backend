const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recordsSchema = new Schema(
    {
        author: {
            type: String
        },
        author_id: {
            type: Schema.Types.ObjectId
        },
        action: {
            type: String
        },
        property_code: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

exports.recordModel = mongoose.model("records", recordsSchema);
