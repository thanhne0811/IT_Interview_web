const token = localStorage.getItem("token");

if (!token) {
    alert("Please login first!");
    window.location.href = "login.html";
}

fetch("/api/progress/history", {
    headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
    }
})
.then(res => res.json())
.then(data => {

    const container = document.getElementById("historyList");

    data.forEach(item => {
    const feedback = JSON.parse(item.feedback);

    let level = "";
    let label = "";

    if (item.score >= 9) {
        level = "excellent";
        label = "Excellent";
    } else if (item.score >= 7) {
        level = "good";
        label = "Well";
    } else {
        level = "average";
        label = "Average";
    }

    const date = new Date(item.created_at).toLocaleDateString();
    const time = new Date(item.created_at).toLocaleTimeString();

    container.innerHTML += `
        <div class="history-card">
            <div class="card-title">${item.question}</div>

            <div class="card-info">
                <span>⏰ ${time}</span>
                <span>⭐ ${item.score}/10</span>
            </div>

            <div class="card-info">
                <span>📅 ${date}</span>
            </div>

            <span class="score-tag ${level}">${label}</span>

            <div class="feedback">
                <p><b>+</b> ${feedback.strengths}</p>
                <p><b>-</b> ${feedback.weaknesses}</p>
            </div>
        </div>
    `;
});

});