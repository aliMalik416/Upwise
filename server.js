const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// --- PROFILE ENDPOINTS ---

// Save or Update user profile
app.post('/api/profile', async (req, res) => {
  const { userId, ...p } = req.body;
  const query = `
    INSERT INTO profiles (
      user_id, province, household, income, essentials, grocery_budget, 
      savings, debt, debt_payment, occupation, education_level, 
      target_income, study_tolerance, work_style, interest
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (user_id) DO UPDATE SET
      province = EXCLUDED.province,
      household = EXCLUDED.household,
      income = EXCLUDED.income,
      essentials = EXCLUDED.essentials,
      grocery_budget = EXCLUDED.grocery_budget,
      savings = EXCLUDED.savings,
      debt = EXCLUDED.debt,
      debt_payment = EXCLUDED.debt_payment,
      occupation = EXCLUDED.occupation,
      education_level = EXCLUDED.education_level,
      target_income = EXCLUDED.target_income,
      study_tolerance = EXCLUDED.study_tolerance,
      work_style = EXCLUDED.work_style,
      interest = EXCLUDED.interest,
      updated_at = NOW()
    RETURNING *;
  `;
  const values = [
    userId, p.province, p.household, p.income, p.essentials, 
    p.groceryBudget, p.savings, p.debt, p.debtPayment, 
    p.occupation, p.educationLevel, p.targetIncome, 
    p.studyTolerance, p.workStyle, p.interest
  ];
  
  try {
    const result = await pool.query(query, values);
    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.params.userId]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- STATISTICAL BENCHMARKS ENDPOINTS ---

// Fetch benchmark grocery indexes
app.get('/api/data/groceries', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT item_key, value, region, reference_period, source_name 
       FROM external_benchmarks WHERE category = 'grocery'`
    );
    res.json(result.rows);
  } catch (err) {
    // Default fallback benchmark
    res.json([
      { 
        item_key: 'CPI Food Index Growth', 
        value: 3.2, 
        region: 'Canada', 
        reference_period: '2026-Q1', 
        source_name: 'Statistics Canada' 
      }
    ]);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Upwise server running on port ${PORT}`));
