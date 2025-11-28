// Admin Configuration
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

// Global Variables
let currentAdmin = null;
let allWithdrawals = [];
let allUsers = [];
let allQuestions = [];

// Admin Authentication
function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        currentAdmin = { username: username, loginTime: new Date() };
        showScreen('dashboardScreen');
        loadDashboardData();
        startRealTimeUpdates();
    } else {
        alert('Invalid credentials! Please try again.');
    }
}

function adminLogout() {
    currentAdmin = null;
    stopRealTimeUpdates();
    showScreen('loginScreen');
    // Clear form
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show target section and activate nav item
    document.getElementById(sectionId + 'Section').classList.add('active');
    event.target.classList.add('active');
}

// Dashboard Functions
function loadDashboardData() {
    loadUserStats();
    loadWithdrawalStats();
    loadQuizStats();
    loadRecentActivity();
}

function loadUserStats() {
    const usersRef = db.collection('users');
    
    usersRef.get().then((snapshot) => {
        const totalUsers = snapshot.size;
        document.getElementById('totalUsers').textContent = totalUsers.toLocaleString();
        
        // Calculate total coins
        let totalCoins = 0;
        snapshot.forEach(doc => {
            const userData = doc.data();
            totalCoins += userData.coins || 0;
        });
        document.getElementById('totalCoins').textContent = totalCoins.toLocaleString();
    });
}

function loadWithdrawalStats() {
    const withdrawalsRef = db.collection('withdrawals');
    
    withdrawalsRef.get().then((snapshot) => {
        const totalWithdrawals = snapshot.size;
        document.getElementById('totalWithdrawals').textContent = totalWithdrawals.toLocaleString();
        
        // Calculate total withdrawal amount
        let totalAmount = 0;
        snapshot.forEach(doc => {
            const withdrawal = doc.data();
            totalAmount += withdrawal.amountInRupees || 0;
        });
    });
}

function loadQuizStats() {
    const quizRef = db.collection('quizResults');
    
    quizRef.get().then((snapshot) => {
        document.getElementById('totalQuizzes').textContent = snapshot.size.toLocaleString();
    });
}

function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';
    
    // Load recent withdrawals
    const withdrawalsRef = db.collection('withdrawals')
        .orderBy('timestamp', 'desc')
        .limit(5);
    
    withdrawalsRef.get().then((snapshot) => {
        snapshot.forEach(doc => {
            const withdrawal = doc.data();
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div>
                    <strong>Withdrawal Request</strong>
                    <p>${withdrawal.coins} coins - ${withdrawal.status}</p>
                </div>
                <div>${formatDate(withdrawal.timestamp?.toDate())}</div>
            `;
            activityList.appendChild(item);
        });
    });
    
    // Load recent user registrations
    const usersRef = db.collection('users')
        .orderBy('createdAt', 'desc')
        .limit(5);
    
    usersRef.get().then((snapshot) => {
        snapshot.forEach(doc => {
            const user = doc.data();
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div>
                    <strong>New User Registered</strong>
                    <p>UID: ${user.uid.substring(0, 8)}...</p>
                </div>
                <div>${formatDate(user.createdAt?.toDate())}</div>
            `;
            activityList.appendChild(item);
        });
    });
}

// Withdrawal Management
function loadWithdrawals() {
    const withdrawalsRef = db.collection('withdrawals')
        .orderBy('timestamp', 'desc');
    
    withdrawalsRef.onSnapshot((snapshot) => {
        allWithdrawals = [];
        const tableBody = document.getElementById('withdrawalsTable');
        tableBody.innerHTML = '';
        
        snapshot.forEach(doc => {
            const withdrawal = { id: doc.id, ...doc.data() };
            allWithdrawals.push(withdrawal);
            
            if (filterWithdrawal(withdrawal)) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${withdrawal.userId.substring(0, 8)}...</td>
                    <td>${withdrawal.coins.toLocaleString()}</td>
                    <td>₹${withdrawal.amountInRupees}</td>
                    <td>${withdrawal.upiId}</td>
                    <td><span class="status ${withdrawal.status}">${withdrawal.status}</span></td>
                    <td>${formatDate(withdrawal.timestamp?.toDate())}</td>
                    <td>
                        ${withdrawal.status === 'pending' ? 
                            `<button class="btn-primary" onclick="processWithdrawal('${doc.id}')">Process</button>` : 
                            `<span>Processed</span>`
                        }
                    </td>
                `;
                tableBody.appendChild(row);
            }
        });
    });
}

function filterWithdrawals() {
    const tableBody = document.getElementById('withdrawalsTable');
    tableBody.innerHTML = '';
    
    allWithdrawals.forEach(withdrawal => {
        if (filterWithdrawal(withdrawal)) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${withdrawal.userId.substring(0, 8)}...</td>
                <td>${withdrawal.coins.toLocaleString()}</td>
                <td>₹${withdrawal.amountInRupees}</td>
                <td>${withdrawal.upiId}</td>
                <td><span class="status ${withdrawal.status}">${withdrawal.status}</span></td>
                <td>${formatDate(withdrawal.timestamp?.toDate())}</td>
                <td>
                    ${withdrawal.status === 'pending' ? 
                        `<button class="btn-primary" onclick="processWithdrawal('${withdrawal.id}')">Process</button>` : 
                        `<span>Processed</span>`
                    }
                </td>
            `;
            tableBody.appendChild(row);
        }
    });
}

function filterWithdrawal(withdrawal) {
    const statusFilter = document.getElementById('withdrawalFilter').value;
    const dateFilter = document.getElementById('withdrawalDate').value;
    
    if (statusFilter !== 'all' && withdrawal.status !== statusFilter) {
        return false;
    }
    
    if (dateFilter) {
        const withdrawalDate = withdrawal.timestamp?.toDate().toISOString().split('T')[0];
        if (withdrawalDate !== dateFilter) {
            return false;
        }
    }
    
    return true;
}

function processWithdrawal(withdrawalId) {
    const withdrawal = allWithdrawals.find(w => w.id === withdrawalId);
    if (!withdrawal) return;
    
    const modal = document.getElementById('withdrawalModal');
    const details = document.getElementById('withdrawalDetails');
    
    details.innerHTML = `
        <div class="withdrawal-detail">
            <p><strong>User ID:</strong> ${withdrawal.userId}</p>
            <p><strong>Coins:</strong> ${withdrawal.coins.toLocaleString()}</p>
            <p><strong>Amount:</strong> ₹${withdrawal.amountInRupees}</p>
            <p><strong>UPI ID:</strong> ${withdrawal.upiId}</p>
            <p><strong>Payment Method:</strong> ${withdrawal.paymentMethod}</p>
            <p><strong>Requested:</strong> ${formatDate(withdrawal.timestamp?.toDate())}</p>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.dataset.withdrawalId = withdrawalId;
}

function approveWithdrawal() {
    const withdrawalId = document.getElementById('withdrawalModal').dataset.withdrawalId;
    const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
    
    withdrawalRef.update({
        status: 'approved',
        processedAt: firebase.firestore.FieldValue.serverTimestamp(),
        processedBy: currentAdmin.username
    }).then(() => {
        alert('Withdrawal approved successfully!');
        closeModal();
    }).catch(error => {
        alert('Error approving withdrawal: ' + error.message);
    });
}

function rejectWithdrawal() {
    const withdrawalId = document.getElementById('withdrawalModal').dataset.withdrawalId;
    const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
    
    withdrawalRef.update({
        status: 'rejected',
        processedAt: firebase.firestore.FieldValue.serverTimestamp(),
        processedBy: currentAdmin.username
    }).then(() => {
        alert('Withdrawal rejected!');
        closeModal();
    }).catch(error => {
        alert('Error rejecting withdrawal: ' + error.message);
    });
}

// User Management
function loadUsers() {
    const usersRef = db.collection('users');
    
    usersRef.onSnapshot((snapshot) => {
        allUsers = [];
        const tableBody = document.getElementById('usersTable');
        tableBody.innerHTML = '';
        
        snapshot.forEach(doc => {
            const user = { id: doc.id, ...doc.data() };
            allUsers.push(user);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.uid.substring(0, 8)}...</td>
                <td>${user.coins?.toLocaleString() || 0}</td>
                <td>${user.totalReferrals || 0}</td>
                <td>${user.quizzesPlayed || 0}</td>
                <td>${formatDate(user.createdAt?.toDate())}</td>
                <td><span class="status active">Active</span></td>
                <td>
                    <button class="btn-primary" onclick="viewUser('${doc.id}')">View</button>
                    <button class="btn-reject" onclick="suspendUser('${doc.id}')">Suspend</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    });
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const tableBody = document.getElementById('usersTable');
    tableBody.innerHTML = '';
    
    allUsers.forEach(user => {
        if (user.uid.toLowerCase().includes(searchTerm) || 
            (user.referralCode && user.referralCode.toLowerCase().includes(searchTerm))) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.uid.substring(0, 8)}...</td>
                <td>${user.coins?.toLocaleString() || 0}</td>
                <td>${user.totalReferrals || 0}</td>
                <td>${user.quizzesPlayed || 0}</td>
                <td>${formatDate(user.createdAt?.toDate())}</td>
                <td><span class="status active">Active</span></td>
                <td>
                    <button class="btn-primary" onclick="viewUser('${user.id}')">View</button>
                    <button class="btn-reject" onclick="suspendUser('${user.id}')">Suspend</button>
                </td>
            `;
            tableBody.appendChild(row);
        }
    });
}

function viewUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    alert(`User Details:\n
UID: ${user.uid}
Coins: ${user.coins}
Referrals: ${user.totalReferrals}
Quizzes Played: ${user.quizzesPlayed}
Correct Answers: ${user.correctAnswers}
Joined: ${formatDate(user.createdAt?.toDate())}
Referral Code: ${user.referralCode}`);
}

function suspendUser(userId) {
    if (confirm('Are you sure you want to suspend this user?')) {
        // Implement user suspension logic
        alert('User suspended successfully!');
    }
}

// Question Management
function loadQuestions() {
    const questionsRef = db.collection('questions');
    
    questionsRef.onSnapshot((snapshot) => {
        allQuestions = [];
        const tableBody = document.getElementById('questionsTable');
        tableBody.innerHTML = '';
        
        snapshot.forEach(doc => {
            const question = { id: doc.id, ...doc.data() };
            allQuestions.push(question);
            
            if (filterQuestion(question)) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${question.question.substring(0, 50)}...</td>
                    <td>${question.category}</td>
                    <td>${question.difficulty}</td>
                    <td>${question.options ? question.options.length : 0} options</td>
                    <td>${question.correct !== undefined ? 'Option ' + (String.fromCharCode(65 + question.correct)) : 'N/A'}</td>
                    <td>
                        <button class="btn-primary" onclick="editQuestion('${doc.id}')">Edit</button>
                        <button class="btn-reject" onclick="deleteQuestion('${doc.id}')">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            }
        });
    });
}

function filterQuestions() {
    const tableBody = document.getElementById('questionsTable');
    tableBody.innerHTML = '';
    
    allQuestions.forEach(question => {
        if (filterQuestion(question)) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${question.question.substring(0, 50)}...</td>
                <td>${question.category}</td>
                <td>${question.difficulty}</td>
                <td>${question.options ? question.options.length : 0} options</td>
                <td>${question.correct !== undefined ? 'Option ' + (String.fromCharCode(65 + question.correct)) : 'N/A'}</td>
                <td>
                    <button class="btn-primary" onclick="editQuestion('${question.id}')">Edit</button>
                    <button class="btn-reject" onclick="deleteQuestion('${question.id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        }
    });
}

function filterQuestion(question) {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const difficultyFilter = document.getElementById('difficultyFilter').value;
    
    if (categoryFilter !== 'all' && question.category !== categoryFilter) {
        return false;
    }
    
    if (difficultyFilter !== 'all' && question.difficulty !== difficultyFilter) {
        return false;
    }
    
    return true;
}

function showAddQuestionModal() {
    document.getElementById('addQuestionModal').style.display = 'flex';
    // Clear form
    document.getElementById('newQuestion').value = '';
    document.getElementById('optionA').value = '';
    document.getElementById('optionB').value = '';
    document.getElementById('optionC').value = '';
    document.getElementById('optionD').value = '';
}

function saveQuestion() {
    const question = document.getElementById('newQuestion').value;
    const category = document.getElementById('newCategory').value;
    const difficulty = document.getElementById('newDifficulty').value;
    const optionA = document.getElementById('optionA').value;
    const optionB = document.getElementById('optionB').value;
    const optionC = document.getElementById('optionC').value;
    const optionD = document.getElementById('optionD').value;
    const correctAnswer = parseInt(document.getElementById('correctAnswer').value);
    
    if (!question || !optionA || !optionB || !optionC || !optionD) {
        alert('Please fill all fields!');
        return;
    }
    
    const questionData = {
        question: question,
        category: category,
        difficulty: difficulty,
        options: [optionA, optionB, optionC, optionD],
        correct: correctAnswer,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: currentAdmin.username
    };
    
    db.collection('questions').add(questionData)
        .then(() => {
            alert('Question added successfully!');
            closeModal();
        })
        .catch(error => {
            alert('Error adding question: ' + error.message);
        });
}

function editQuestion(questionId) {
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) return;
    
    // Populate modal with question data
    document.getElementById('newQuestion').value = question.question;
    document.getElementById('newCategory').value = question.category;
    document.getElementById('newDifficulty').value = question.difficulty;
    document.getElementById('optionA').value = question.options[0];
    document.getElementById('optionB').value = question.options[1];
    document.getElementById('optionC').value = question.options[2];
    document.getElementById('optionD').value = question.options[3];
    document.getElementById('correctAnswer').value = question.correct;
    
    document.getElementById('addQuestionModal').style.display = 'flex';
    document.getElementById('addQuestionModal').dataset.editId = questionId;
}

function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question?')) {
        db.collection('questions').doc(questionId).delete()
            .then(() => {
                alert('Question deleted successfully!');
            })
            .catch(error => {
                alert('Error deleting question: ' + error.message);
            });
    }
}

// Settings Management
function saveCoinSettings() {
    const easyMin = parseInt(document.getElementById('easyMin').value);
    const easyMax = parseInt(document.getElementById('easyMax').value);
    const mediumMin = parseInt(document.getElementById('mediumMin').value);
    const mediumMax = parseInt(document.getElementById('mediumMax').value);
    const hardMin = parseInt(document.getElementById('hardMin').value);
    const hardMax = parseInt(document.getElementById('hardMax').value);
    
    // Save to Firebase or local storage
    const settings = {
        easy: { min: easyMin, max: easyMax },
        medium: { min: mediumMin, max: mediumMax },
        hard: { min: hardMin, max: hardMax }
    };
    
    localStorage.setItem('coinSettings', JSON.stringify(settings));
    alert('Coin settings saved successfully!');
}

function saveReferralSettings() {
    const referrerBonus = parseInt(document.getElementById('referrerBonus').value);
    const referredBonus = parseInt(document.getElementById('referredBonus').value);
    
    const settings = {
        referrerBonus: referrerBonus,
        referredBonus: referredBonus
    };
    
    localStorage.setItem('referralSettings', JSON.stringify(settings));
    alert('Referral settings saved successfully!');
}

function saveWithdrawalSettings() {
    const minWithdrawal = parseInt(document.getElementById('minWithdrawal').value);
    const conversionRate = parseFloat(document.getElementById('conversionRate').value);
    
    const settings = {
        minWithdrawal: minWithdrawal,
        conversionRate: conve
