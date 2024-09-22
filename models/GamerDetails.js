const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// MongoDB schema equivalent to Django model
const gamerDetailsSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        unique: true
    },
    teamname: {
        type: String,
        required: true,
        maxLength: 100
    },
    email: {
        type: String,
        unique: true,
        required: true,
        maxLength: 100
    },
    collegename: {
        type: String,
        required: true,
        maxLength: 100
    },
    membernameone: {
        type: String,
        required: true,
        maxLength: 100
    },
    membernametwo: {
        type: String,
        required: true,
        maxLength: 100
    },
    membernamethree: {
        type: String,
        required: true,
        maxLength: 100
    },
    membernamefour: {
        type: String,
        required: true,
        maxLength: 100
    },
    eventscoreone: {
        type: Number,
        default:0,
    },
    eventscoretwo: {
        type: Number,
        default:0,
    },
    eventscorethree: {
        type: Number,
        default:0,
    },
    eventscorefour: {
        type: Number,
        default:0,
    },
    eventscorefive: {
        type: Number,
        default:0,
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Gamer', gamerDetailsSchema);
