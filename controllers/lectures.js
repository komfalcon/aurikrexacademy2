const Lecture = require('../models/Lecture');
const User = require('../models/user');

// Placeholder functions
exports.getLectures = async (req, res) => {
  try {
    const lectures = await Lecture.find();
    res.json(lectures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLectureById = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    res.json(lecture);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createLecture = async (req, res) => {
  try {
    const lecture = new Lecture(req.body);
    await lecture.save();
    res.status(201).json(lecture);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    res.json(lecture);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndDelete(req.params.id);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    res.json({ message: 'Lecture deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};