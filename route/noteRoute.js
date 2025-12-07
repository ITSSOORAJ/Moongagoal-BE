const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const axios = require('axios'); // optional for AI call

// Get notes
router.get('/', auth, async (req, res) => {
  const notes = await Note.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(notes);
});

// Add note
router.post('/', auth, async (req, res) => {
  const note = new Note({ user: req.user.id, content: req.body.content });
  await note.save();
  res.json(note);
});
// Update note
router.put('/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: 'Content is required' });
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },  // ensure user owns the note
      { content },
      { new: true }                               // return updated note
    );

    if (!note) {
      return res.status(404).json({ msg: 'Note not found' });
    }

    res.json(note);
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  res.json({ success: true });
});

// Evaluate notes (AI bot simulation)
router.post('/evaluate', auth, async (req, res) => {
  const notes = req.body.notes.map(n => n.content).join('\n');
  // Simple AI placeholder
  let reply = "You’ve written quite a few things!";
  if (notes.toLowerCase().includes('goal')) reply = "You mentioned 'goal' — looks like you’re staying motivated!";
  if (notes.toLowerCase().includes('stressed')) reply = "Take a break, maybe go for a walk 🌿";

  res.json({ reply });
});

module.exports = router;

