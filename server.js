const authenticateToken = require('./middleware/authMiddleware');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const OpenAI = require("openai");
const bodyParser = require('body-parser');
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");

const app = express();
const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});
const db = require('./config/db');
app.use(cors());
app.use(bodyParser.json());

app.use(session({
    secret: "googleloginsecret",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// ===== MULTER CONFIG =====
const upload = multer({ dest: "uploads/" });

app.use(express.static('public'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/answers', require('./routes/answers'));
app.use('/api/progress', require('./routes/progress'));

app.post("/api/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword],
            (err, result) => {
                if (err) {
                    return res.status(400).json({ message: "Email already exists" });
                }

                res.json({ message: "User registered successfully" });
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, results) => {

            if (results.length === 0) {
                return res.status(400).json({ message: "User not found" });
            }

            const user = results[0];

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({ message: "Invalid password" });
            }

            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            res.json({
                message: "Login successful",
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });
        }
    );
});

/*app.get("/api/questions", (req, res) => {

    const sql = "SELECT id, content, domain, difficulty FROM questions";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Server error");
        }

        res.json(results);
    });
});
*/
function detectLanguage(text) {
    if (!text) return "en";

    const vietnameseChars = /[ăâđêôơưĂÂĐÊÔƠƯ]/;

    if (vietnameseChars.test(text)) {
        return "vi";
    }

    return "en";
}
app.post("/api/submit", authenticateToken, async (req, res) => {

    const { question_id, answer_text } = req.body;
    const lang = detectLanguage(answer_text);
    const user_id = req.user.id; // LẤY TỪ TOKEN

    const sql = "SELECT content FROM questions WHERE id = ?";

    db.query(sql, [question_id], async (err, results) => {

        if (err || results.length === 0) {
            return res.status(500).json({ message: "Question not found" });
        }

        const question = results[0];

        try {

            const aiResponse = await openai.chat.completions.create({
                model: "llama-3.1-8b-instant",
                temperature: 0.3,
                messages: [
                    {
                        role: "system",
                        content: `
You are a strict and deterministic technical interviewer.

IMPORTANT RULE:
- You MUST give the SAME score for the SAME answer every time.
- DO NOT be random.

Scoring rubric (STRICT):
- 0-3: Wrong or irrelevant
- 4-6: Basic understanding but missing key points
- 7-8: Good answer with minor gaps
- 9-10: Excellent, complete, real-world insight

Evaluation criteria:
- Technical correctness (40%)
- Depth (30%)
- Clarity (20%)
- Real-world understanding (10%)

Language rule:
- If answer is Vietnamese → respond Vietnamese
- If English → respond English

IMPORTANT:
- Return ONLY JSON
- No explanation outside JSON

Format:
{
  "score": number,
  "strengths": "text",
  "weaknesses": "text",
  "improvement": "text"
}
`
                    },
                    {
                        role: "user",
                        content: `
Question: ${question.content}

Candidate Answer: ${answer_text}
`
                    }
                ]
            });

            let raw = aiResponse.choices[0].message.content;

            // TÌM JSON trong text (tránh lỗi AI trả text thừa)
            const jsonMatch = raw.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                throw new Error("Invalid AI format");
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Nếu AI quên field thì tự gán mặc định
            const safeResult = {
                score: parsed.score ?? 5,
                strengths: parsed.strengths ?? "Answer attempts to address the question.",
                weaknesses: parsed.weaknesses ?? "Some key concepts are missing.",
                improvement: parsed.improvement ?? "Review core concepts and provide more detailed explanation."
            };

            safeResult.score = Math.max(0, Math.min(10, Math.round(safeResult.score)));

            // Lưu DB
            db.query(
                `INSERT INTO answers (user_id, question_id, answer_text, score, feedback)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    user_id,
                    question_id,
                    answer_text,
                    safeResult.score,
                    JSON.stringify(safeResult)
                ]
            );

            res.json(safeResult);

        } catch (error) {

            console.error("AI error:", error);

            // FALLBACK nếu AI lỗi
            res.json({
                score: 0,
                strengths: "The answer shows basic understanding.",
                weaknesses: "The explanation lacks completeness.",
                improvement: "Provide clearer structure and cover key concepts."
            });
        }
    });
});

app.get("/api/questions/:id", (req, res) => {

    const sql = "SELECT * FROM questions WHERE id = ?";

    db.query(sql, [req.params.id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: "Not found" });
        }

        res.json(results[0]);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
    function (accessToken, refreshToken, profile, done) {

        const email = profile.emails[0].value;
        const username = profile.displayName;

        db.query(
            "SELECT * FROM users WHERE email = ?",
            [email],
            (err, results) => {

                if (results.length > 0) {
                    return done(null, results[0]);
                }

                db.query(
                    "INSERT INTO users (username,email,password) VALUES (?,?,?)",
                    [username, email, "google_login"],
                    (err, result) => {

                        const user = {
                            id: result.insertId,
                            username,
                            email
                        };

                        done(null, user);
                    }
                );
            }
        );
    }));

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback",
    passport.authenticate("google", { session: false }),
    (req, res) => {

        const user = req.user;

        const token = jwt.sign(
            { id: user.id, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.redirect(`/index.html?token=${token}&username=${user.username}`);
    }
);

app.post("/api/feedback", authenticateToken, (req, res) => {
    const { type, content } = req.body;
    const user_id = req.user.id;

    if (!content) {
        return res.status(400).json({ message: "Content required" });
    }

    db.query(
    "INSERT INTO comments (user_id, type, content, status) VALUES (?, ?, ?, 'pending')",
    [user_id, type, content],
        (err) => {
            if (err) {
                return res.status(500).json({ message: "DB error" });
            }

            res.json({ message: "Feedback submitted" });
        }
    );
});

app.get("/api/admin/feedback", authenticateToken, (req, res) => {

    // check admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
    }

    db.query(
        "SELECT * FROM comments ORDER BY created_at DESC",
        (err, results) => {
            if (err) return res.status(500).json({ message: "DB error" });

            res.json(results);
        }
    );
});

app.delete("/api/admin/feedback/:id", authenticateToken, (req, res) => {

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
    }

    db.query(
        "DELETE FROM comments WHERE id = ?",
        [req.params.id],
        () => res.json({ message: "Deleted" })
    );
});
app.get("/api/my-feedback", authenticateToken, (req, res) => {
    db.query(
        "SELECT * FROM comments WHERE user_id=? ORDER BY created_at DESC",
        [req.user.id],
        (err, results) => {
            if (err) return res.status(500).json({ message: "Error" });
            res.json(results);
        }
    );
});
app.post("/api/admin/feedback/approve/:id", authenticateToken, (req, res) => {
    db.query(
        "UPDATE comments SET status='resolved' WHERE id=?",
        [req.params.id],
        () => res.json({ message: "Approved" })
    );
});

app.post("/api/admin/feedback/reply/:id", authenticateToken, (req, res) => {
    const { reply } = req.body;

    db.query(
        "UPDATE comments SET reply=? WHERE id=?",
        [reply, req.params.id],
        () => res.json({ message: "Replied" })
    );
});
app.get("/api/admin/overview", authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
    }

    const stats = {};

    db.query("SELECT COUNT(*) AS totalUsers FROM users", (err, r1) => {
        if (err) return res.status(500).json({ message: "DB error" });
        stats.users = r1[0].totalUsers;

        db.query("SELECT COUNT(*) AS totalQuestions FROM questions", (err, r2) => {
            stats.questions = r2[0].totalQuestions;

            db.query("SELECT COUNT(*) AS totalAnswers FROM answers", (err, r3) => {
                stats.answers = r3[0].totalAnswers;

                db.query("SELECT COUNT(*) AS totalFeedback FROM comments", (err, r4) => {
                    stats.feedback = r4[0].totalFeedback;

                    db.query(
                        "SELECT COUNT(*) AS pending FROM comments WHERE status='pending'",
                        (err, r5) => {
                            stats.pending = r5[0].pending;

                            res.json(stats);
                        }
                    );
                });
            });
        });
    });
});
// GET PROFILE
app.get("/api/profile", authenticateToken, (req, res) => {
    db.query(
        "SELECT username, email FROM users WHERE id = ?",
        [req.user.id],
        (err, results) => {
            if (err) return res.status(500).json({ message: "DB error" });
            res.json(results[0]);
        }
    );
});

// UPDATE PROFILE
app.put("/api/profile", authenticateToken, (req, res) => {
    const { username, email } = req.body;

    db.query(
        "UPDATE users SET username=?, email=? WHERE id=?",
        [username, email, req.user.id],
        (err) => {
            if (err) return res.status(500).json({ message: "Update failed" });
            res.json({ message: "Profile updated!" });
        }
    );
});

// CHANGE PASSWORD
app.post("/api/change-password", authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    db.query(
        "SELECT password FROM users WHERE id=?",
        [req.user.id],
        async (err, results) => {

            const match = await bcrypt.compare(oldPassword, results[0].password);

            if (!match) {
                return res.json({ message: "Wrong current password" });
            }

            const hashed = await bcrypt.hash(newPassword, 10);

            db.query(
                "UPDATE users SET password=? WHERE id=?",
                [hashed, req.user.id],
                () => res.json({ message: "Password changed!" })
            );
        }
    );
});
// ===== AI GENERATE QUESTIONS FROM CV + JD =====
app.post("/api/generate-from-cv-jd", upload.single("cv"), async (req, res) => {
    try {
        const jd = req.body.jd;

        if (!req.file || !jd) {
            return res.status(400).json({ message: "CV file and JD are required" });
        }

        let cvText = "";

        // ===== ĐỌC FILE =====
        if (req.file.mimetype === "application/pdf") {
            const dataBuffer = fs.readFileSync(req.file.path);
            const pdfData = await pdfParse(dataBuffer);
            cvText = pdfData.text;
            cvText = cvText.substring(0, 3000);
        } else {
            // txt file
            cvText = fs.readFileSync(req.file.path, "utf8");
            cvText = cvText.substring(0, 3000);
        }

        // ===== GỌI AI =====
        const aiResponse = await openai.chat.completions.create({
            model: "llama-3.1-8b-instant",
            temperature: 0,
            messages: [
                {
                    role: "system",
                    content: `
You are a senior IT recruiter with real-world hiring experience.

Your job is to analyze a CV against a Job Description (JD) in a SMART and CONTEXT-AWARE way.

IMPORTANT RULES:
- Be practical, not overly strict
- Consider transferable skills (e.g., Node.js ≈ Laravel backend experience)
- DO NOT unfairly penalize different tech stacks
- If CV is in Vietnamese → DO NOT criticize language
- Focus on skills, not language

SCORING:
- 0–40: Poor fit
- 41–60: Partial match (different stack but relevant)
- 61–80: Good match (transferable skills)
- 81–100: Strong match (high alignment)

OUTPUT FORMAT (JSON ONLY):
{
  "match_score": number,
  "strengths": ["..."],
  "missing_skills": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."],
  "career_fit": "...", 
  "recommended_roles": ["..."]
}

LOGIC:
- strengths = matching + transferable skills
- missing_skills = critical JD requirements not present
- weaknesses = real gaps (not language nonsense)
- suggestions = actionable improvements
- career_fit = short evaluation (1-2 sentences)
- recommended_roles = better job roles for this CV
`
                },
                {
                    role: "user",
                    content: `
CV:
${cvText}

JD:
${jd}
`
                }
            ]
        });

        // xoá file sau khi đọc (tránh đầy server)
        fs.unlinkSync(req.file.path);

        let raw = aiResponse.choices[0].message.content;

        const jsonMatch = raw.match(/\{[\s\S]*\}/); 

        if (!jsonMatch) {
            return res.status(500).json({ message: "AI format error" });
        }

        const parsed = JSON.parse(jsonMatch[0]);

        res.json(parsed);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error processing CV" });
    }
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});