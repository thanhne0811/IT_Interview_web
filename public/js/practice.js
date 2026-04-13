document.addEventListener("DOMContentLoaded", function () {

    const params = new URLSearchParams(window.location.search);
    const questionId = params.get("id");

    // Load question
    fetch("/api/questions/" + questionId)
        .then(res => res.json())
        .then(data => {
            document.getElementById("questionTitle").innerText = data.content;
            document.getElementById("fieldBadge").innerText = data.domain;
            document.getElementById("difficultyBadge").innerText = data.difficulty;
        });

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    window.submitAnswer = function () {

        const answer = document.getElementById("answerBox").value;

        document.getElementById("feedbackCard")
            .classList.remove("hidden");

        document.getElementById("result").innerHTML = "Evaluating with AI...";

        fetch("/api/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                question_id: questionId,
                answer_text: answer
            })
        })
            .then(res => res.json())
            .then(data => {

                document.getElementById("feedbackCard")
                    .classList.remove("hidden");

                document.getElementById("result").innerHTML = `
        <h3>Score: ${data.score}/10</h3>

        <p><strong>Strengths:</strong><br>
        ${data.strengths}</p>

        <p><strong>Weaknesses:</strong><br>
        ${data.weaknesses}</p>

        <p><strong>How to Improve:</strong><br>
        ${data.improvement}</p>
    `;
            });
    }

    window.goBack = function () {
        window.location.href = "browse.html";
    }

});