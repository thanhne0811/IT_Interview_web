const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// ===== LẤY PROGRESS (CHART) =====
router.get('/', auth, (req, res) => {

    db.query(
        'SELECT score, created_at FROM answers WHERE user_id = ? ORDER BY created_at ASC',
        [req.user.id],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({ message: "DB error" });
            }

            res.json(results);
        }
    );
});

router.get('/history', auth, (req, res) => {

    const sql = `
        SELECT 
            a.id,
            q.content AS question,
            a.answer_text,
            a.score,
            a.feedback,
            a.created_at
        FROM answers a
        JOIN questions q ON a.question_id = q.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
    `;

    db.query(sql, [req.user.id], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({ message: "DB error" });
        }

        res.json(results);
    });
});

module.exports = router;