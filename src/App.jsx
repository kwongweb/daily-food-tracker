import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function App() {
  const [history, setHistory] = useState([]);
  const [today, setToday] = useState({
    date: new Date().toLocaleDateString(),
    breakfast: "",
    lunch: "",
    dinner: "",
    snacks: 0,
    desserts: 0,
  });
  const [lookback, setLookback] = useState(7);

  useEffect(() => {
    const saved = localStorage.getItem("foodTrackerHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("foodTrackerHistory", JSON.stringify(history));
  }, [history]);

  const mealScore = {
    breakfast: 33.34,
    lunch: 33.33,
    dinner: 33.33,
  };

  const scoreMeal = (mealType, choice) => {
    if (choice === "whole") return mealScore[mealType];
    if (choice === "processed") return mealScore[mealType] - 10;
    return 0;
  };

  const calculateWeightedScore = () => {
    const { breakfast, lunch, dinner, snacks, desserts } = today;
    let score = 0;
    let possible = 0;

    if (breakfast) {
      score += scoreMeal("breakfast", breakfast);
      possible += mealScore.breakfast;
    }
    if (lunch) {
      score += scoreMeal("lunch", lunch);
      possible += mealScore.lunch;
    }
    if (dinner) {
      score += scoreMeal("dinner", dinner);
      possible += mealScore.dinner;
    }

    const baseScore = possible > 0 ? (score / possible) * 100 : 0;
    const penalty = snacks * 5 + desserts * 20;

    return Math.max(0, Math.round(baseScore - penalty));
  };

  const handleSave = () => {
    const score = calculateWeightedScore();
    const localDate = new Date().toLocaleDateString();
    setHistory([{ ...today, date: localDate, score }, ...history]);
    setToday({
      date: localDate,
      breakfast: "",
      lunch: "",
      dinner: "",
      snacks: 0,
      desserts: 0,
    });
  };

  const handleDelete = (index) => {
    const updated = [...history];
    updated.splice(index, 1);
    setHistory(updated);
  };

  const exportCSV = () => {
    const headers = "Date,Breakfast,Lunch,Dinner,Snacks,Desserts,Score\n";
    const rows = history.map((entry) =>
      [
        entry.date,
        entry.breakfast,
        entry.lunch,
        entry.dinner,
        entry.snacks,
        entry.desserts,
        entry.score,
      ].join(",")
    );
    const csv = headers + rows.join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "daily_food_scores.csv";
    link.click();
  };

  const todayScore = calculateWeightedScore();

  const getGraphData = () => {
    return history
      .slice(0, lookback)
      .reverse()
      .map((entry) => ({
        name: entry.date,
        score: entry.score,
      }));
  };

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Daily Food Tracker</h1>

      <div className="space-y-4 border p-4 rounded-lg">
        {["breakfast", "lunch", "dinner"].map((meal) => (
          <div key={meal} className="flex items-center justify-between">
            <label className="capitalize">
              {meal.charAt(0).toUpperCase() + meal.slice(1)}:
            </label>
            <select
              value={today[meal]}
              onChange={(e) =>
                setToday((prev) => ({ ...prev, [meal]: e.target.value }))
              }
              className="border rounded px-2 py-1"
            >
              <option value="">Select</option>
              <option value="whole">Whole Food</option>
              <option value="processed">Processed</option>
            </select>
          </div>
        ))}

        <div className="flex justify-between items-center">
          <label>Processed Snacks:</label>
          <input
            type="number"
            min="0"
            value={today.snacks}
            onChange={(e) =>
              setToday({ ...today, snacks: parseInt(e.target.value) || 0 })
            }
            className="border rounded px-2 py-1 w-16"
          />
        </div>

        <div className="flex justify-between items-center">
          <label>Desserts:</label>
          <input
            type="number"
            min="0"
            value={today.desserts}
            onChange={(e) =>
              setToday({ ...today, desserts: parseInt(e.target.value) || 0 })
            }
            className="border rounded px-2 py-1 w-16"
          />
        </div>

        <button
          onClick={handleSave}
          className="bg-blue-600 text-white rounded px-4 py-2 border border-blue-800"
        >
          Save Entry
        </button>

        <p className="text-lg font-medium">
          Today's Score (so far): {todayScore} / 100
        </p>

        {todayScore === 100 && (
          <p className="text-green-600 font-bold">🌟 Perfect Day!</p>
        )}
        {todayScore >= 90 && todayScore < 100 && (
          <p className="text-blue-600 font-semibold">
            👍 Still Doing Well!
          </p>
        )}
        {todayScore < 90 && todayScore > 0 && (
          <p className="text-red-600 font-semibold">
            🚧 Don't Pop All the Tires!
          </p>
        )}
      </div>

      <div className="space-y-2 border p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Score History</h2>
          <button
            onClick={exportCSV}
            className="border px-3 py-1 text-sm rounded border-green-600 text-green-700"
          >
            Export to CSV
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label>Days to Show:</label>
          <input
            type="number"
            min="1"
            value={lookback}
            onChange={(e) => setLookback(parseInt(e.target.value) || 1)}
            className="border px-2 py-1 w-20"
          />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={getGraphData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#10b981" />
          </LineChart>
        </ResponsiveContainer>
        <ul className="space-y-1 pt-3">
          {history.map((entry, idx) => (
            <li
              key={idx}
              className="flex justify-between items-center border-b pb-1"
            >
              <span>
                {entry.date}: {entry.score}
              </span>
              <button
                className="text-red-600 text-sm border border-red-500 px-2 py-0.5 rounded"
                onClick={() => handleDelete(idx)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;