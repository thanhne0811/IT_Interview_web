const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/adminMiddleware');

const router = express.Router();

/* ===== GET ALL QUESTIONS ===== */
router.get('/questions', auth, isAdmin, (req, res) => {
    db.query('SELECT * FROM questions', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "DB error" });
        }
        res.json(results);
    });
});

/* ===== ADD QUESTION ===== */
router.post('/questions', auth, isAdmin, (req, res) => {
    const { content, field, difficulty } = req.body;

    db.query(
        'INSERT INTO questions (content, domain, difficulty) VALUES (?, ?, ?)',
        [content, field, difficulty],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "DB error" });
            }
            res.json({ message: "Added" });
        }
    );
});

/* ===== DELETE QUESTION ===== */
router.delete('/questions/:id', auth, isAdmin, (req, res) => {
    db.query(
        'DELETE FROM questions WHERE id=?',
        [req.params.id],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "DB error" });
            }
            res.json({ message: "Deleted" });
        }
    );
});

/* ===== DELETE ANSWER (MODERATION) ===== */
router.delete('/answers/:id', auth, isAdmin, (req, res) => {
    db.query(
        'DELETE FROM answers WHERE id=?',
        [req.params.id],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "DB error" });
            }
            res.json({ message: "Deleted" });
        }
    );
});

module.exports = router;