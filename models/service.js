const mongoose  = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('Service',
    new Schema({
        address: String,
        secret: String,
        name: String,
        timestamp: Date
    })
);