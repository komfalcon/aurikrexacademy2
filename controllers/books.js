const Book = require('../models/Book');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authMiddleware, requireRole } = require('../middleware/auth');

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '../../uploads/books');
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Upload book (tutor/admin only)
exports.uploadBook = [
  authMiddleware,
  requireRole(['tutor', 'admin']),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const book = new Book({
        title: req.body.title,
        author: req.body.author,
        subject: req.body.subject,
        description: req.body.description || '',
        filePath: req.file.path,
        fileName: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user.id,
        approved: req.user.role === 'admin' // Auto-approve if admin
      });

      await book.save();

      if (req.user.role === 'tutor') {
        // Notify admin for approval (implement email/notification later)
        console.log(`New book uploaded by tutor ${req.user.id} awaiting approval`);
      }

      res.status(201).json({
        message: 'Book uploaded successfully',
        book: book._id,
        approved: book.approved
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Error uploading book', error: err.message });
    }
  }
];

// Get all books with filters and pagination
exports.getBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, approved = 'true', search, sort = 'createdAt' } = req.query;
    const filter = { approved: approved === 'true' };
    if (subject) filter.subject = subject;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(filter)
      .populate('uploadedBy', 'fullName role')
      .populate('approvedBy', 'fullName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ [sort]: -1 });

    const total = await Book.countDocuments(filter);

    res.json({
      books,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error('Get books error:', err);
    res.status(500).json({ message: 'Error fetching books', error: err.message });
  }
};

// Approve/Reject book (admin only)
exports.approveBook = [
  authMiddleware,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { approved, rejectReason } = req.body;
      const book = await Book.findById(id);
      if (!book) return res.status(404).json({ message: 'Book not found' });

      book.approved = approved === 'true';
      if (!approved && rejectReason) {
        book.rejectReason = rejectReason; // Add field if needed
      }
      book.approvedBy = req.user.id;
      await book.save();

      res.json({ message: `Book ${approved ? 'approved' : 'rejected'} successfully` });
    } catch (err) {
      console.error('Approve book error:', err);
      res.status(500).json({ message: 'Error updating book status', error: err.message });
    }
  }
];

// Delete book (admin or uploader)
exports.deleteBook = [
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const book = await Book.findById(id);
      if (!book) return res.status(404).json({ message: 'Book not found' });

      if (req.user.role !== 'admin' && book.uploadedBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Delete file from disk
      try {
        await fs.unlink(book.filePath);
      } catch (unlinkErr) {
        console.warn('File delete warning:', unlinkErr.message);
      }

      await Book.findByIdAndDelete(id);
      res.json({ message: 'Book deleted successfully' });
    } catch (err) {
      console.error('Delete book error:', err);
      res.status(500).json({ message: 'Error deleting book', error: err.message });
    }
  }
];