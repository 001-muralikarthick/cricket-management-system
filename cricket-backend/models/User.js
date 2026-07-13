const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const careerHistorySchema = new mongoose.Schema({
  title: String,
  company: String,
  startDate: String,
  endDate: String,
  description: String
}, { _id: false });

const personalInfoSchema = new mongoose.Schema({
  fullName: String,
  bio: String,
  location: String,
  contactNumber: String
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Player', 'Team Admin', 'Tournament Organizer', 'Umpire', 'Super Admin'],
    default: 'Player'
  },
  personalInfo: personalInfoSchema,
  careerHistory: [careerHistorySchema]
}, {
  timestamps: true
});

// Hash password before saving to database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Helper method to compare passwords during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);