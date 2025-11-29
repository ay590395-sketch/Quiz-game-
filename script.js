// Global Variables
let currentScreen = 'homeScreen';
let currentQuiz = null;
let currentQuestionIndex = 0;
let correctAnswers = 0;
let timer = null;
let timeLeft = 30;
let skipCount = 3;
let quizCoins = 0;

// Sample Questions (Temporary)
const sampleQuestions = {
    general: {
        easy: [
            {
                question: "What is the capital of India?",
                options: ["Mumbai", "Delhi", "Kolkata", "Chennai"],
                correct: 1
            },
            {
                question: "Which planet is known as the Red Planet?",
                options: ["Venus", "Mars", "Jupiter", "Saturn"],
                correct: 1
            }
        ]
    }
};
// Login Functions
function showLoginScreen() {
    showScreen('loginScreen');
}

function showPhoneLogin() {
    showScreen('phoneLoginScreen');
}

function guestLogin() {
    // Anonymous login - current system
    alert('Welcome! Starting as guest...');
    showScreen('homeScreen');
}

function googleLogin() {
    alert('Google login coming soon! Using guest mode for now.');
    showScreen('homeScreen');
}

function verifyPhoneLogin() {
    const phone = document.getElementById('phoneNumber').value;
    const otp = document.getElementById('phoneOTP').value;
    
    if(phone && otp) {
        alert('Phone login successful!');
        showScreen('homeScreen');
    } else {
        alert('Please enter phone number and OTP');
    }
}

// Update initialization
// showScreen('homeScreen'); - REMOVE THIS LINE
showScreen('loginScreen'); // ADD THIS LINE
// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

function showHomeScreen() {
    showScreen('homeScreen');
}

function showWithdrawScreen() {
    showScreen('withdrawScreen');
}

function showReferralScreen() {
    showScreen('referralScreen');
}

// Update UI with User Data
function updateUI() {
    // Update balances
    document.getElementById('coinBalance').textContent = "100";
    document.getElementById('userBalance').textContent = '100 Coins';
    document.getElementById('userName').textContent = 'Player';
    
    // Update referral screen
    if (document.getElementById('referralCode')) {
        document.getElementById('referralCode').textContent = "REF123";
        document.getElementById('referralLink').textContent = "https://yourapp.com/ref=REF123";
    }
}

// Quiz Functions
function startQuiz(category, difficulty) {
    const coinRanges = {
        easy: { min: 10, max: 20 },
        medium: { min: 30, max: 50 },
        hard: { min: 60, max: 100 }
    };
    
    const range = coinRanges[difficulty];
    quizCoins = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    
    currentQuiz = {
        category: category,
        difficulty: difficulty,
        questions: sampleQuestions[category][difficulty],
        currentQuestionIndex: 0
    };
    
    currentQuestionIndex = 0;
    correctAnswers = 0;
    skipCount = 3;
    
    showScreen('quizScreen');
    loadQuestion();
}

function loadQuestion() {
    if (!currentQuiz || currentQuestionIndex >= currentQuiz.questions.length) {
        endQuiz();
        return;
    }
    
    const question = currentQuiz.questions[currentQuestionIndex];
    
    document.getElementById('currentQ').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQ').textContent = currentQuiz.questions.length;
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('questionCoins').textContent = quizCoins;
    
    for (let i = 0; i < 4; i++) {
        document.getElementById(`option${i}`).textContent = question.options[i];
        document.getElementById(`option${i}`).parentElement.classList.remove('selected');
    }
    
    resetTimer();
    document.getElementById('skipBtn').textContent = `Skip (${skipCount} left)`;
    document.getElementById('skipBtn').disabled = skipCount === 0;
    document.getElementById('nextBtn').disabled = true;
}

function resetTimer() {
    clearInterval(timer);
    timeLeft = 30;
    document.getElementById('timer').textContent = timeLeft;
    
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            nextQuestion();
        }
    }, 1000);
}

function selectOption(optionIndex) {
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelectorAll('.option')[optionIndex].classList.add('selected');
    document.getElementById('nextBtn').disabled = false;
}

function skipQuestion() {
    if (skipCount > 0) {
        skipCount--;
        nextQuestion();
    }
}

function nextQuestion() {
    clearInterval(timer);
    
    const selectedOption = document.querySelector('.option.selected');
    if (selectedOption) {
        const selectedIndex = Array.from(document.querySelectorAll('.option')).indexOf(selectedOption);
        const question = currentQuiz.questions[currentQuestionIndex];
        
        if (selectedIndex === question.correct) {
            correctAnswers++;
        }
    }
    
    currentQuestionIndex++;
    
    if (currentQuestionIndex < currentQuiz.questions.length) {
        loadQuestion();
    } else {
        endQuiz();
    }
}

function endQuiz() {
    clearInterval(timer);
    
    const totalCoins = correctAnswers * quizCoins;
    
    document.getElementById('correctAnswers').textContent = correctAnswers;
    document.getElementById('coinsEarned').textContent = totalCoins;
    document.getElementById('totalBalance').textContent = (100 + totalCoins);
    
    showScreen('resultScreen');
}

// Daily Bonus
function claimDailyBonus() {
    alert('Daily bonus claimed! 10 coins added.');
}

// Withdrawal Functions
function updateWithdrawAmount() {
    const coins = parseInt(document.getElementById('withdrawCoins').value) || 0;
    const amount = coins / 100;
    document.getElementById('withdrawAmount').textContent = amount;
}

function submitWithdrawal() {
    const coins = parseInt(document.getElementById('withdrawCoins').value) || 0;
    const upiId = document.getElementById('upiId').value;
    
    if (coins < 5000) {
        alert('Minimum withdrawal is 5000 coins (₹50)');
        return;
    }
    
    if (!upiId) {
        alert('Please enter UPI ID');
        return;
    }
    
    alert('Withdrawal request submitted!');
    showHomeScreen();
}

// Referral Functions
function copyReferralCode() {
    navigator.clipboard.writeText("REF123").then(() => {
        alert('Referral code copied!');
    });
}

function copyReferralLink() {
    navigator.clipboard.writeText("https://yourapp.com/ref=REF123").then(() => {
        alert('Referral link copied!');
    });
}

// Share Result
function shareResult() {
    const shareText = `I just earned coins on QuizEarn!`;
    navigator.clipboard.writeText(shareText).then(() => {
        alert('Result copied to clipboard!');
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const withdrawCoinsInput = document.getElementById('withdrawCoins');
    if (withdrawCoinsInput) {
        withdrawCoinsInput.addEventListener('input', updateWithdrawAmount);
    }
    
    updateUI();
});

// Initialize
showScreen('homeScreen');
