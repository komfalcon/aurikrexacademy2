const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  subject: {
    type: String,
    required: true,
    enum: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'General', 'Exam Prep']
  },
  type: {
    type: String,
    enum: ['study', 'discussion', 'project'],
    default: 'study'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxMembers: {
    type: Number,
    default: 50
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  joinCode: String, // For private groups
  messages: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  files: [{
    filePath: String,
    fileName: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save for updatedAt
groupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient member queries
groupSchema.index({ members: 1 });
groupSchema.index({ subject: 1, type: 1 });

module.exports = mongoose.model('Group', groupSchema);