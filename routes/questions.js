const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

//router.get('/', auth, (req, res) => {
router.get('/', (req, res) => {
    const { domain, difficulty } = req.query;

    let sql = 'SELECT * FROM questions WHERE 1=1';
    let params = [];

    if (domain) {
        sql += ' AND domain = ?';
        params.push(domain);
    }

    if (difficulty) {
        sql += ' AND difficulty = ?';
        params.push(difficulty);
    }

    db.query(sql, params, (err, results) => {
    if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({ error: err });
    }

    res.json(results);
});
});

router.get('/:id', (req, res) => {
    const sql = 'SELECT * FROM questions WHERE id = ?';

    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "DB error" });
        }

        res.json(results[0]);
    });
});

module.exports = router;