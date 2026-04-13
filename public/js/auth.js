function checkLoginUI() {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    if (!token) return;

    document.getElementById("loginBtn").style.display = "none";
    document.getElementById("signupBtn").style.display = "none";

    const userMenu = document.getElementById("userMenu");
    userMenu.style.display = "flex";

    document.getElementById("usernameDisplay").innerText = "Hello, " + username;
}

function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}