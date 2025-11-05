const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');
const User = require('../models/User');
const mongoose = require('mongoose');

// ✅ Create goal (restricted: cannot add to previous days)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, targetDate } = req.body;
    if (!title || !targetDate) return res.status(400).json({ msg: 'Title and targetDate required' });

    const date = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 🚫 Restrict past dates
    if (date < today) {
      return res.status(400).json({ msg: "You can't add goals for previous days!" });
    }

    const goal = new Goal({
      userId: req.user.id,
      title,
      description: description || '',
      targetDate: date,
    });

    await goal.save();
    res.json(goal);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Get today's goals
router.get('/', auth, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const goals = await Goal.find({
      userId: req.user.id,
      targetDate: { $gte: start, $lte: end },
    }).sort({ createdAt: -1 });

    res.json(goals);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Get previous days' goals
router.get('/previous', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const goals = await Goal.find({
      userId: req.user.id,
      targetDate: { $lt: today },
    }).sort({ targetDate: -1 });

    res.json(goals);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Get all goals
router.get('/all', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ targetDate: -1 });
    res.json(goals);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Progress data for chart
router.get('/progress', auth, async (req, res) => {
  try {
    const goals = await Goal.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$targetDate" } },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formatted = goals.map((g) => ({
      date: g._id,
      total: g.total,
      completed: g.completed,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
// ✅ Update goal by ID
router.put('/:id', auth, async (req, res) => {
  try {
    const goalId = req.params.id;

    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return res.status(400).json({ msg: 'Invalid goal ID' });
    }

    // Find goal belonging to the logged-in user
    const goal = await Goal.findOne({ _id: goalId, userId: req.user.id });
    if (!goal) return res.status(404).json({ msg: 'Goal not found' });

    const { title, description, status, targetDate } = req.body;

    // Restrict changing targetDate to a past date
    if (targetDate) {
      const newDate = new Date(targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate < today) {
        return res.status(400).json({ msg: "You can't set target date to a previous day!" });
      }
      goal.targetDate = newDate;
    }

    if (title !== undefined) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (status !== undefined) goal.status = status;

    await goal.save();
    res.json(goal);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Delete goal by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const goalId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return res.status(400).json({ msg: 'Invalid goal ID' });
    }

    const result = await Goal.deleteOne({ _id: goalId, userId: req.user.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ msg: 'Goal not found or not authorized' });
    }

    res.json({ msg: 'Goal deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// ✅ Daily summary and appreciation endpoint
router.get('/summary/daily', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const target = date ? new Date(date) : new Date();
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    const goals = await Goal.find({
      userId: req.user.id,
      targetDate: { $gte: start, $lte: end },
    });

    const total = goals.length;
    const completed = goals.filter((g) => g.status === 'Completed').length;
    const allDone = total > 0 && completed === total;

    if (allDone) await User.findByIdAndUpdate(req.user.id, { $inc: { streak: 1 } });

    res.json({ date: start.toISOString(), total, completed, allDone, goals });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
