const API_BASE = window.location.port === "5500" ? "http://127.0.0.1:8000" : "/api";
import { infographic } from "./st-anthony-north-infographic-data.js";
import { infographicIcons } from "./st-anthony-north-infographic-data.js";
import { miniQuizQuestions } from "./st-anthony-north-question-data.js";
import { preQuizQuestions } from "./st-anthony-north-question-data.js";
import { postQuizQuestions } from "./st-anthony-north-question-data.js";


const defaultModuleData = [
    {
        id: 1,
        type: "assessment",
        module: "pre-assessment",
        title: "Pre-Assessment",
        description: "Assess your knowledge before beginning the training.",
        status: "Not Started",
        progress: 0,
        required: true
    },
    {
        id: 2,
        type: "module",
        module: "volunteer-roles-boundaries",
        title: "Volunteer Roles & Boundaries",
        description: "Learn volunteer roles, boundaries, ethics, and expectations.",
        status: "Not Started",
        progress: 0,
        required: false
    },

    {
        id: 3,
        type: "module",
        module: "hospital-navigation",
        title: "Hospital Navigation & Floor Guide",
        description: "Learn key locations and how to guide visitors.",
        status: "Not Started",
        progress: 0,
        required: false
    },

    {
        id: 4,
        type: "module",
        module: "patient-guest-interaction",
        title: "Patient & Guest Interaction & Communication",
        description: "Learn professional communication and guest support.",
        status: "Not Started",
        progress: 0,
        required: false
    },

    {
        id: 5,
        type: "module",
        module: "emergency-awareness",
        title: "Emergency Awareness & Escalation",
        description: "Learn to recognize emergencies and escalate appropriately.",
        status: "Not Started",
        progress: 0,
        required: false
    },

    {
        id: 6,
        type: "module",
        module: "rapid-response-cpr-aed",
        title: "Rapid Response & CPR/AED Awareness",
        description: "Learn Rapid Response and CPR/AED awareness.",
        status: "Not Started",
        progress: 0,
        required: false
    },

    {
        id: 7,
        type: "module",
        module: "seizure-stroke-poison",
        title: "Seizure, Stroke & Poison Awareness",
        description: "Learn recognition and escalation for urgent situations.",
        status: "Not Started",
        progress: 0,
        required: false
    },

    {
        id: 8,
        type: "module",
        module: "fire-safety-codes",
        title: "Fire Safety & Emergency Codes",
        description: "Learn fire safety, RACE, PASS, and emergency codes.",
        status: "Not Started",
        progress: 0,
        required: false
    },

    {
        id: 9,
        type: "module",
        module: "scenario-decision-making",
        title: "Scenario-Based Decision Making",
        description: "Apply your training to realistic front-desk scenarios.",
        status: "Not Started",
        progress: 0,
        required: false
    },
    
    {
        id: 10,
        type: "assessment",
        module: "post-assessment",
        title: "Final Assessment",
        description: "Assess your knowledge after completing the required training.",
        status: "Not Started",
        progress: 0,
        required: true
    }
    
];

const defaultModuleQuizScores = [
    {
        type: "miniQuiz",
        module2: null,
        module3: null,
        module4: null,
        module5: null,
        module6: null,
        module7: null,
        module8: null,
        module9: null

    },
    {
        type: "preQuiz",
        overallScore: null,
        module2: null,
        module3: null,
        module4: null,
        module5: null,
        module6: null,
        module7: null,
        module8: null,
        module9: null

    },
    {
        type: "postQuiz",
        overallScore: null,
        module2: null,
        module3: null,
        module4: null,
        module5: null,
        module6: null,
        module7: null,
        module8: null,
        module9: null

    }
];

const defaultquizAnswers = {
    "preQuiz": Array(40).fill(null),
    "postQuiz": Array(40).fill(null),
    "miniQuiz": Array(40).fill(null)
};


function startTrainingTimer() {
    let trainingSeconds = 0;
    let lastActivity = performance.now();
    let lastTick = performance.now();

    const updateActivity = () => {
        lastActivity = performance.now();
    };

    ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(event => {
        document.addEventListener(event, updateActivity);
    });

    const timer = setInterval(() => {
        const now = performance.now();
        const elapsed = (now - lastTick) / 1000;
        lastTick = now;

        if (!document.hidden && now - lastActivity < 60000) {
            trainingSeconds += elapsed;
        }
    }, 1000);

    return {
        getSeconds: () => Math.floor(trainingSeconds),
        stop: () => {
            clearInterval(timer);
            return Math.floor(trainingSeconds);
        }
    };
}

function saveTrainingTime(seconds, leaving = false) {
    if (seconds <= 0) return;

    const data = JSON.stringify({ seconds });

    fetch(`${API_BASE}/save-training-time`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
        },
        body: data,
        keepalive: leaving
    });
}

async function fillSidebarContainer(page) {
    return fetch("../shared-items/sidebar.txt")
        .then(response => response.text())
        .then(html => {

            document.querySelector("#sidebar-container").outerHTML = html;

            const currentLink = document.querySelector(page);
            currentLink.classList.remove('inactive');
            currentLink.classList.add('active');
            const logoutButton = document.querySelector(".log-out");
            logoutButton.onclick = async function() {
                const response = await fetch(`${API_BASE}/logout`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "X-CSRF-Token": csrfToken
                    }
                });

                if (response.ok) {
                    window.location.href = "../login-page/login.html";
                }
            };
        }); 
}

async function updateModuleProgress(specificModule) {
    const response = await fetch(`${API_BASE}/update-module-progress`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify({
            module_id: specificModule.id,
            progress: specificModule.progress
        })
    });
}

async function updateQuizScores(quizType) {
    const specificQuiz = moduleQuizScores.find(module => module.type === quizType);
    const filteredQuizScores= {};
    for (let i=2;i<10;i++) {
        filteredQuizScores[`module${i}`]=specificQuiz[`module${i}`]
    }
    
    const response = await fetch(`${API_BASE}/update-quiz-scores`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify(
            {
                module_type: quizType,
                module_scores: filteredQuizScores
            }
        )
    });
}


async function updateQuizAnswers(quizType) {
    const response = await fetch(`${API_BASE}/update-quiz-answers`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify(
            {
                module_type: quizType,
                module_answer_list: quizAnswers[quizType]
            }
        )
    });
}

async function loadQuizReviewData(quizType, moduleID = null) {
    let url = `${API_BASE}/get-quiz-review?quiz_type=${quizType}`;

    if (moduleID !== null) {
        url += `&module_id=${moduleID}`;
    }

    const response = await fetch(url, {
        method: "GET",
        credentials: "include"
    });

    return await response.json();
}

    
/*===================================================
Landing Page
=====================================================*/
function landingButtons() {
    const getStartedButton=document.querySelector('.hero .assessment-button')
    // getStartedButton.addEventListener("click", function () {
    //     // if (login) {
    //     //     getStartedButton.href='question-template/question-template.html';
    //     //     sessionStorage.setItem("quizType", "preQuiz");
    //     //     sessionStorage.setItem("selectedModule", "pre-assessment");
    //     // }
    //     
    // })
    getStartedButton.href='login-page/login.html';
    
    
    
}

/*===================================================
Create Account
=====================================================*/
async function createUserAccount() {
    const createAccount=document.querySelector('.create-account-page .right-login-div');
    const fullName = createAccount.querySelector("#name").value.trim()
    const email = createAccount.querySelector("#email").value.trim()
    const password = createAccount.querySelector("#password").value
    const confirmPassword = createAccount.querySelector("#confirmPassword").value
    if (password !== confirmPassword) {
        document.querySelector("#email-error").textContent = "Passwords do not match.";
        return; 
    }
    document.querySelector("#email-error").textContent = "";
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    if (!firstName || !lastName) {
        console.log("Please enter your first and last name.");
        return;
    }

    async function registerUser(firstName, lastName, email, password) {
        const registerPage = document.querySelector(".create-account-page")
        const response = await fetch(`${API_BASE}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(
                {
                    email: email,
                    password: password,
                    first_name: firstName,
                    last_name: lastName  
                }
            )
        });
        const result = await response.json();
        if (!response.ok) {
            console.log("Registration failed:", result);
            document.querySelector("#email-error").textContent = result.detail;
            registerPage.querySelector("#email").value = "";
            registerPage.querySelector("#password").value = "";
            registerPage.querySelector("#confirmPassword").value = "";
            return;
        }
        console.log("Account created:", result);
        window.location.href = "../login-page/login.html";
       
        
    }
    await registerUser(firstName, lastName, email, password);
}

async function registerUserButtons() {
    const createAccountRegistration=document.querySelector('.create-account-page .right-login-div .signup-button');
    createAccountRegistration.addEventListener("click", async function () {
        await createUserAccount()
    });

    document.querySelectorAll('.create-account-page .password-input-div').forEach(div => {
        const input = div.querySelector('input[type="password"]');
        const showButton = div.querySelector('.password-show-button');
        const hideButton = div.querySelector('.password-hide-button');

        if (!input || !showButton || !hideButton) return;

        showButton.addEventListener("click", function () {
            input.type = "text";
            showButton.hidden = true;
            hideButton.hidden = false;
        });

        hideButton.addEventListener("click", function () {
            input.type = "password";
            showButton.hidden = false;
            hideButton.hidden = true;
        });
    });
}


/*===================================================
Login Page
=====================================================*/
async function loginUser() {
    const loginPage = document.querySelector(".login-page"); // use your actual parent class
    const email = loginPage.querySelector("#email").value.trim();
    const password = loginPage.querySelector("#password").value;

    const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    const result = await response.json();

    if (!response.ok) {
        console.log("Login failed:", result);
        document.querySelector("#login-error").textContent = result.detail;
        loginPage.querySelector("#email").value = "";
        loginPage.querySelector("#password").value = "";
        return;
    }
    
    
    console.log("Login successful:", result);
    window.location.href = "../my-modules-page/my-modules.html";

}

async function loginUserButtons() {
    const loginUserButton = document.querySelector('.login-page.main .login-button');
    const passwordShowButton = document.querySelector('.login-page.main .password-show-button');
    const passwordHideButton = document.querySelector('.login-page.main .password-hide-button');

    console.log({loginUserButton, passwordShowButton, passwordHideButton});

    if (!loginUserButton || !passwordShowButton || !passwordHideButton) {
        console.error("Login page is missing a required button.");
        return;
    }

    loginUserButton.addEventListener("click", async function () {
        await loginUser();
    });

    passwordShowButton.addEventListener("click", function () {
        passwordShowButton.style.display = "none";
        passwordHideButton.style.display = "flex";
        document.querySelector('.login-page.main #password').type = "text";
    });

    passwordHideButton.addEventListener("click", function () {
        passwordShowButton.style.display = "flex";
        passwordHideButton.style.display = "none";
        document.querySelector('.login-page.main #password').type = "password";
    });
}

/*===================================================
Forgot Password Page
=====================================================*/
function forgotPasswordButtons() {
    const form = document.querySelector("#forgot-password-form");
    const message = document.querySelector("#reset-message");
    const button = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.querySelector("#reset-email").value.trim();
        button.disabled = true;
        message.textContent = "Processing request...";

        try {
            const response = await fetch(`${API_BASE}/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({email: email})
            });

            const result = await response.json();

            if (!response.ok) {
                message.textContent = "Unable to process your request. Please try again.";
                return;
            }

            message.textContent = result.message;
        } catch (error) {
            console.error("Password reset request failed:", error);
            message.textContent = "Unable to connect to the server. Please try again.";
        } finally {
            button.disabled = false;
        }
    });
}

function resetPasswordButtons() {
    const form = document.querySelector("#reset-password-form");
    const message = document.querySelector("#reset-message");
    const button = form.querySelector('button[type="submit"]');
    const token = new URLSearchParams(window.location.search).get("token");
    console.log("Reset password buttons initialized");

    form.querySelectorAll(".input-div").forEach(inputDiv => {
        const passwordInput = inputDiv.querySelector("input");
        const showButton = inputDiv.querySelector(".password-show-button");
        const hideButton = inputDiv.querySelector(".password-hide-button");

        showButton.addEventListener("click", function () {
            showButton.style.display = "none";
            hideButton.style.display = "flex";
            passwordInput.type = "text";
        });

        hideButton.addEventListener("click", function () {
            showButton.style.display = "flex";
            hideButton.style.display = "none";
            passwordInput.type = "password";
        });
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const newPassword = document.querySelector("#new-password").value;
        const confirmPassword = document.querySelector("#confirm-password").value;

        if (!token) {
            message.textContent = "Invalid password reset link.";
            return;
        }

        if (newPassword !== confirmPassword) {
            message.textContent = "Passwords do not match.";
            return;
        }

        button.disabled = true;
        message.textContent = "Resetting password...";

        try {
            const response = await fetch(`${API_BASE}/reset-password`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    token: token,
                    new_password: newPassword
                })
            });

            const result = await response.json();

            if (!response.ok) {
                message.textContent = result.detail || "Password reset failed.";
                return;
            }

            message.textContent = "Password reset successfully! You can now log in.";
            form.querySelectorAll("input").forEach(input => input.disabled = true);
            button.disabled = true;

            // Remove the reset token from the browser's address bar.
            window.history.replaceState({}, "", window.location.pathname);
        } catch (error) {
            console.error("Password reset failed:", error);
            message.textContent = "Unable to connect to the server.";
        } finally {
            if (form.querySelector("#new-password").disabled === false) {
                button.disabled = false;
            }
        }
    });
}
/*===================================================
Dashboard Page
=====================================================*/
function documentNameFill(firstName, lastName) {
    // 1. Select the template container and the target layout destination
    const userTopRightDiv = document.querySelector('.user-top-right-div');
    userTopRightDiv.querySelector('.user-circle h5').textContent=firstName.charAt(0) + lastName.charAt(0);
    userTopRightDiv.querySelector('.volunteer-name').textContent=firstName + " " + lastName;

    if (document.querySelector('.dashboard-page')) {
        document.querySelector('.welcome-div h2').textContent=`Welcome back ${firstName}!`
    }
    

}
function dashboardModulesRowsDiv(moduleData) {
    // 1. Select the template container and the target layout destination
    const template = document.querySelector('.dashboard-page .dashboard-module-template');
    const container = document.querySelector('.dashboard-page .modules-div');
    for (const module of moduleData.slice(0, moduleData.length/2)) {
        // Clone the template content (true means deep clone, copying all nested elements)
        const moduleClone = template.content.cloneNode(true);

        // Find elements inside the clone and inject data
        moduleClone.querySelector('.module-subsections .module-title-description h6').textContent = module.title;
        moduleClone.querySelector('.module-subsections .module-title-description .module-description').textContent = module.description;
        if (module.required==true) {
            moduleClone.querySelector('.module-subsections .module-title-description .required').style.display = "inline-block";
        }

        const moduleStatus = moduleClone.querySelector('.module-subsections .module-status h6 ');
        if (module.module === "pre-assessment") {
            moduleStatus.textContent = module.status;
            if (module.status === "Completed") {
                moduleStatus.classList.add("completed");
            }
            else if (module.status === "In Progress") {
                moduleStatus.classList.add("in-progress");
            }
            else if (module.status === "Not Started") {
                moduleStatus.classList.add("not-started");
            }
}
        else if (moduleData[0].progress==100) {
            moduleStatus.textContent = module.status;
            if (module.status=="Completed") {
            // Add a single class
            moduleStatus.classList.add('completed');
            }
            else if (module.status=="In Progress") {
                // Add a single class
                moduleStatus.classList.add('in-progress');
            }
            else if (module.status=="Not Started") {
                // Add a single class
                moduleStatus.classList.add('not-started');
            }
        }
        else {
            moduleStatus.textContent = "locked";
            moduleStatus.classList.add('locked');
        }
        
        if (!moduleStatus.classList.contains('locked')) {
            moduleClone.querySelector('.module-subsections').href="../infographic-module-template/infographic.html";
            
        }
        else {
            moduleClone.querySelector('.module-subsections').style.cursor = "default";
        }
        

        moduleClone.querySelector('.module-subsections .mini-progress-bar-div h6 ').textContent = `${module.progress}%`;
        moduleClone.querySelector('.mini-progress-bar-purple').style.width = `${module.progress}%`
        // Append the fully populated element to the live page layout

        const moduleRow = moduleClone.querySelector(".module-subsections");
        moduleRow.dataset.module = module.module;
        if (!moduleStatus.classList.contains("locked")) {
            moduleRow.addEventListener("click", function (event) 
            {
                if (moduleRow.dataset.module=="pre-assessment") {
                    moduleRow.href = "../question-template/question-template.html";
                    sessionStorage.setItem("quizType", "preQuiz");
                }
                const clickedModule = event.currentTarget.dataset.module;
                sessionStorage.setItem("selectedModule", clickedModule);
                
                
            });
        }
        else {
            moduleRow.classList.add("no-hover")
        }

        container.appendChild(moduleClone);

            
            
    }
        
};

function dashboardOverallProgressDiv(moduleData) {
    // 1. Select the template container and the target layout destination
    const dashboardProgress = document.querySelector('.dashboard-page .progress-bar-div');
    let overallProgress= 0;
    moduleData.forEach(module => {
        overallProgress+=module.progress;
    });
    overallProgress/=(moduleData.length);
    dashboardProgress.querySelector('.percent-progress-div .percent-progress' ).textContent=`${Math.round(overallProgress)}%`;
    dashboardProgress.querySelector('.progress-bar-purple').style.width=`${Math.round(overallProgress)}%`;
    
};

function dashboardNextUpDiv(moduleData) {
    // 1. Select the template container and the target layout destination
    const dashboardNextUp = document.querySelector('.dashboard-page .next-up-div');
    for (const module of moduleData){
        
        if (module.status!='Completed') {
            dashboardNextUp.querySelector('.next-up-module-title').textContent=module.title;
            dashboardNextUp.querySelector('span').textContent=`Estimated Time Remaining: ${Math.round(15*(1-(module.progress)/100))} min`;
            break;
        }
        
    };  
};

function dashboardDeeperProgressDiv(moduleData, moduleQuizScores) {
    const deeperProgressDiv=document.querySelector('.dashboard-page .deeper-progress-div');

    // Modules Complete Calculation
    let moduleComplete=0;
    moduleData.forEach(module => {
        if (module.status=='Completed') {
            moduleComplete++;
        }
    });
    deeperProgressDiv.querySelector('.progress-details-div .modules-completed').textContent=`${moduleComplete} of ${moduleData.length}`;
    
    // Assessments Passed Calculation
    let assessmentsPassed = 0;

    moduleQuizScores.forEach(quiz => {
        if (quiz.type === "miniQuiz") {
            assessmentsPassed += Object.entries(quiz).filter(([key, score]) =>
                key.startsWith("module") && typeof score === "number" && score >= 4
            ).length;
        }
        else if (quiz.type === "postQuiz" && quiz.overallScore >= 38) {
            assessmentsPassed++;
        }
    });

    deeperProgressDiv.querySelector('.progress-details-div .assessements-passed').textContent=`${assessmentsPassed} of 9`;

    // Training Time Remaining Calculation
    let trainingTime=0;
    moduleData.forEach(module => {
        if (module.required==true && module.status!='Completed') {

            if (module.type=="assessment") {
                trainingTime +=(100-(module.progress))/100*30;
            }
            else if (module.type=="module"){
                trainingTime +=(100-(module.progress))/100*15;
            }
        }
    });
    const totalMinutes = Math.round(trainingTime);
    deeperProgressDiv.querySelector('.progress-details-div .training-time-remaining').textContent=`${Math.floor(totalMinutes/60)}h ${totalMinutes%60}m`;


};
/*===================================================
Admin Dashboard Page
=====================================================*/
async function fillAdminDashboard() {
    async function loadAdminData() {
        const response = await fetch(`${API_BASE}/get-admin-data`, {
            method: "GET",
            credentials: "include"
        });
        if (!response.ok) {
            console.error("Failed to load admin data:", response.status);
            return null;
        }
        return await response.json();
    }
    admin_users_data_li = await loadAdminData();
    if (admin_users_data_li) {
        fillAdminUserRows(admin_users_data_li);
        filterAdminUserRows(admin_users_data_li);
        await fillAdminMetrics()
    }
    
}
function filterAdminUserRows() {
    const searchInput = document.getElementById("admin-user-search");
    const statusFilter = document.getElementById("admin-status-filter");
    const passedFilter = document.getElementById("admin-passed-filter");
    const progressFilter = document.getElementById("admin-progress-filter");

    function applyFilters() {
        const search = searchInput.value.toLowerCase().trim();
        const status = statusFilter.value;
        const passed = passedFilter.value;
        const progress = progressFilter.value;

        const filteredUsers = admin_users_data_li.filter(user => {
            const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();

            // Search by name or email
            if (search && !fullName.includes(search) && !user.email.toLowerCase().includes(search)) return false;

            // Status filter
            if (status !== "All Statuses" && user.status !== status) return false;

            // Passed filter
            if (passed === "Passed" && !user.passed) return false;
            if (passed === "Not Passed" && (user.passed || user.post_quiz_score === null)) return false;
            if (passed.toLowerCase() === "pending" && user.post_quiz_score !== null) return false;

            // Count only the 8 training modules
            const completedModules = parseInt(user.modules_completed, 10)
                - Number(user.pre_quiz_score !== null)
                - Number(user.post_quiz_score !== null);

            // Module progress filter
            if (progress === "0–2 Modules" && (completedModules < 0 || completedModules > 2)) return false;
            if (progress === "3–5 Modules" && (completedModules < 3 || completedModules > 5)) return false;
            if (progress === "6–7 Modules" && (completedModules < 6 || completedModules > 7)) return false;
            if (progress === "8 Modules Completed" && completedModules !== 8) return false;

            return true;
        });

        fillAdminUserRows(filteredUsers);
    }

    searchInput.addEventListener("input", applyFilters);
    statusFilter.addEventListener("change", applyFilters);
    passedFilter.addEventListener("change", applyFilters);
    progressFilter.addEventListener("change", applyFilters);
}
function fillAdminUserRows(admin_user_data_li) {
    // 1. Select the template container and the target layout destination
    const template = document.querySelector('.admin-dashboard-page .admin-user-template');
    const container = document.querySelector('.admin-dashboard-page .admin-user-info-div');
    container.querySelectorAll('.user-info-subsection').forEach(row => row.remove());
    for (const user of admin_user_data_li) {
        // Clone the template content (true means deep clone, copying all nested elements)
        const moduleClone = template.content.cloneNode(true);

        // Find elements inside the clone and inject data
        moduleClone.querySelector('.user-name-cell .user-name-circle h5').textContent =`${user["first_name"][0]}${user["last_name"][0]}`; 
        moduleClone.querySelector('.user-name-cell h6').textContent =`${user["first_name"]} ${user["last_name"]}`; 
        moduleClone.querySelector('.user-email-cell h6').textContent =user["email"]; 
        moduleClone.querySelector('.user-completed-modules-cell h6').textContent =user["modules_completed"]; 
        if (user["pre_quiz_score"]!=null) {
            moduleClone.querySelector('.pre-quiz-cell h6').textContent =`${user["pre_quiz_score"]}%`; 
        }
        else {
            moduleClone.querySelector('.pre-quiz-cell h6').textContent ="N/A"; 
        }

        if (user["post_quiz_score"]!=null) {
            moduleClone.querySelector('.post-quiz-cell h6').textContent =`${user["post_quiz_score"]}%`; 
        }
        else {
            moduleClone.querySelector('.post-quiz-cell h6').textContent = "N/A"; 
        }

        if (user["improvement"] != null) {
            const improvement = user["improvement"];
            moduleClone.querySelector('.user-improvement-cell h6').textContent = `${improvement > 0 ? "+" : ""}${improvement}%`;
        }
        else {
            moduleClone.querySelector('.user-improvement-cell h6').textContent = "N/A";
            moduleClone.querySelector('.user-improvement-cell .improvement').style.display="None";
        }
        
        if (user["passed"]) {
            moduleClone.querySelector('.user-passed-cell .passed').style.display="flex";
            
        }
        else {
            moduleClone.querySelector('.user-passed-cell .not-passed').style.display="flex";
        }

        moduleClone.querySelector('.user-status-cell h6').textContent= user["status"]; 

        if (user["status"]=="Completed") {
            moduleClone.querySelector('.user-status-cell').classList.add("green-status"); 
        }
        else if (user["status"]=="In Progress") {
            moduleClone.querySelector('.user-status-cell').classList.add("yellow-status"); 
        }

        const lastActivity = user["last_activity"];
        moduleClone.querySelector('.user-activity-cell h6').textContent = lastActivity ? new Date(lastActivity + "Z").toLocaleString() : "N/A";
        
        container.appendChild(moduleClone);
    }
}
async function fillAdminMetrics() {
    const response = await fetch(`${API_BASE}/get-admin-metrics`, {
        method: "GET",
        credentials: "include"
    });

    if (!response.ok) {
        console.error("Failed to load admin metrics:", response.status);
        return;
    }

    const metrics = await response.json();

    document.querySelector("#total-users").textContent = metrics.total_users;
    document.querySelector("#completed-modules").textContent = `${metrics.average_required_completion}%`;
    document.querySelector("#passed-post-quiz").textContent = metrics.passed_post_quiz;
    document.querySelector("#total-training-time").textContent = metrics.total_training_time;
    document.querySelector("#average-improvement").textContent = `${metrics.average_improvement > 0 ? "+" : ""}${metrics.average_improvement}%`;
}


/*===================================================
My Module Page
=====================================================*/
function myModulesRowsDiv(moduleData, moduleQuizScores) {
    // 1. Select the template container and the target layout destination
    let template = document.querySelector('.my-modules-page .my-modules-template');
    let container = document.querySelector('.my-modules-page .modules-div');

    let moduleNum=0;
    moduleData.forEach(module => {
        moduleNum++;
        // Clone the template content (true means deep clone, copying all nested elements)
        const moduleClone = template.content.cloneNode(true);

        // Find elements inside the clone and inject data
        moduleClone.querySelector('.module-subsections .module-number').textContent = moduleNum;
        moduleClone.querySelector('.module-subsections .module-title-description .title-required h6').textContent = module.title;
        moduleClone.querySelector('.module-subsections .module-title-description-span').textContent = module.description;
        if (module.required) {
            moduleClone.querySelector('.module-subsections .module-title-description .required').style.display = "flex";
        }
        
        const moduleStatus = moduleClone.querySelector('.module-subsections .module-status h6 ');
        if (module.module === "pre-assessment") {
            moduleStatus.textContent = module.status;
            if (module.status=="Completed") {
            // Add a single class
            moduleStatus.classList.add('completed');
            }
            else if (module.status=="In Progress") {
                // Add a single class
                moduleStatus.classList.add('in-progress');
            }
            else if (module.status=="Not Started") {
                // Add a single class
                moduleStatus.classList.add('not-started');
            }
        }
        else if (moduleData[0].progress==100) {
            moduleStatus.textContent = module.status;
            if (module.status=="Completed") {
            // Add a single class
            moduleStatus.classList.add('completed');
            }
            else if (module.status=="In Progress") {
                // Add a single class
                moduleStatus.classList.add('in-progress');
            }
            else if (module.status=="Not Started") {
                // Add a single class
                moduleStatus.classList.add('not-started');
            }
        }
        else {
            moduleStatus.textContent = "locked";
            moduleStatus.classList.add('locked');
        }
        // Only unlock final assessment if other required modules have a score above 4.
        if (module.module=="post-assessment") {

            moduleData.forEach(element => {
                if (element.required && element.type!="assessment" && element.id!=3) {
                    const moduleID=`module${element.id}`
                    if (!(moduleQuizScores.find(item => item.type==="miniQuiz")[moduleID]>=4)) {
                        moduleStatus.textContent = "locked";
                        moduleStatus.classList.add('locked');
                    }
                }
            });
        }

        if (!moduleStatus.classList.contains('locked')) {
            moduleClone.querySelector('.module-subsections').href="../infographic-module-template/infographic.html"
        }
        else {
            moduleClone.querySelector('.module-subsections').style.cursor = "default";
        }
            
        
        
        
        // const module_status = moduleClone.querySelector('.module-subsections .module-status h6 ');
        // module_status.textContent = module.status;
        // if (module.status=="Completed") {
        //     // Add a single class
        //     module_status.classList.add('completed');
        // }
        // else if (module.status=="In Progress") {
        //     // Add a single class
        //     module_status.classList.add('in-progress');
        // }
        // else if (module.status=="Not Started") {
        //     // Add a single class
        //     module_status.classList.add('not-started');
        // }
        
        if (module.progress==100) {
            moduleClone.querySelector('.module-subsections .module-time span').textContent = "------"
        } 
        else {
            let time=15;
            if (module.type=="assessment") {
                time=30;
            }
            else {
                time=15;
            }
            moduleClone.querySelector('.module-subsections .module-time span').textContent = `${Math.round((1-module.progress/100)*time)} min`
        }
        moduleClone.querySelector('.module-subsections .mini-progress-bar-div h6 ').textContent = `${module.progress}%`;
        moduleClone.querySelector('.mini-progress-bar-purple').style.width = `${module.progress}%`
        if (module.progress!=100) {
            moduleClone.querySelector('.module-subsections .module-score h5').textContent = "N / A";
        }
        else {
            let percentCorrect=0;
            if (module.type=="module") {
                let scoreKey=`module${moduleNum}`
                percentCorrect=Math.round(moduleQuizScores[0][scoreKey]/5 *100);
                moduleClone.querySelector('.module-subsections .module-score h5').textContent = `${moduleQuizScores[0][scoreKey]} / ${5} (${percentCorrect}%)`;
                if (percentCorrect<80 && module.required) {
                    moduleClone.querySelector('.module-subsections .tooltip-wrapper').style.display = "inline-flex";
                }
            }
            else if (module.module=="post-assessment") {
                percentCorrect=Math.round(moduleQuizScores[2].overallScore/40 *100);
                moduleClone.querySelector('.module-subsections .module-score h5').textContent = `${moduleQuizScores[2].overallScore} / ${40} (${percentCorrect}%)`;
                if (percentCorrect<95) {
                    moduleClone.querySelector('.module-subsections .tooltip-wrapper').style.display = "inline-flex";
                }
            }  
            else if (module.module=="pre-assessment") {
                percentCorrect=Math.round(moduleQuizScores[1].overallScore/40 *100);
                moduleClone.querySelector('.module-subsections .module-score h5').textContent = `${moduleQuizScores[1].overallScore} / ${40} (${percentCorrect}%)`;
            }  

            
        }
        const moduleRow = moduleClone.querySelector(".module-subsections");
        moduleRow.dataset.module = module.module;
        if (!moduleStatus.classList.contains("locked")) {
           
            moduleRow.addEventListener("click", function (event) 
            {
                if (moduleRow.dataset.module=="post-assessment") {
                    moduleRow.href = "../question-template/question-template.html";
                    sessionStorage.setItem("quizType", "postQuiz");
                    sessionStorage.setItem("restoreQuizQuestion", "true");
                }
                else if (moduleRow.dataset.module=="pre-assessment") {
                    moduleRow.href = "../question-template/question-template.html";
                    sessionStorage.setItem("quizType", "preQuiz");
                    sessionStorage.setItem("restoreQuizQuestion", "true");
                }
                const clickedModule = event.currentTarget.dataset.module;
                sessionStorage.setItem("selectedModule", clickedModule);
                
                
            });
        }
        else {
            moduleRow.classList.add("no-hover");
        }
        

        // Append the fully populated element to the live page layout
        container.appendChild(moduleClone);

        
        
    });
        
};
function myModuleSummaryInformationDiv(moduleData) {
    const moduleSummaryInformation = document.querySelector('.my-modules-page');
    moduleSummaryInformation.querySelector('.total-modules').textContent=moduleData.length;
    let inProgressModules=0;
    let completedModules=0;
    let overallProgress= 0;
    moduleData.forEach(module => {
        if (module.status=="In Progress") { 
            inProgressModules++;
        }
        else if (module.status=="Completed") { 
            completedModules++;
        }

        overallProgress+=module.progress;
    });

    moduleSummaryInformation.querySelector('.in-progress-modules').textContent=inProgressModules;

    moduleSummaryInformation.querySelector('.completed-modules').textContent=completedModules;

    overallProgress/=(moduleData.length);
    moduleSummaryInformation.querySelector('.percent-progress' ).textContent=`${Math.round(overallProgress)}%`;
    moduleSummaryInformation.querySelector('.overall-progress-bar-purple').style.width=`${Math.round(overallProgress)}%`;
}


/*===================================================
Infographic Page
=====================================================*/
async function fillInfographicPage(infographicModule, moduleData, subsectionNum) {
    // Fill the Module Title and Module Subtitle in the top left of the infographic page
    const leftTitleDiv = document.querySelector('.infographic-page .left-title');
    leftTitleDiv.querySelector('.left-module-title').textContent=infographicModule.moduleName;
    leftTitleDiv.querySelector('.left-module-subtitle').textContent=infographicModule.sectionTitles[subsectionNum-1];

    // Fill the time in the top right of the infographic page
    const rightTitleDiv= document.querySelector('.infographic-page .right-title');
    const currentModuleData = moduleData.find(item => item.module === infographicModule.module);
    rightTitleDiv.querySelector('.time-title-h5 h5').textContent=`${(100-currentModuleData.progress)/100*15} min`;
    
    // Fill the Module Title and Module Subtitles in the infographic page menu on the left
    const moduleSubtitles = document.querySelector('.infographic-page .module-subtitles');
    moduleSubtitles.querySelector('.module-section-title').textContent=infographicModule.moduleName;
    for (let i = 1; i <= 5; i++) {
        moduleSubtitles.querySelector(`.submodule${i}`).classList.remove('active-module-section');
        moduleSubtitles.querySelector(`.submodule${i} .number-circle`).classList.remove('active-circle');
        if (i==subsectionNum) {
            moduleSubtitles.querySelector(`.submodule${i}`).classList.remove('inactive-module-section');
            moduleSubtitles.querySelector(`.submodule${i}`).classList.add('active-module-section');
            moduleSubtitles.querySelector(`.submodule${i} .number-circle`).classList.add('active-circle');
        }
        else {
            moduleSubtitles.querySelector(`.submodule${i}`).classList.add('inactive-module-section');
        }
        moduleSubtitles.querySelector(`.submodule${i} h5`).textContent=infographicModule.sectionTitles[i-1];
        moduleSubtitles.querySelector(`.submodule${i} .number-circle h6`).textContent=i;

    }

    
    
    // Fill Tip Text
    const infographicModuleTip=document.querySelector('.infographic-page .module-tip');
    infographicModuleTip.querySelector('span').textContent=infographicModule.tips[subsectionNum-1];

    // Fill Top of Infographic with title, subtitle, and overview
    const moduleLearningTitle = document.querySelector(".infographic-page .left-module-learning-title");

    moduleLearningTitle.querySelector('h4').textContent=`${infographicModule.moduleName}: ${infographicModule.sectionTitles[subsectionNum-1]}`;
    moduleLearningTitle.querySelector('span').textContent=infographicModule.sectionMiniTitles[subsectionNum-1];
    moduleLearningTitle.querySelector('p').textContent=infographicModule.overviews[subsectionNum-1];

    // Fill Bottom of Infographic page with section number
    document.querySelector('.infographic-page .module-bottom h5').textContent=`Section ${subsectionNum} of 5`;
    // Fill Bottom of Infographic with 4 key learning cards and "remember" card if not on key takeaways
    if (subsectionNum<5) {
        document.querySelector('.infographic-page .takeaway-section-container').style.display="none";
        document.querySelector('.infographic-page .mini-quiz').style.display="none";
        // Fill Bottom of Infographic with 4 key learning cards
        let template = document.querySelector('.infographic-page .key-idea-templates');
        let keyIdeaContainer = document.querySelector('.infographic-page .learning-key-ideas');
        
        keyIdeaContainer.style.display="flex";
        keyIdeaContainer.innerHTML = "";
        const infographicIconsModule=infographicIcons.find(module => module.module === infographicModule.module)
        for (let i=0; i<4; i++) {
            const moduleClone = template.content.cloneNode(true);
            console.log(infographicModule);
            moduleClone.querySelector('.key-idea-card h5').textContent=infographicModule.keyIdeaTitles[subsectionNum-1][i];
            moduleClone.querySelector('.key-idea-card .first-bullet').textContent=infographicModule.keyIdeaBullets[subsectionNum-1][i][0];
            moduleClone.querySelector('.key-idea-card .icon-circle').innerHTML = `<i data-lucide="${infographicIconsModule.icons[subsectionNum-1][i]}"></i>`;
            moduleClone.querySelector('.key-idea-card .second-bullet').textContent=infographicModule.keyIdeaBullets[subsectionNum-1][i][1];
            keyIdeaContainer.appendChild(moduleClone);
        }
        lucide.createIcons();
            
        
        // Fill Bottom of Infographic with "remember" card
        const infographicModuleRemember = document.querySelector('.infographic-page .learning-remember');
        infographicModuleRemember.style.display="flex";
        infographicModuleRemember.querySelector('span').textContent=infographicModule.remembers[subsectionNum-1];
        
    }
    else if (subsectionNum==5) {
        document.querySelector('.infographic-page .learning-key-ideas').style.display="none";
        document.querySelector('.infographic-page .learning-remember').style.display="none";
        document.querySelector('.infographic-page .mini-quiz').style.display="flex";

        const sliceStart = (infographicModule.id - 1) * 5;
        const currentAnswers = quizAnswers.miniQuiz.slice(sliceStart, sliceStart + 5);
        const previousAnswers = (quizAnswers.previousMiniQuiz || []).slice(sliceStart, sliceStart + 5);

        const answeredCount = currentAnswers.filter(answer => answer != null).length;
        const hasPreviousAttempt = previousAnswers.length === 5 && previousAnswers.every(answer => answer != null);

        const startButton = document.querySelector('.infographic-page .mini-quiz-button');
        const reviewButton = document.querySelector('.infographic-page .review-quiz-button');

        startButton.querySelector('span').textContent = answeredCount > 0 ? "Continue Quiz" : "Start Quiz";
        reviewButton.style.display = hasPreviousAttempt ? "flex" : "none";

        const miniQuizScore = moduleQuizScores.find(item => item.type == "miniQuiz")?.[`module${infographicModule.id + 1}`];

        if (miniQuizScore != null) {
            const specificModule = moduleData.find(item => item.module === infographicModule.module);
            if (specificModule && specificModule.progress !== 100) {
                specificModule.progress = 100;
                await updateModuleProgress(specificModule);
            }
        }
        // Fill Bottom of Infographic with 4 key takeaway cards
        let template = document.querySelector('.infographic-page .takeaway-cards-template');
        let keyTakeawayContainer = document.querySelector('.infographic-page .takeaway-section-container');
        
        keyTakeawayContainer.style.display="flex";
        keyTakeawayContainer.innerHTML = "";
        const infographicIconsModule=infographicIcons.find(module => module.module === infographicModule.module)
        for (let i=0; i<4; i++) {
            const moduleClone = template.content.cloneNode(true);
            moduleClone.querySelector('.takeaway-card h5').textContent=infographicModule.keyIdeaTitles[subsectionNum-1][i];
            moduleClone.querySelector('.takeaway-card p').textContent=infographicModule.keyIdeaBullets[subsectionNum-1][i];
            moduleClone.querySelector('.takeaway-card .icon-circle').innerHTML = `<i data-lucide="${infographicIconsModule.icons[subsectionNum-1][i]}"></i>`;
            keyTakeawayContainer.appendChild(moduleClone);
        }
        lucide.createIcons();


    }

    // Fill Module Progress
    const infographicModuleProgress = document.querySelector('.infographic-page .module-progress');
    let currentModuleProgress=Math.round(moduleData.find(item => item.module === infographicModule.module).progress)
    infographicModuleProgress.querySelector('.progress-bar-purple').style.width=`${currentModuleProgress}%`;
    infographicModuleProgress.querySelector('.percent-progress-div h6').textContent=`${currentModuleProgress}%`;
    infographicModuleProgress.querySelector('.sections-complete').textContent=`${currentModuleProgress/100*5} of 5 Sections Completed*`;


    // Everything is now filled in, so show the infographic
    document.getElementById("infographicPage").style.visibility = "visible";

    


}

function infographicButtons() {
    const previousButton=document.querySelector('.infographic-page .module-bottom .white-button');
    const continueButton=document.querySelector('.infographic-page .module-bottom .purple-button');
    const nextModuleButton=document.querySelector('.infographic-page .next-module-button');
    // const infographicSubtitlesButton=document.querySelector('.infographic-page .inactive-module-section');
    const miniQuizButton=document.querySelector('.infographic-page .mini-quiz .mini-quiz-button');   
    const reviewQuizButton=document.querySelector('.infographic-page .mini-quiz .review-quiz-button');
    if (subsectionNumberLocal==5) {
        continueButton.classList.add("inactive-button");
    }
    previousButton.addEventListener("click", async function () {
        const selectedModule = sessionStorage.getItem("selectedModule");
        const infographicModule = infographic.find(item => item.module === selectedModule);
        if (subsectionNumberLocal!=1) {
            previousButton.classList.remove('inactive-button');
            continueButton.classList.remove('inactive-button');
            subsectionNumberLocal--;
            await fillInfographicPage(infographicModule, moduleData, subsectionNumberLocal);
            if (subsectionNumberLocal==1) {
                previousButton.classList.add("inactive-button");
            }
        }
    });

    continueButton.addEventListener("click", async function () {
        const selectedModule = sessionStorage.getItem("selectedModule");
        const infographicModule = infographic.find(item => item.module === selectedModule);
        console.log("CONTINUE FIRED", subsectionNumberLocal);
        if (subsectionNumberLocal<5) { 
            await changeProgress(moduleData, selectedModule);
            continueButton.classList.remove('inactive-button');
            previousButton.classList.remove('inactive-button');
            subsectionNumberLocal++;
            await fillInfographicPage(infographicModule, moduleData, subsectionNumberLocal);
            const moduleItem = moduleData.find(item => item.module === selectedModule);
            if (subsectionNumberLocal==5) {
                continueButton.classList.add("inactive-button");
            }
        }
    });

    miniQuizButton.addEventListener("click", function () {
        sessionStorage.setItem("quizType", "miniQuiz");
        sessionStorage.setItem("restoreQuizQuestion", "true");
        sessionStorage.removeItem("reviewQuiz");
    });
    reviewQuizButton.addEventListener("click", function () {
        sessionStorage.setItem("quizType", "miniQuiz");
        sessionStorage.setItem("reviewQuiz", "true");
        sessionStorage.removeItem("restoreQuizQuestion");
    });
    nextModuleButton.addEventListener("click", async function () {
        const currentSelectedModule = sessionStorage.getItem("selectedModule");
        const currentModuleIndex=moduleData.findIndex(item => item.module === currentSelectedModule)
        let nextSelectedModule;
        let nextModuleIndex;
        for (let i=currentModuleIndex+1; i<moduleData.length; i++) {
            if (moduleData[i].type === "module" && moduleData[i].required && moduleData[i].progress<100) {
                nextSelectedModule=moduleData[i].module
                nextModuleIndex=i
                break
            }
        }
        if (nextSelectedModule) {
            sessionStorage.setItem("selectedModule", nextSelectedModule);
            const infographicModule = infographic.find(item => item.module === nextSelectedModule); 
            subsectionNumberLocal=Math.min((moduleData.find(item => item.module===infographicModule.module).progress/20)+1,5);
            await fillInfographicPage(infographicModule, moduleData, subsectionNumberLocal);
            const futureModule = moduleData.slice(nextModuleIndex + 1).find(item => item.type === "module" && item.required && item.progress < 100);
            if (!futureModule) { 
                nextModuleButton.classList.add("inactive-button");
            }
        } 
        else {
            nextModuleButton.classList.add("inactive-button");
        }
            

    });



    }

    // infographicSubtitlesButton.addEventListener ("click", function() {
    //     const selectedModule = sessionStorage.getItem("selectedModule");
    //     const infographicModule = infographic.find(
    //         item => item.module === selectedModule
    //     );

    //     subsectionNumberLocal=;
    //     fillInfographicPage(infographicModule,moduleData, subsectionNumberLocal);
    // })


async function changeProgress(moduleData, selectedModule) {
    const quizType = sessionStorage.getItem("quizType");
    const moduleItem = moduleData.find(item => item.module === selectedModule);

    if (moduleItem.type === "module") {
        const newProgress = subsectionNumberLocal * 20;

        if (moduleItem.progress < newProgress) {
            moduleItem.progress = newProgress;
        }
    }

    else if (quizType === "postQuiz" || quizType === "preQuiz") {
        const quizProgressPercent = Math.round(quizAnswers[quizType].filter(item => item != null).length/quizAnswers[quizType].length*100);

        moduleItem.progress = quizProgressPercent;
    }
    await updateModuleProgress(moduleItem);
    
    

    
}
   


/*===================================================
Quiz Page
=====================================================*/
async function fillMiniQuizPage(moduleSelected, moduleData, questions, questionNumLocal, moduleAnswersSubset) {
    // // Will be used for a check later in the function to 
    // const storedModuleQuizScores = sessionStorage.getItem("moduleQuizScores");
    // const moduleQuizScores = storedModuleQuizScores
    //                         ? JSON.parse(storedModuleQuizScores)
    //                         : defaultModuleQuizScores;
    const quizType= sessionStorage.getItem("quizType");
    const quizSubmitted = sessionStorage.getItem("reviewQuiz") === "true";
    const startIndex = (moduleSelected.id - 2) * 5;
    if (quizSubmitted) {
        moduleAnswersSubset = (quizAnswers.previousMiniQuiz || []).slice(startIndex, startIndex + 5);
    }
    
    // Fill Quiz page header with header title and question number
    document.querySelector('.quiz-page .center-header-title h5').textContent = `Module ${moduleSelected.id}: ${moduleSelected.title}`;
    document.querySelector('.quiz-page .question-number-title h5').textContent=`Question ${questionNumLocal} of ${questions.length}`;
    fillQuizPageProgress(moduleAnswersSubset);

    const questionDiv = document.querySelector('.quiz-page .main-content');
    // Fill question div question number and question text
    questionDiv.querySelector('.question-div .question-number').textContent=`Question #${questionNumLocal}`
    questionDiv.querySelector('.question-div .question-text').textContent=`${questions[questionNumLocal-1].question}`

    // Fill question div answer choices
    const choices = questionDiv.querySelectorAll(".answer-choice");
    let selectedAnswer= moduleAnswersSubset[questionNumLocal-1];
    choices.forEach((button, i) => {
        button.classList.remove("active-answer", "no-hover");
        button.querySelector('span').textContent = questions[questionNumLocal - 1].choices[i];  
        if (!quizSubmitted) {
            if (button.dataset.answer === selectedAnswer) {
                button.classList.add("active-answer");
            }
        }
        else {
            button.classList.add("no-hover");
        }

    });
    if (quizSubmitted) {
        const result = await loadQuizReviewData("miniQuiz", moduleSelected.id);
        fillQuestionReview(questionNumLocal, moduleAnswersSubset, result, quizType)
    }

}
async function fillQuizPage(moduleSelected, moduleData, questions, questionNumLocal, moduleAnswers) {
    // // Will be used for a check later in the function to 
    // const storedModuleQuizScores = sessionStorage.getItem("moduleQuizScores");
    // const moduleQuizScores = storedModuleQuizScores
    //                         ? JSON.parse(storedModuleQuizScores)
    //                         : defaultModuleQuizScores;
    const quizType= sessionStorage.getItem("quizType");
    const reviewQuiz = sessionStorage.getItem("reviewQuiz") === "true";
    const quizSubmitted = quizType === "postQuiz" ? reviewQuiz : isQuizSubmitted(moduleQuizScores, quizType, moduleSelected);
    // const start = (moduleSelected.id - 2) * 5;
    // if (quizSubmitted) {
    //     moduleAnswersSubset = (quizAnswers.previousMiniQuiz || []).slice(start, start + 5);
    // }

    // Fill Quiz page header with header title and question number
    document.querySelector('.quiz-page .center-header-title h5').textContent = `Module ${moduleSelected.id}: ${moduleSelected.title}`;
    document.querySelector('.quiz-page .question-number-title h5').textContent=`Question ${questionNumLocal} of ${questions.length}`;
    fillQuizPageProgress(moduleAnswers);

    const questionDiv = document.querySelector('.quiz-page .main-content');
    // Fill question div question number and question text
    questionDiv.querySelector('.question-div .question-number').textContent=`Question #${questionNumLocal}`
    questionDiv.querySelector('.question-div .question-text').textContent=`${questions[questionNumLocal-1].question}`

    // Fill question div answer choices
    const choices = questionDiv.querySelectorAll(".answer-choice");
    let selectedAnswer= moduleAnswers[questionNumLocal-1];
    choices.forEach((button, i) => {
        button.classList.remove("active-answer");
        button.querySelector('span').textContent = questions[questionNumLocal - 1].choices[i];  
        if (!quizSubmitted) {
            if (button.dataset.answer === selectedAnswer) {
                button.classList.add("active-answer");
            }
        }
        else {
            button.classList.add("no-hover");
        }

    });
    if (quizSubmitted) {
        const result = await loadQuizReviewData(quizType);
        if (result !== false) {
            fillQuestionReview(questionNumLocal, moduleAnswers, result, quizType);
        }
    }

}

function isQuizSubmitted(moduleQuizScores, quizType, moduleSelected) {
    const specificQuizScores = moduleQuizScores.find(
        item => item.type === quizType
    );

    if (quizType === "miniQuiz") {
        const scoreKey = `module${moduleSelected.id}`;
        return specificQuizScores[scoreKey] !== null;
    }

    if (quizType === "preQuiz" || quizType === "postQuiz") {
        return specificQuizScores.overallScore !== null;
    }

    return false;
}

function fillQuestionReview(questionNumLocal, moduleAnswers, result, quizType) {
    const nextQuestionButton = document.querySelector('.quiz-page .next-button');
    const backQuestionButton = document.querySelector('.quiz-page .back-button');

    nextQuestionButton.style.display = "flex";
    document.querySelector('.quiz-page .submit-button').style.display = "none";

    nextQuestionButton.classList.remove("inactive-button");
    backQuestionButton.classList.remove("inactive-button");
    document.querySelector('.quiz-page .exit-button h5').textContent= "Exit Review";
    const questionDiv = document.querySelector('.quiz-page .main-content');
    questionDiv.querySelectorAll(".answer-choice .answer-status").forEach(status => {status.remove();});
    const choices = questionDiv.querySelectorAll('.answer-choice');
    const answerStatusTemplate = document.querySelector(".answer-status");
    const questionExplanation=questionDiv.querySelector('.question-explanation')
    questionExplanation.style.display="flex";

    if (result.questionResults[questionNumLocal-1]) {
        choices.forEach((button,i) => {
            button.classList.remove("active-answer","correct-answer-choice","incorrect-answer-choice");
            if (button.dataset.answer === result.correctAnswers[questionNumLocal-1]) {
                button.classList.add('correct-answer-choice');
                const answerStatus = answerStatusTemplate.cloneNode(true);
                button.appendChild(answerStatus);
                answerStatus.style.display = "flex";
                answerStatus.querySelector('.wrong-answer-svg').style.display = "none";
                answerStatus.querySelector('.correct-answer-svg').style.display = "inline-flex";
                answerStatus.querySelector('.answer-bubble').classList.add('correct-answer-bubble')
                questionExplanation.querySelector('.correct-explain').textContent=result["explanations"][questionNumLocal-1][i]
                questionExplanation.querySelector('.incorrect-explain').style.display="none";
                
            }
        });
    }
    else {
        choices.forEach((button,i) => {
            button.classList.remove("active-answer","correct-answer-choice","incorrect-answer-choice");
            if (button.dataset.answer === result.correctAnswers[questionNumLocal-1]) {
                button.classList.add('correct-answer-choice');
                const answerStatus = answerStatusTemplate.cloneNode(true);
                button.appendChild(answerStatus);
                answerStatus.style.display = "flex";
                answerStatus.querySelector('.wrong-answer-svg').style.display = "none";
                answerStatus.querySelector('.result-icon-circle').classList.add('correct-answer')
                answerStatus.querySelector('.correct-answer-svg').style.display = "inline-flex";
                answerStatus.querySelector('.answer-bubble').classList.add('correct-answer-bubble')
                answerStatus.querySelector('.answer-bubble h5').textContent="Correct Answer";
                questionExplanation.querySelector('.correct-explain').textContent=result["explanations"][questionNumLocal-1][i]
            }
            else if (button.dataset.answer === moduleAnswers[questionNumLocal-1]) {
                button.classList.add('incorrect-answer-choice');
                const answerStatus = answerStatusTemplate.cloneNode(true);
                button.appendChild(answerStatus);
                answerStatus.style.display = "flex";
                answerStatus.querySelector('.wrong-answer-svg').style.display = "inline-flex";
                answerStatus.querySelector('.result-icon-circle').classList.add('incorrect-answer')
                answerStatus.querySelector('.correct-answer-svg').style.display = "none";
                answerStatus.querySelector('.answer-bubble').classList.add('incorrect-answer-bubble')
                answerStatus.querySelector('.answer-bubble h5').textContent="Your Answer";
                questionExplanation.querySelector('.incorrect-explain').style.display="flex";
                questionExplanation.querySelector('.incorrect-explain').textContent=result["explanations"][questionNumLocal-1][i]
            }
        });
    }

    

}
function quizSubmissionButtonSwitch(moduleAnswers, nextQuestionButton, moduleQuizScores) {
    const quizType = sessionStorage.getItem("quizType");

    if (sessionStorage.getItem("reviewQuiz") === "true" ||
        (quizType === "preQuiz" && moduleQuizScores.find(item => item.type === quizType)?.overallScore != null)) {
        document.querySelector('.quiz-page .submit-button').style.display = "none";
        return;
    }

    const numberQuestionsAnswered = moduleAnswers.filter(item => item != null).length;

    if (numberQuestionsAnswered == moduleAnswers.length && questionNumLocal == moduleAnswers.length) {
        nextQuestionButton.style.display = "none";
        document.querySelector('.quiz-page .submit-button').style.display = "flex";
    }
}
function QuizButtons(moduleSelected, moduleData, quizQuestions, moduleAnswers, moduleQuizScores) {
    const restoreQuestion = sessionStorage.getItem("restoreQuizQuestion");
    const answerButtons=document.querySelectorAll('.quiz-page .question-div .answer-choice')
    const nextQuestionButton=document.querySelector('.quiz-page .question-footer .next-button')
    const backQuestionButton=document.querySelector('.quiz-page .question-footer .back-button')
    const exitQuestionButton=document.querySelector('.quiz-page .top-quiz-template .white-button')
    const submitQuestionButton=document.querySelector('.quiz-page .question-footer .submit-button')

    if (sessionStorage.getItem("reviewQuiz") !== "true") {
        quizSubmissionButtonSwitch(moduleAnswers, nextQuestionButton, moduleQuizScores);
    }

    const quizType = sessionStorage.getItem("quizType");
    const selectedModule = sessionStorage.getItem("selectedModule");
    if (restoreQuestion==="false") {
        backQuestionButton.classList.add("inactive-button");
    }
    if (questionNumLocal === moduleAnswers.length) {
        nextQuestionButton.classList.add("inactive-button");
        if (quizType=="miniQuiz") {
            const moduleID=`module${moduleSelected.id}`
            if (moduleQuizScores.find(item => item.type===quizType)[moduleID]==null)
                quizSubmissionButtonSwitch (moduleAnswers, nextQuestionButton, moduleQuizScores)
        }
        else if (quizType=="preQuiz" || quizType=="postQuiz") {
            if (moduleQuizScores.find(item => item.type===quizType).overallScore==null)
                quizSubmissionButtonSwitch (moduleAnswers, nextQuestionButton, moduleQuizScores)
        }  
    }


    answerButtons.forEach(button => {
        button.addEventListener("click", function (event) {
            if (sessionStorage.getItem("reviewQuiz") === "true") return;
            answerButtons.forEach(button => {
                button.classList.remove("active-answer");
            });
            
            event.currentTarget.classList.add("active-answer");

            
            if (quizType=="miniQuiz") {
                const selectedAnswer = event.currentTarget.dataset.answer;
                const startIndex = (moduleSelected.id - 2) * 5;
                quizAnswers[quizType][startIndex+(questionNumLocal-1)]=selectedAnswer
                moduleAnswers = quizAnswers[quizType].slice(startIndex,startIndex + 5);
                quizSubmissionButtonSwitch (moduleAnswers, nextQuestionButton, moduleQuizScores)
                fillQuizPageProgress(moduleAnswers);
            }
            else {
                const selectedAnswer = event.currentTarget.dataset.answer;
                quizAnswers[quizType][questionNumLocal-1]=selectedAnswer
                quizSubmissionButtonSwitch (moduleAnswers, nextQuestionButton, moduleQuizScores)
                fillQuizPageProgress(moduleAnswers);
            }
            

        });
    });

    nextQuestionButton.addEventListener("click", async function () {
        if (questionNumLocal < quizQuestions.length) {
            sessionStorage.setItem("restoreQuizQuestion", "false");
            questionNumLocal++;
            if (quizType=="miniQuiz") {
                await fillMiniQuizPage(moduleSelected, moduleData, quizQuestions, questionNumLocal, moduleAnswers);
            }
            else {
                
                await fillQuizPage(moduleSelected, moduleData, quizQuestions, questionNumLocal, moduleAnswers)
            }
            backQuestionButton.classList.remove("inactive-button");

            if (questionNumLocal === moduleAnswers.length) {
                nextQuestionButton.classList.add("inactive-button");
                if (quizType=="miniQuiz") {
                    if (sessionStorage.getItem("reviewQuiz") !== "true") {
                        quizSubmissionButtonSwitch(moduleAnswers, nextQuestionButton, moduleQuizScores);
                    }
                }
                else if (quizType=="preQuiz" || quizType=="postQuiz") {
                    if (moduleQuizScores.find(item => item.type===quizType).overallScore==null)
                        quizSubmissionButtonSwitch (moduleAnswers, nextQuestionButton, moduleQuizScores)
                }
                
                
            }
        }
    });

    backQuestionButton.addEventListener("click", async function () {
        if (questionNumLocal > 1) {
            sessionStorage.setItem("restoreQuizQuestion", "false");
            questionNumLocal--;
            if (quizType=="miniQuiz") {
                await fillMiniQuizPage(moduleSelected, moduleData, quizQuestions, questionNumLocal, moduleAnswers);
            }
            else {
                await fillQuizPage(moduleSelected, moduleData, quizQuestions, questionNumLocal, moduleAnswers)
            }
            nextQuestionButton.classList.remove("inactive-button");
            nextQuestionButton.style.display= "flex";
            document.querySelector('.quiz-page .submit-button').style.display= "none";

            if (questionNumLocal == 1) {
                backQuestionButton.classList.add("inactive-button");
            }
        }
    });

    exitQuestionButton.addEventListener("click", async function() {
        const reviewing = sessionStorage.getItem("reviewQuiz") === "true";

        if (quizType === "postQuiz" && reviewing) {
            const response = await fetch(`${API_BASE}/close-post-quiz-review`, {
                method: "POST",
                credentials: "include",
                headers: { "X-CSRF-Token": csrfToken }
            });

            if (!response.ok) throw new Error("Failed to close review");
            sessionStorage.removeItem("reviewQuiz");
        }

        if (quizType === "miniQuiz") {
            if (!reviewing) await updateQuizAnswers(quizType);
            sessionStorage.removeItem("reviewQuiz");
            window.location.href = "../infographic-module-template/infographic.html";
            return;
        }

        if (quizType === "preQuiz" || quizType === "postQuiz") {
            if (!reviewing) await updateQuizAnswers(quizType);
            await changeProgress(moduleData, selectedModule);
            sessionStorage.removeItem("reviewQuiz");
            window.location.href = "../my-modules-page/my-modules.html";
        }
    });

    submitQuestionButton.addEventListener("click", async function() {
        const moduleID=moduleSelected.id;
        await updateQuizAnswers(quizType)
        
        const response = await fetch(`${API_BASE}/submit-quiz`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken
            },
            credentials: "include",
            body: JSON.stringify({
                quizType: quizType,
                answers: moduleAnswers,
                moduleID: moduleID
            })
        });
        const result = await response.json();
        if (!response.ok) {
            console.error("Quiz submission failed:", result);
            alert("Quiz submission failed. Please try again.");
            return;
        }

        updateModuleScore(moduleData, quizType, result.quizScore, selectedModule, moduleQuizScores);
        if (quizType === "preQuiz" || quizType === "postQuiz") {
            console.log("BEFORE changeProgress:", moduleData.find(module => module.id === moduleSelected.id));
    
            await changeProgress(moduleData, selectedModule);
            
            console.log("AFTER changeProgress:", moduleData.find(module => module.id === moduleSelected.id));

        }
        questionNumLocal = 1;
        submitQuestionButton.style.display = "none";
        if (quizType === "miniQuiz") {
            const startIndex = (moduleSelected.id - 2) * 5;

            quizAnswers.previousMiniQuiz ??= Array(40).fill(null);
            quizAnswers.previousMiniQuiz.splice(startIndex, 5, ...moduleAnswers);
            quizAnswers.miniQuiz.splice(startIndex, 5, ...Array(5).fill(null));

            sessionStorage.setItem("reviewQuiz", "true");
            nextQuestionButton.style.display = "flex";
            nextQuestionButton.classList.remove("inactive-button");
            backQuestionButton.classList.add("inactive-button");
            await fillMiniQuizPage(moduleSelected, moduleData, quizQuestions, questionNumLocal, moduleAnswers);
        }

        else if (quizType==="preQuiz" || quizType==="postQuiz") {
            sessionStorage.setItem("reviewQuiz", "true");
            await fillQuizPage(moduleSelected, moduleData, quizQuestions, questionNumLocal, moduleAnswers)
            
        }
        if (quizType=="preQuiz") {
            const specificModule=moduleQuizScores.find(moduleScores => moduleScores.type==="preQuiz")
            console.log("PREQUIZ SCORES:", specificModule);
            for (let i=2; i<10; i++) {
                const moduleID=`module${i}`;
                if (specificModule[moduleID]<=4) {
                    moduleData.find(module => module.id === i).required=true;
                }
            }
        }
           
    });






}

function fillQuizPageProgress(moduleAnswers) {
    let quizType = sessionStorage.getItem("quizType");
    let percentComplete = sessionStorage.getItem("reviewQuiz") === "true" ? 100 : Math.round((moduleAnswers.filter(item => item != null).length) / moduleAnswers.length * 100);
    // Fill question div progress bar with proper percentage and width
    const questionDiv = document.querySelector('.quiz-page .main-content');
    questionDiv.querySelector('.progress-bar-purple').style.width=`${percentComplete}%`;
    const percentXTranslation = 100 - percentComplete;
    questionDiv.querySelector('.progress-bar-purple .progress-label').style.transform = `translateX(${percentXTranslation}%) translateY(-50%)`;
    questionDiv.querySelector('.progress-bar-purple .progress-label').textContent=`${percentComplete}% Complete`;

}

function updateModuleScore(moduleData, quizType, score, selectedModule, moduleQuizScores) {
    const specificModuleQuizScores=moduleQuizScores.find(item => item.type === quizType);
    if (quizType=="miniQuiz") {
        const moduleID=moduleData.find(item => item.module === selectedModule).id;
        specificModuleQuizScores[`module${moduleID}`]=score;
        
    }
    else if (quizType=="preQuiz" || quizType=="postQuiz") {
        let sum=0
        for (let i=0; i<score.length; i++) {
            specificModuleQuizScores[`module${i+2}`]=score[i];
            sum+=score[i];
        }
        specificModuleQuizScores.overallScore=sum;
            
    }
    console.log("specificModuleQuizScores:", specificModuleQuizScores);
    console.log("quizType:", quizType);
    // sessionStorage.setItem("moduleQuizScores", JSON.stringify(moduleQuizScores));
    // await updateQuizScores(quizType);


}  

    

let moduleData;
let moduleQuizScores;
let quizAnswers;
let firstName;
let lastName;
let admin_users_data_li = [];
let subsectionNumberLocal = 1;
let questionNumLocal = 1;
let trainingTimer = null;
let csrfToken = null;

async function checkLogin() {
    const response = await fetch(`${API_BASE}/check-session`, {
        method: "GET",
        credentials: "include"
    });

    if (!response.ok) return false;
    const user = await response.json();
    firstName = user.first_name;
    lastName = user.last_name;
    return true;
}


async function loadCsrfToken() {
    const response = await fetch(`${API_BASE}/csrf-token`, {
        credentials: "include"
    });
    if (!response.ok) throw new Error("Failed to retrieve CSRF token.");
    csrfToken = (await response.json()).csrf_token;
}


async function loadModuleData() {
    const response = await fetch(`${API_BASE}/get-module-data`, {
        method: "GET",
        credentials: "include"
    });
    const moduleDataTemp=await response.json();
    moduleData = defaultModuleData.map(module => {
        const savedData = moduleDataTemp.find(saved => saved.module_id === module.id);

        return {
            ...module,
            progress: savedData.progress,
            status: savedData.status,
            required: savedData.required
        };
    });
}



async function loadModuleQuizScores() {
    const response = await fetch(`${API_BASE}/get-quiz-scores`, {
        method: "GET",
        credentials: "include"
    });

    moduleQuizScores = await response.json();
}
    


async function loadModuleQuizAnswers() {
    const response = await fetch(`${API_BASE}/get-quiz-answers`, {
        method: "GET",
        credentials: "include"
    });

    quizAnswers = await response.json();
}

async function getAdminStatus() {
    const response = await fetch(`${API_BASE}/get-admin-status`, {
        method: "GET",
        credentials: "include"
    });
    if (!response.ok) {
        console.error("Failed to get admin status:", response.status);
        return null;
    }
    return await response.json();
}

let login = await checkLogin();
const protectedPage = document.querySelector(
    '.dashboard-page, .admin-dashboard-page, .my-modules-page, .infographic-page, .quiz-page'
);
if (!login && protectedPage) {
    window.location.replace("../login-page/login.html");
}

else if (login) { 
    await loadCsrfToken();
    await loadModuleData()
    await loadModuleQuizScores()
    await loadModuleQuizAnswers()
}





if (document.querySelector('.landing-page')) {
    landingButtons();
}
if (document.querySelector('.create-account-page')) {
    registerUserButtons()
}
if (document.querySelector('.login-page.main')) {
    loginUserButtons()
}
if (document.querySelector('#forgot-password-form')) {
    forgotPasswordButtons();
}
if (document.querySelector("#reset-password-form")) {
    resetPasswordButtons();
}
if (document.querySelector('.dashboard-page')) {
    await fillSidebarContainer('[data-page="dashboard"]');

    const adminLink = document.querySelector("#admin-link");
    const admin_status = await getAdminStatus();
    if (adminLink && admin_status) {
        adminLink.style.display = "flex";
    }

    documentNameFill(firstName, lastName);
    dashboardModulesRowsDiv(moduleData);
    dashboardOverallProgressDiv(moduleData);
    dashboardNextUpDiv(moduleData);
    dashboardDeeperProgressDiv(moduleData, moduleQuizScores);
    
}
if (document.querySelector('.admin-dashboard-page')) {
    await fillSidebarContainer('[data-page="admin-dashboard"]');

    const adminLink = document.querySelector("#admin-link");
    const admin_status = await getAdminStatus();
    if (adminLink && admin_status) {
        adminLink.style.display = "flex";
    }

    documentNameFill(firstName, lastName);
    fillAdminDashboard()
}


if (document.querySelector('.my-modules-page')) {
    await fillSidebarContainer('[data-page="my-modules"]')

    const adminLink = document.querySelector("#admin-link");
    const admin_status = await getAdminStatus();
    if (adminLink && admin_status) {
        adminLink.style.display = "flex";
    }

    documentNameFill(firstName, lastName);
    
    myModulesRowsDiv(moduleData, moduleQuizScores);
    myModuleSummaryInformationDiv(moduleData)
}

if (document.querySelector('.infographic-page') || document.querySelector('.quiz-page')) {
    trainingTimer = startTrainingTimer();

    let lastSavedSeconds = 0;

    setInterval(() => {
        const currentSeconds = trainingTimer.getSeconds();
        const newSeconds = currentSeconds - lastSavedSeconds;

        if (newSeconds > 0) {
            saveTrainingTime(newSeconds);
            lastSavedSeconds = currentSeconds;
        }
    }, 30000);

    window.addEventListener("pagehide", () => {
        const currentSeconds = trainingTimer.getSeconds();
        const newSeconds = currentSeconds - lastSavedSeconds;

        if (newSeconds > 0) {
            saveTrainingTime(newSeconds, true);
        }
        trainingTimer.stop();
    });
}

if (document.querySelector('.infographic-page')) {
    
    await fillSidebarContainer('[data-page="my-modules"]')

    const adminLink = document.querySelector("#admin-link");
    const admin_status = await getAdminStatus();
    if (adminLink && admin_status) {
        adminLink.style.display = "flex";
    }

    documentNameFill(firstName, lastName);

    const selectedModule = sessionStorage.getItem("selectedModule");
    const infographicModule = infographic.find(item => item.module === selectedModule);

    subsectionNumberLocal=Math.min((moduleData.find(item => item.module===infographicModule.module).progress/20)+1,5);
    await fillInfographicPage(infographicModule, moduleData, subsectionNumberLocal);

    infographicButtons();
    

}
if (document.querySelector('.quiz-page')) {

    let quizQuestions;
    let quizType = sessionStorage.getItem("quizType");
    let moduleAnswers;
    const restoreQuestion = sessionStorage.getItem("restoreQuizQuestion");
    const selectedModule = sessionStorage.getItem("selectedModule");
    const moduleSelected=moduleData.find(item => item.module===selectedModule)
    if (quizType=="miniQuiz") {
        quizQuestions=miniQuizQuestions.filter(item => item.module === moduleSelected.module);

        let sliceStart=(moduleSelected.id-2)*5
        moduleAnswers=quizAnswers[quizType].slice(sliceStart, sliceStart+5)
        console.log(restoreQuestion)
        if (restoreQuestion === "true" && moduleAnswers.filter(item => item===null).length!=moduleAnswers.length) {
            const firstNullIndex = moduleAnswers.indexOf(null);

            if (firstNullIndex !== -1) {
                questionNumLocal = firstNullIndex;
            }
            else {
                questionNumLocal = moduleAnswers.length;
            }
        }
        if (sessionStorage.getItem("reviewQuiz") === "true") {
            questionNumLocal = 1;
        }
        fillMiniQuizPage(moduleSelected, moduleData, quizQuestions, questionNumLocal, moduleAnswers); 
        QuizButtons(moduleSelected, moduleData, quizQuestions, moduleAnswers, moduleQuizScores);


        
    }
    else if (quizType=="preQuiz") {
        quizQuestions=preQuizQuestions;
        moduleAnswers=quizAnswers[quizType]
        if (restoreQuestion === "true" && moduleAnswers.filter(item => item===null).length!=moduleAnswers.length) {
            const firstNullIndex = moduleAnswers.indexOf(null);

            if (firstNullIndex !== -1) {
                questionNumLocal = firstNullIndex;
            }
            else {
                questionNumLocal = moduleAnswers.length;
            }
        }
        if (isQuizSubmitted(moduleQuizScores, quizType, moduleSelected)) {
            questionNumLocal = 1;
        }


        fillQuizPage(moduleSelected, moduleData, quizQuestions, questionNumLocal, moduleAnswers)
        QuizButtons(moduleSelected, moduleData, quizQuestions, moduleAnswers, moduleQuizScores);
        
        
    }
    else if (quizType=="postQuiz") {
        quizQuestions=postQuizQuestions;
        moduleAnswers=quizAnswers[quizType]
        if (restoreQuestion === "true" && moduleAnswers.filter(item => item===null).length!=moduleAnswers.length) {
            const firstNullIndex = moduleAnswers.indexOf(null);

            if (firstNullIndex !== -1) {
                questionNumLocal = firstNullIndex;
            }
            else {
                questionNumLocal = moduleAnswers.length;
            }
        }
        if (sessionStorage.getItem("reviewQuiz") === "true") {
            questionNumLocal = 1;
        }
        fillQuizPage(moduleSelected, moduleData, quizQuestions, questionNumLocal, moduleAnswers)
        QuizButtons(moduleSelected, moduleData, quizQuestions, moduleAnswers, moduleQuizScores);
    }
 

}

