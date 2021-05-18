const mongoose = require('mongoose');

const imageSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'An image must have a name']
    }
});

const Image = mongoose.model('Image', imageSchema);
module.exports = Image;