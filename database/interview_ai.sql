CREATE DATABASE interview_ai;
USE interview_ai;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255)
);

CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT,
    reference_answer TEXT,
    domain VARCHAR(100),
    difficulty VARCHAR(50),
    company VARCHAR(100), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    question_id INT,
    answer_text TEXT,
    score INT,
    feedback JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    avg_score FLOAT,
    total_answers INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
select * from comments;
INSERT INTO questions (content, reference_answer, domain, difficulty, company) VALUES

-- ================= FPT SOFTWARE =================
("What is OOP?", "Object-Oriented Programming uses classes and objects...", "Backend", "Easy", "FPT Software"),
("Explain MVC pattern", "MVC separates Model, View, Controller...", "Backend", "Medium", "FPT Software"),
("What is Spring Boot?", "Framework for building Java applications...", "Backend", "Medium", "FPT Software"),
("Difference between abstract class and interface?", "Abstract can have implementation, interface cannot...", "Backend", "Medium", "FPT Software"),

-- ================= TMA SOLUTIONS =================
("What is Agile?", "Agile is iterative development methodology...", "General", "Easy", "TMA Solutions"),
("What is Scrum?", "Scrum divides work into sprints...", "General", "Medium", "TMA Solutions"),
("Explain SDLC", "Software Development Life Cycle includes phases...", "General", "Easy", "TMA Solutions"),

-- ================= NASHTECH =================
("What is Git?", "Version control system...", "General", "Easy", "NashTech"),
("What is CI/CD?", "Continuous Integration and Deployment...", "Backend", "Medium", "NashTech"),
("Explain branching strategy", "Git flow, feature branch...", "General", "Medium", "NashTech"),

-- ================= VNG =================
("What is microservices?", "Architecture splitting system into small services...", "Backend", "Medium", "VNG"),
("How to scale a system?", "Load balancing, caching...", "Backend", "Hard", "VNG"),
("What is Redis?", "In-memory database for caching...", "Backend", "Medium", "VNG"),

-- ================= TIKI =================
("What is React?", "React is a JS library for UI...", "Frontend", "Easy", "Tiki"),
("Explain Virtual DOM", "Virtual DOM improves performance...", "Frontend", "Medium", "Tiki"),
("What is state in React?", "State stores dynamic data...", "Frontend", "Easy", "Tiki"),

-- ================= SHOPEE =================
("Design a scalable chat system", "Use WebSocket, queue...", "Backend", "Hard", "Shopee"),
("What is CAP theorem?", "Consistency, Availability, Partition tolerance...", "Backend", "Hard", "Shopee"),
("Explain database indexing", "Improves query performance...", "Backend", "Medium", "Shopee"),

-- ================= MOMO =================
("What is JWT?", "Token-based authentication...", "Backend", "Easy", "MoMo"),
("Authentication vs Authorization?", "Auth verifies identity...", "Backend", "Easy", "MoMo"),
("How to secure API?", "Use HTTPS, JWT, rate limit...", "Backend", "Medium", "MoMo"),

-- ================= ZALO =================
("What is WebSocket?", "Full-duplex communication protocol...", "Backend", "Medium", "Zalo"),
("How real-time chat works?", "Client-server via socket...", "Backend", "Medium", "Zalo"),

-- ================= VIETTEL =================
("What is TCP vs UDP?", "TCP reliable, UDP faster...", "Network", "Easy", "Viettel"),
("Explain DNS", "Translate domain to IP...", "Network", "Easy", "Viettel"),
("What is latency?", "Delay in network...", "Network", "Easy", "Viettel"),

-- ================= VNPT =================
("What is OSI model?", "7-layer network model...", "Network", "Easy", "VNPT"),
("What is NAT?", "Translate private IP to public IP...", "Network", "Medium", "VNPT"),

-- ================= CMC =================
("What is polymorphism?", "Same function behaves differently...", "Backend", "Medium", "CMC"),
("What is encapsulation?", "Hide internal details...", "Backend", "Easy", "CMC"),

-- ================= MISA =================
("What is SQL JOIN?", "Combine rows from multiple tables...", "Database", "Medium", "MISA"),
("What is normalization?", "Reduce redundancy...", "Database", "Medium", "MISA");

