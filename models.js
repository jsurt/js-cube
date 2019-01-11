'use strict'

const mongoose = require('mongoose');

const solveSchema = mongoose.Schema({
    time: Number,
    notes: String,
    scrambleAlg: String,
    solverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: String
});

const userSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    userName: {
        type: String,
        unique: true
    },
});

userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
})

solveSchema.methods.serialize = function() {
    return  {
        id: this._id,
        solverId: this.solverId,
        time: this.time,
        notes: this.notes,
        scrambleAlg: this.scrambleAlg,
        date: new Date()
    };
};

userSchema.methods.serialize = function() {
    return {
        id: this._id,
        fullName: this.fullName,

    }
}

const Solve = mongoose.model('Solve', solveSchema);
const User = mongoose.model('User', userSchema);

module.exports = { Solve, User };