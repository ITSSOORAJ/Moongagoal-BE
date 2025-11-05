import Goal from "../models/Goal.js";

// 📅 Get today's goals
export const getTodayGoals = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const goals = await Goal.find({
      userId: req.user.id,
      date: { $gte: today, $lt: tomorrow },
    });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📆 Get previous days' goals
export const getPreviousGoals = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const goals = await Goal.find({
      userId: req.user.id,
      date: { $lt: today },
    }).sort({ date: -1 });

    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🌍 Get all goals
export const getAllGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🧮 Daily summary
export const dailySummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const goals = await Goal.find({
      userId: req.user.id,
      date: { $gte: today, $lt: tomorrow },
    });

    const completed = goals.filter((g) => g.completed).length;

    res.json({
      total: goals.length,
      completed,
      allDone: completed === goals.length && goals.length > 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📊 Progress Data for Graph
export const getProgress = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ date: 1 });

    const grouped = {};
    goals.forEach((g) => {
      const d = g.date.toISOString().split("T")[0];
      if (!grouped[d]) grouped[d] = { date: d, completed: 0, total: 0 };
      grouped[d].total++;
      if (g.completed) grouped[d].completed++;
    });

    const chartData = Object.values(grouped);
    res.json(chartData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
