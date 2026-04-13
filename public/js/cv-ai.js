
// USER HEADER (GIỮ LOGIN STATE)
const user = localStorage.getItem("username");

if (user) {
    document.getElementById("userArea").innerHTML = `
        <span>Hello, ${user}</span>
        <button onclick="logout()">Logout</button>
    `;
} else {
    document.getElementById("userArea").innerHTML = `
        <a href="login.html">Login</a>
    `;
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "login.html";
}

// ===== AI FUNCTION =====
async function generateFromCVJD() {
    const fileInput = document.getElementById("cvFile");
    const jd = document.getElementById("jd").value;

    const file = fileInput.files[0];

    if (!file || !jd) {
        alert("Please upload CV and enter JD");
        return;
    }

    const formData = new FormData();
    formData.append("cv", file);
    formData.append("jd", jd);

    try {
        const res = await fetch("/api/generate-from-cv-jd", {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            document.getElementById("cvQuestionList").innerText =
                "Server lỗi";
            return;
        }

        const data = await res.json();
        console.log("DATA REAL:", data);

        const container = document.getElementById("cvQuestionList");

        const result = data.parsed;

        const score = data.match_score || 0;

        let scoreClass = "average";
        if (score >= 80) scoreClass = "excellent";
        else if (score >= 60) scoreClass = "good";

        container.innerHTML = `
<div class="cv-result">

    <!-- SCORE -->
    <div class="score-box ${scoreClass}">
        <h2>${score}%</h2>
        <p>Match Score</p>
    </div>

    <!-- GRID -->
    <div class="cv-grid">

        <div class="cv-card">
            <h3>Strengths</h3>
            <ul>${(data.strengths || []).map(s => `<li>${s}</li>`).join("")}</ul>
        </div>

        <div class="cv-card">
            <h3>Missing Skills</h3>
            <ul>${(data.missing_skills || []).map(s => `<li>${s}</li>`).join("")}</ul>
        </div>

        <div class="cv-card">
            <h3>Weaknesses</h3>
            <ul>${(data.weaknesses || []).map(s => `<li>${s}</li>`).join("")}</ul>
        </div>

        <div class="cv-card">
            <h3>Suggestions</h3>
            <ul>${(data.suggestions || []).
                map(s => `<li>${s}</li>`).join("")}</ul>
        </div>

    </div>

    <!-- CAREER -->
    <div class="cv-career">
        <h3>Career Fit</h3>
        <p>${data.career_fit || "No data"}</p>
    </div>

    <!-- ROLES -->
    <div class="cv-career">
        <h3>Recommended Roles</h3>
        <ul>${(data.recommended_roles || []).map(r => `<li>${r}</li>`).join("")}</ul>
    </div>

</div>
`;

    } catch (err) {
        console.error(err);
        document.getElementById("cvQuestionList").innerText =
            "Lỗi khi gọi AI";
    }
}

// ===== FILE NAME DISPLAY =====
const fileInput = document.getElementById("cvFile");
const fileName = document.getElementById("fileName");

fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        fileName.innerText = fileInput.files[0].name;
    }
});
// ===== DRAG & DROP =====
const uploadBox = document.getElementById("uploadBox");

uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = "#4f46e5";
});

uploadBox.addEventListener("dragleave", () => {
    uploadBox.style.borderColor = "#c7d2fe";
});

uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();

    fileInput.files = e.dataTransfer.files;
    fileName.innerText = e.dataTransfer.files[0].name;
});