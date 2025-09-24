const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 12
  },
  role: {
    type: String,
    enum: ['student', 'tutor', 'admin'],
    required: true,
    default: 'student'
  },
  phone: String,
  gender: String,
  dob: Date,
  school: String,
  classLevel: String,
  subjects: [String],
  address: String,
  guardianName: String,
  guardianPhone: String,
  verified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  codeSentAt: Date,
  profilePicture: String,
  bio: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.index({ codeSentAt: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcryptjs.hash(this.password, 10);
  this.updatedAt = Date.now();
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);