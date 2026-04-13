const token = localStorage.getItem("token");

/* CHECK ADMIN */
const payload = JSON.parse(atob(token.split('.')[1]));

if (payload.role !== 'admin') {
    alert("Bạn không phải admin!");
    window.location.href = "index.html";
}

/* TAB SWITCH*/
function showTab(tab) {
    document.getElementById("overviewTab").style.display = "none";
    document.getElementById("questionsTab").style.display = "none";
    document.getElementById("feedbackTab").style.display = "none";

    // remove active
    document.getElementById("tabOverview").classList.remove("active");
    document.getElementById("tabQuestions").classList.remove("active");
    document.getElementById("tabFeedback").classList.remove("active");

    if (tab === "overview") {
        document.getElementById("overviewTab").style.display = "block";
        document.getElementById("tabOverview").classList.add("active");
        loadOverview();
    }
    else if (tab === "questions") {
        document.getElementById("questionsTab").style.display = "block";
        document.getElementById("tabQuestions").classList.add("active");
    }
    else {
        document.getElementById("feedbackTab").style.display = "block";
        document.getElementById("tabFeedback").classList.add("active");
        loadFeedback();
    }
}

/* QUESTIONS */
function loadQ() {
    fetch('/api/admin/questions', {
        headers: { Authorization: "Bearer " + token }
    })
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("list");
            list.innerHTML = "";

            data.forEach(q => {
                list.innerHTML += `
                <div class="item">
                    <h4>${q.content}</h4>
                    <span>${q.field || q.domain}</span>
                    <span>${q.difficulty}</span>
                    <button onclick="deleteQ(${q.id})" class="delete-btn">
                        Delete
                    </button>
                </div>
            `;
            });
        });
}

function addQ() {
    fetch('/api/admin/questions', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        },
        body: JSON.stringify({
            content: document.getElementById("content").value,
            field: document.getElementById("field").value,
            difficulty: document.getElementById("difficulty").value
        })
    }).then(() => {
        alert("Question added successfully!");
        document.getElementById("content").value = "";
        loadQ();
    });

}

function deleteQ(id) {
    fetch('/api/admin/questions/' + id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
    })
        .then(() => {
            alert("Delete Successfully!");
            loadQ();
        })
        .catch(() => alert("Failed                                                                                                                                      !"));
}

/* ===== MODERATION ===== */
// function loadFeedback() {
//     fetch('/api/progress/history', {
//         headers: { Authorization: "Bearer " + token }
//     })
//     .then(res => res.json())
//     .then(data => {
//         const list = document.getElementById("feedbackList");
//         list.innerHTML = "";

//         data.forEach(item => {
//             list.innerHTML += `
//                 <div class="item">
//                     <h4>${item.question}</h4>
//                     <span>Score: ${item.score}</span>
//                     <span>${new Date(item.created_at).toLocaleDateString()}</span>

//                     <p>${item.feedback || "No feedback"}</p>

//                     <button onclick="deleteAnswer(${item.id})" class="delete-btn">
//                         Delete
//                     </button>
//                 </div>
//             `;
//         });
//     });
// }
function loadFeedback() {
    fetch('/api/admin/feedback', {
        headers: { Authorization: "Bearer " + token }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error("Not authorized");
            }
            return res.json();
        })
        .then(data => {
            const list = document.getElementById("feedbackList");
            list.innerHTML = "";

            data.forEach(item => {
                list.innerHTML += `
<div class="item" ${item.status}">
    <h4>User ID: ${item.user_id}</h4>

    <span>${item.type}</span>
    <span class="status ${item.status}">
        ${item.status}
    </span>

    <p>${item.content}</p>
    ${item.reply ? `<p><b>Reply:</b> ${item.reply}</p>` : ""}
    <input id="reply-${item.id}" class="admin-reply-input" placeholder="Reply..."/>

    <div class="admin-actions">
        <button onclick="replyFeedback(${item.id})" class="admin-btn reply-btn">
            Reply
        </button>

        <button onclick="approve(${item.id})" class="admin-btn resolve-btn">
            Resolve
        </button>

        <button onclick="deleteFeedback(${item.id})" class="admin-btn delete-btn">
            Delete
        </button>
    </div>
</div>
`;
            });
        });
}
function approve(id) {
    fetch('/api/admin/feedback/approve/' + id, {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
    })
    .then(() => {
        alert("Marked as resolved!");
        loadFeedback(); // reload
    });
}
function replyFeedback(id) {
    const reply = document.getElementById("reply-" + id).value;

    fetch('/api/admin/feedback/reply/' + id, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        },
        body: JSON.stringify({ reply })
    })
    .then(() => {
        alert("Replied successfully!");
        loadFeedback(); // reload lại list
    });
}
function deleteFeedback(id) {
    fetch('/api/admin/feedback/' + id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
    }).then(loadFeedback);
}
function deleteAnswer(id) {
    fetch('/api/admin/answers/' + id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
    }).then(loadFeedback);
}

function loadOverview() {
    fetch("/api/admin/overview", {
        headers: { Authorization: "Bearer " + token }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error("Unauthorized or error API");
            }
            return res.json();
        })
        .then(data => {
            console.log("DATA:", data);

            document.getElementById("totalUsers").innerText = data.users || 0;
            document.getElementById("totalQuestions").innerText = data.questions || 0;
            document.getElementById("totalAnswers").innerText = data.answers || 0;
            document.getElementById("totalFeedback").innerText = data.feedback || 0;
            document.getElementById("pendingFeedback").innerText = data.pending || 0;
        })
        .catch(err => {
            console.error(err);
            alert("Không load được overview (có thể do token)");
        });
}
/* INIT */
showTab("overview");
loadQ();