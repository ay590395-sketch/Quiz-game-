// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqRE5oaZWVSE8lul6ghMoM_SSKYdjzYeM",
  authDomain: "quiz-game-88b93.firebaseapp.com",
  databaseURL: "https://quiz-game-88b93-default-rtdb.firebaseio.com",
  projectId: "quiz-game-88b93",
  storageBucket: "quiz-game-88b93.firebasestorage.app",
  messagingSenderId: "562920331108",
  appId: "1:562920331108:web:4da226b73a20de10d38c71"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Current User Data
let currentUser = null;
let userData = null;

// Initialize App
function initApp() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadUserData();
        } else {
            createAnonymousUser();
        }
    });
}

// Create Anonymous User
function createAnonymousUser() {
    auth.signInAnonymously()
        .then((userCredential) => {
            currentUser = userCredential.user;
            initializeUserData();
        })
        .catch((error) => {
            console.error("Authentication error:", error);
        });
}

// Initialize User Data
function initializeUserData() {
    const userRef = db.collection('users').doc(currentUser.uid);
    
    userRef.get().then((doc) => {
        if (!doc.exists) {
            // Create new user
            const userData = {
                uid: currentUser.uid,
                coins: 100, // Starting bonus
                totalEarned: 0,
                totalWithdrawn: 0,
                referralCode: generateReferralCode(),
                referredBy: null,
                referrals: [],
                totalReferrals: 0,
                referralEarnings: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                dailyBonusClaimed: false,
                lastBonusDate: null,
                quizzesPlayed: 0,
                correctAnswers: 0,
                level: 1,
                experience: 0
            };
            
            userRef.set(userData).then(() => {
                loadUserData();
            });
        } else {
            loadUserData();
        }
    });
}

// Load User Data
function loadUserData() {
    const userRef = db.collection('users').doc(currentUser.uid);
    
    userRef.onSnapshot((doc) => {
        if (doc.exists) {
            userData = doc.data();
            updateUI();
        }
    });
}

// Generate Referral Code
function generateReferralCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Update Coins
function updateCoins(amount, reason) {
    if (!userData) return;
    
    const newCoins = userData.coins + amount;
    const userRef = db.collection('users').doc(currentUser.uid);
    
    userRef.update({
        coins: newCoins,
        totalEarned: firebase.firestore.FieldValue.increment(amount)
    });
    
    // Add transaction history
    db.collection('transactions').add({
        userId: currentUser.uid,
        amount: amount,
        type: 'credit',
        reason: reason,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Withdraw Coins
function withdrawCoins(amount, upiId, paymentMethod) {
    if (!userData || userData.coins < amount) {
        alert('Insufficient coins!');
        return false;
    }
    
    const userRef = db.collection('users').doc(currentUser.uid);
    
    // Create withdrawal request
    db.collection('withdrawals').add({
        userId: currentUser.uid,
        coins: amount,
        amountInRupees: amount / 100,
        upiId: upiId,
        paymentMethod: paymentMethod,
        status: 'pending',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Deduct coins from user
    userRef.update({
        coins: firebase.firestore.FieldValue.increment(-amount),
        totalWithdrawn: firebase.firestore.FieldValue.increment(amount)
    });
    
    return true;
}

// Get Quiz Questions
async function getQuizQuestions(category, difficulty) {
    // Temporary questions - Baad mein Firebase se aayenge
    const tempQuestions = {
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
    
    return tempQuestions[category][difficulty];
}

// Save Quiz Result
function saveQuizResult(quizData) {
    const quizRef = db.collection('quizResults').add({
        userId: currentUser.uid,
        category: quizData.category,
        difficulty: quizData.difficulty,
        correctAnswers: quizData.correctAnswers,
        totalQuestions: quizData.totalQuestions,
        coinsEarned: quizData.coinsEarned,
        timeTaken: quizData.timeTaken,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Update user stats
    const userRef = db.collection('users').doc(currentUser.uid);
    userRef.update({
        quizzesPlayed: firebase.firestore.FieldValue.increment(1),
        correctAnswers: firebase.firestore.FieldValue.increment(quizData.correctAnswers),
        coins: firebase.firestore.FieldValue.increment(quizData.coinsEarned),
        totalEarned: firebase.firestore.FieldValue.increment(quizData.coinsEarned)
    });
}

// Check Referral Code
async function checkReferralCode(code) {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('referralCode', '==', code).get();
    
    if (!snapshot.empty) {
        return snapshot.docs[0].data();
    }
    return null;
}

// Apply Referral
function applyReferral(referralCode) {
    const userRef = db.collection('users').doc(currentUser.uid);
    
    // Update current user
    userRef.update({
        referredBy: referralCode
    });
    
    // Find referrer and give bonus
    db.collection('users').where('referralCode', '==', referralCode).get()
        .then((snapshot) => {
            if (!snapshot.empty) {
                const referrerDoc = snapshot.docs[0];
                const referrerData = referrerDoc.data();
                
                // Update referrer's data
                db.collection('users').doc(referrerDoc.id).update({
                    referrals: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
                    totalReferrals: firebase.firestore.FieldValue.increment(1),
                    referralEarnings: firebase.firestore.FieldValue.increment(4000),
                    coins: firebase.firestore.FieldValue.increment(4000)
                });
                
                // Give bonus to new user
                userRef.update({
                    coins: firebase.firestore.FieldValue.increment(2000)
                });
            }
        });
}

// Get Withdrawal History
function getWithdrawalHistory(callback) {
    const withdrawalsRef = db.collection('withdrawals')
        .where('userId', '==', currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(10);
    
    withdrawalsRef.onSnapshot((snapshot) => {
        const withdrawals = [];
        snapshot.forEach(doc => {
            withdrawals.push(doc.data());
        });
        callback(withdrawals);
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initApp);
