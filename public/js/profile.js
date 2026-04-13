const token = localStorage.getItem("token");

// ===== LOAD USER =====
window.onload = async () => {
    const username = localStorage.getItem("username");
    document.getElementById("userArea").innerText = "Hello, " + (username || "Guest");

    // load info từ backend (nếu có API thì gọi)
    const res = await fetch("/api/profile", {
        headers: {
            Authorization: "Bearer " + token
        }
    });

    if (res.ok) {
        const data = await res.json();

        document.getElementById("username").value = data.username;
        document.getElementById("email").value = data.email;
    }
};

// ===== UPDATE PROFILE =====
async function updateProfile() {
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;

    const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        },
        body: JSON.stringify({ username, email })
    });

    const data = await res.json();

    alert(data.message || "Updated!");

    // update localStorage
    localStorage.setItem("username", username);
}

// ===== CHANGE PASSWORD =====
async function changePassword() {
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;

    const res = await fetch("/api/change-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        },
        body: JSON.stringify({ oldPassword, newPassword })
    });

    const data = await res.json();
    alert(data.message);
}

// ===== CLICK USER NAME =====
function goProfile() {
    window.location.href = "profile.html";
}

// ===== LOGOUT =====
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}