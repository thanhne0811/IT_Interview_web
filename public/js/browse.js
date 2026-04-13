
let allQuestions = [];
let currentDomain = "All";

document.addEventListener("DOMContentLoaded", function () {

    fetch("/api/questions")
        .then(res => res.json())
        .then(data => {
            allQuestions = data;
            loadCompanies();
            renderQuestions(allQuestions);
        });

    // SEARCH
    document.getElementById("searchInput")
        .addEventListener("input", function () {
            applyFilters();
        });

    // FILTER BUTTONS
    document.querySelectorAll(".filter-btn")
        .forEach(btn => {
            btn.addEventListener("click", function () {

                document.querySelectorAll(".filter-btn")
                    .forEach(b => b.classList.remove("active-filter"));

                this.classList.add("active-filter");

                currentDomain = this.dataset.domain;

                applyFilters();
            });
        });

    document.getElementById("companyFilter")
        .addEventListener("change", applyFilters);

});

function applyFilters() {

    const keyword = document.getElementById("searchInput")
        .value.toLowerCase();

    let filtered = allQuestions.filter(q => {

        const matchSearch =
            q.content.toLowerCase().includes(keyword);

        const matchDomain =
            currentDomain === "All" ||
            q.domain === currentDomain;

        const company = document.getElementById("companyFilter").value;

        const matchCompany =
            !company || q.company === company;

        return matchSearch && matchDomain && matchCompany;
    });

    renderQuestions(filtered);
}

function loadCompanies() {
    const companies = [...new Set(allQuestions.map(q => q.company))];

    const select = document.getElementById("companyFilter");

    select.innerHTML = `<option value="">All Companies</option>`;

    companies.forEach(c => {
        select.innerHTML += `<option value="${c}">${c}</option>`;
    });
}

function renderQuestions(questions) {

    const container = document.querySelector(".question-grid");
    container.innerHTML = "";

    if (questions.length === 0) {
        container.innerHTML = "<p>No questions found.</p>";
        return;
    }

    questions.forEach(q => {
        container.innerHTML += `
            <div class="question-card">
                <h3>${q.content}</h3>
                <p>${q.company} • ${q.domain} • ${q.difficulty}</p>
                <button onclick="startPractice(${q.id})" 
                        class="btn-primary">
                    Practice
                </button>
            </div>
        `;
    });
}

function startPractice(id) {
    window.location.href = "practice.html?id=" + id;
}
