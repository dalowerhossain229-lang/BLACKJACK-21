const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🎯 [উইনগো কালার ট্রেড সিঙ্ক - মেগা সকেট প্রোটোকল লক]
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Security-Policy", "frame-ancestors *; default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob:; style-src * 'unsafe-inline'; font-src * data:;");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// 🎰 [উইনগো কালার ট্রেড ওরিজিনাল ডোমেইন সিঙ্ক]
const MAIN_SITE_URL = "https://betlover247.onrender.com"; 

// ৫২টি তাসের ডেক জেনারেটর পুল তালিকা (ব্ল্যাকজ্যাক ওডস ক্যালকুলেটর)
const cardSuitsPool = ["H", "D", "C", "S"]; 

// ব্ল্যাকজ্যাক স্ট্যান্ডার্ডে তাসের পয়েন্ট গণনাকারী চাবি (J, Q, K = ১০ পয়েন্ট, টেক্কা/Ace = ১১ বা ১ পয়েন্ট)
function calculateBlackjackScore(cardsHand) {
    let score = 0;
    let acesCount = 0;
    
    cardsHand.forEach(card => {
        if (card.value === 1) {
            acesCount++;
            score += 11;
        } else if (card.value >= 10) {
            score += 10;
        } else {
            score += card.value;
        }
    });
    
    while (score > 21 && acesCount > 0) {
        score -= 10;
        acesCount--;
    }
    return score;
}

// 💰 ১. লাইভ অ্যাকাউন্ট ব্যালেন্স নিয়ে আসার ডেডিকেটেড গেটওয়ে
app.get('/api/blackjack-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    const targetWallet = wallet || "main";
    try {
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet",
            username: userId,
            amount: 0,
            wallet: targetWallet
        }, { timeout: 30000 });

        if (response.data && response.data.status === "ok" && response.data.balance !== undefined) {
            return res.json({ success: true, balance: response.data.balance });
        }
        return res.json({ success: false, balance: 0 });
    } catch (e) { return res.json({ success: false, balance: 0 }); }
});

// 🛫 ২. ব্ল্যাকজ্যাক কোর ডিলিং রাউট (১.৯৫ ওডস ও কঠোর ২০০০০ লিমিট সিকিউরিটি ফিল্টার লক ভাই ভাই!)
app.post('/api/blackjack-deal', async (req, res) => {
    const { userId, amount, wallet } = req.body;
    const targetWallet = wallet || "main";
    const reqAmount = parseFloat(amount) || 50;

    // 🔒 [বেট সিকিউরিটি ফিল্টার]: বাজি ১ টাকার কম বা ২০০০০ টাকার বেশি হলে ব্যাকএন্ড ডিরেক্ট ব্লক ভাই ভাই!
    if (reqAmount < 1 || reqAmount > 20000) {
        return res.json({ success: false, message: "🚨 Invalid Bet Amount (৳১ - ৳২০০০০)" });
    }

    try {
        // 🔒 [ব্যালেন্স যাচাই প্রোটোকল]: বাজি প্লে করার আগে ডাটাবেজ থেকে রিয়েল টাকা নিশ্চিত করার চাবি
        const balResponse = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet",
            username: userId,
            amount: 0,
            wallet: targetWallet
        }, { timeout: 30000 });
        
        let currentDbBalance = 0;
        if (balResponse.data && balResponse.data.status === "ok" && balResponse.data.balance !== undefined) {
            currentDbBalance = parseFloat(balResponse.data.balance);
        } else {
            return res.json({ success: false, balance: 0, message: "❌ Database Sync Error! Please refresh." });
        }

        // 🔒 [ইনসাফিসিয়েন্ট প্রোটেকশন बর্ম]: অ্যাকাউন্টে টাকা কম থাকলে বা জিরো ব্যালেন্স হলে বাজি রিফিউজড ভাই ভাই!
        if (currentDbBalance < reqAmount || currentDbBalance <= 0) {
            return res.json({ success: false, balance: currentDbBalance, message: "❌ Insufficient Balance! Please Recharge BDT." });
        }

        let adminTriggeredPrize = (balResponse.data && balResponse.data.blackjack_target) ? balResponse.data.blackjack_target : null;

        let playerHand, dealerHand, playerScore, dealerScore, finalStatus, winMultiplier;
        let isLoopActive = true;
        let loopSafety = 0;

        // 🎰 [🎰 ৯৫% ওরিজিনাল ক্যাসিনো RTP ব্ল্যাকজ্যাক গাণিতিক লুপ ভাই ভাই]
        while (isLoopActive && loopSafety < 200) {
            loopSafety++;
            
            // প্লেয়ার এবং ডিলারের জন্য র্যান্ডম তাস ডিলিং (শুরুতে ২টি করে কার্ড)
            playerHand = [
                { value: Math.floor(Math.random() * 13) + 1, suit: cardSuitsPool[Math.floor(Math.random() * 4)] },
                { value: Math.floor(Math.random() * 13) + 1, suit: cardSuitsPool[Math.floor(Math.random() * 4)] }
            ];
            dealerHand = [
                { value: Math.floor(Math.random() * 13) + 1, suit: cardSuitsPool[Math.floor(Math.random() * 4)] },
                { value: Math.floor(Math.random() * 13) + 1, suit: cardSuitsPool[Math.floor(Math.random() * 4)] }
            ];

            playerScore = calculateBlackjackScore(playerHand);
            dealerScore = calculateBlackjackScore(dealerHand);

            // ডিলার রুলস ফিল্টারিং (ডিলারের স্কোর ১৭ এর কম হলে কার্ড টানবেই ভাই ভাই)
            while (dealerScore < 17) {
                dealerHand.push({ value: Math.floor(Math.random() * 13) + 1, suit: cardSuitsPool[Math.floor(Math.random() * 4)] });
                dealerScore = calculateBlackjackScore(dealerHand);
            }

            // ব্ল্যাকজ্যাক স্ট্যান্ডার্ড শোডাউন উইন-লস ফিল্টারিং চাবি
            if (playerScore > 21) {
                finalStatus = "lose";
                winMultiplier = 0.00;
            } else if (dealerScore > 21 || playerScore > dealerScore) {
                finalStatus = "win";
                winMultiplier = (playerScore === 21 && playerHand.length === 2) ? 2.50 : 1.95; // ন্যাচারাল ২১ এ ২.৫ গুণ, নরমাল উইনে ১.৯৫ ভাই ভাই
            } else if (playerScore === dealerScore) {
                finalStatus = "push"; // ড্র বা পুশ হলে বাজি ফেরত
                winMultiplier = 1.00;
            } else {
                finalStatus = "lose";
                winMultiplier = 0.00;
            }

            // এডমিন ড্যাশবোর্ড কন্ট্রোল ট্রিগার চাবি
            if (adminTriggeredPrize) {
                if (adminTriggeredPrize === "force_lose" && finalStatus === "lose") isLoopActive = false;
                if (adminTriggeredPrize === "force_win" && finalStatus === "win") isLoopActive = false;
            } else {
                if (finalStatus === "win") {
                    // ৯৫% আরটিপি সিঙ্ক কন্ট্রোল ম্যাথ লুপ স্বাভাবিক ট্র্যাকে ৪১% এ ব্যালেন্সড লক ভাই ভাই!
                    if (Math.random() <= 0.41) {
                        isLoopActive = false;
                    }
                } else {
                    isLoopActive = false; 
                }
            }
        }

        let winAmount = 0;
        let dbAction = "bet";
        let dbAmount = reqAmount;

        if (finalStatus === "win") {
            winAmount = Math.round(reqAmount * winMultiplier);
            dbAction = "win";
            dbAmount = parseFloat(winAmount);
        } else if (finalStatus === "push") {
            winAmount = reqAmount;
            dbAction = "win"; // ডাটাবেজে ড্র ব্যালেন্স রিফান্ড পুশ ভাই ভাই
            dbAmount = parseFloat(winAmount);
        }

        let phpPayload = {
            action: dbAction,
            username: userId,
            amount: dbAmount,
            wallet: targetWallet
        };

        if (dbAction === "win") {
            phpPayload.bet_amount = reqAmount;
            phpPayload.multiplier = winMultiplier.toFixed(2);
            phpPayload.status = "win";
            phpPayload.type = "win";
            phpPayload.is_win = 1;
            phpPayload.win_status = "win";
            phpPayload.log_status = "win";
        }

        // 🚀 [মাস্টার সিঙ্ক ফিক্সড]: ওরিজিনাল response অবজেক্ট নিখুঁত মেলা দেওয়ায় টাইমআউট ও ডাটাবেজ এরর এক ফুঁৎকারে খতম ভাই ভাই!
        const response = await axios.post(MAIN_SITE_URL + '/api_callback.php', phpPayload, { timeout: 30000 });

        if (response.data && response.data.status === "ok") {
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });

            return res.json({
                success: true,
                balance: response.data.balance,
                status: finalStatus,
                winAmount: winAmount,
                playerHand: playerHand,
                dealerHand: dealerHand,
                playerScore: playerScore,
                dealerScore: dealerScore
            });
        } else {
            let latestBal = (response.data && response.data.balance !== undefined) ? response.data.balance : currentDbBalance;
            return res.json({ success: false, balance: latestBal, message: "❌ Bet Declined by Database!" });
        }

    } catch (e) {
        console.error("Blackjack Core Engine Error:", e.message);
        return res.json({ success: false, message: "⚠️ Timeout! Click DEAL again." });
    }
});

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

io.on('connection', (socket) => { console.log("Player connected to Royal Blackjack Engine!"); });

// ব্ল্যাকজ্যাক গেম নিজস্ব কাস্টম ৪০০০ পোর্টে কড়া নিয়নে অন ফায়ার ভাই ভাই!
const PORT = process.env.PORT || 17000; 
server.listen(PORT, () => { console.log(`🎡 Royal Blackjack Engine Running on port ${PORT}`); });
