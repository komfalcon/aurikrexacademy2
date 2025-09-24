const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  subject: {
    type: String,
    required: true,
    enum: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'General']
  },
  topic: {
    type: String,
    required: true
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  contentType: {
    type: String,
    enum: ['video', 'notes', 'pdf', 'quiz'],
    required: true
  },
  contentUrl: String, // For video/notes
  filePath: String, // For uploaded files
  fileName: String,
  duration: Number, // In minutes for videos
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  views: {
    type: Number,
    default: 0
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    rating: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  relatedLectures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture'
  }],
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
lectureSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  next();
});

// Index for performance
lectureSchema.index({ subject: 1, topic: 1 });
lectureSchema.index({ tutor: 1 });
lectureSchema.index({ students: 1 });
lectureSchema.index({ isPublished: 1, publishedAt: -1 });

module.exports = mongoose.model('Lecture', lectureSchema);