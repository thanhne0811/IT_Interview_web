// ===== AUTH UI =====
const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

if (token && username) {
    document.getElementById("loginBtn").style.display = "none";
    document.getElementById("signupBtn").style.display = "none";

    document.getElementById("userMenu").style.display = "block";
    document.getElementById("usernameDisplay").innerText = "Hello, " + username;
}

// logout
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "login.html";
}

// go profile
function goProfile() {
    window.location.href = "profile.html";
}

// ===== SEND FEEDBACK =====
async function sendFeedback() {
    if (!token) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    const type = document.getElementById("type").value;
    const content = document.getElementById("content").value;

    if (!content) {
        alert("Please enter feedback");
        return;
    }

    try {
        const res = await fetch("/api/feedback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ type, content })
        });

        await res.json();

        document.getElementById("statusMsg").innerText =
            "Feedback sent! Waiting for admin review.";

        document.getElementById("content").value = "";

        // reload list sau khi gửi
        loadMyFeedback();

    } catch (err) {
        console.error(err);
        document.getElementById("statusMsg").innerText =
            "Error sending feedback";
    }
}

// ===== LOAD MY FEEDBACK =====
async function loadMyFeedback() {
    try {
        const res = await fetch("/api/my-feedback", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await res.json();

        const list = document.getElementById("myFeedbackList");
        list.innerHTML = "";

        data.forEach(item => {
            list.innerHTML += `
            <div class="history-card">
                <p><b>Type:</b> ${item.type}</p>
                <p>${item.content}</p>

                <span class="status ${item.status}">
                    ${item.status}
                </span>

                ${item.reply ? `<p><b>Admin:</b> ${item.reply}</p>` : ""}
            </div>
            `;
        });

    } catch (err) {
        console.error(err);
    }
}

// load khi vào trang
window.onload = () => {
    if (token) {
        loadMyFeedback();
    }
};