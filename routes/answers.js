const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

function simpleEvaluation(answer, reference, keywords) {
    let score = 0;

    const keywordList = keywords.split(',');

    keywordList.forEach(keyword => {
        if (answer.toLowerCase().includes(keyword.trim().toLowerCase())) {
            score += 10;
        }
    });

    if (answer.length > 100) score += 20;

    return Math.min(score, 100);
}

router.post('/', (req, res) => {

    const { user_id, question_id, answer_text } = req.body;

    db.query(
        'SELECT reference_answer, keywords FROM questions WHERE id = ?',
        [question_id],
        (err, result) => {

            if (err) return res.status(500).json(err);

            const keywords = result[0].keywords.split(",");

            let score = 0;

            keywords.forEach(word => {
                if (answer_text.toLowerCase().includes(word.trim().toLowerCase())) {
                    score++;
                }
            });

            score = Math.min(score, 10);

            let feedback = score >= 7
                ? "Good answer! You covered key concepts."
                : "Try to include more technical keywords.";

            db.query(
                'INSERT INTO answers (user_id, question_id, answer_text, score, feedback) VALUES (?, ?, ?, ?, ?)',
                [user_id, question_id, answer_text, score, feedback],
                (err2) => {
                    if (err2) return res.status(500).json(err2);

                    res.json({ score, feedback });
                }
            );
        }
    );
});

module.exports = router;