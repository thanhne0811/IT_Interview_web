const token = localStorage.getItem("token");

if (!token) {
    alert("Please login first!");
    window.location.href = "login.html";
}

fetch("/api/progress", {
    headers: {
        "Authorization": "Bearer " + token
    }
})
.then(res => res.json())
.then(data => {

    if (!data || data.length === 0) {
        document.querySelector(".dashboard").innerHTML += "<p>No data yet</p>";
        return;
    }

    // ===== SORT theo thời gian =====
    data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // ===== CALCULATE STATS =====
    const total = data.length;

    const avg = (
        data.reduce((sum, item) => sum + item.score, 0) / total
    ).toFixed(1);

    const latest = data[data.length - 1].score;

    // ===== RENDER STATS =====
    document.getElementById("avgScore").innerText = avg;
    document.getElementById("totalAnswers").innerText = total;
    document.getElementById("latestScore").innerText = latest;

    // ===== CHART DATA =====
    const labels = data.map(item =>
        new Date(item.created_at).toLocaleDateString()
    );

    const scores = data.map(item => item.score);

    const ctx = document.getElementById("progressChart");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Score Progress",
                data: scores,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 10
                }
            }
        }
    });

});