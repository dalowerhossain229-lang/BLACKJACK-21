const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🎯 [উইনগো কালার ট্রেড সিঙ্ক - গেটওয়ে সকেট প্রোটোকল লক ভাই ভাই]
const io = socketIo(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

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

// 🎰 [উইনগো কালার ট্রেড ওরিজিনাল ডোমেইন সিঙ্ক ভাই ভাই]
const MAIN_SITE_URL = "https://betlover247.onrender.com"; 
const cardSuitsPool = ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"];

// 💰 ১. লাইভ অ্যাকাউন্ট ব্যালেন্স ইন্টারсеপ্টর গেটওয়ে (অন্দর বাহার ও ব্যাকারাত স্ক্রিনশটের হুবহু ওরিじんাল ৩৪ নম্বর লাইন সিঙ্ক ওস্তাদ!)
app.get('/api/blackjack-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    const targetWallet = wallet || "main";
    try {
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "balance", // 🔒 বাজি ট্র্যাপ ও টাইমআউট এড়াতে সরাসরি পিওর ব্যালেন্স কি-নেম পাস লক ভাই ভাই
            username: userId,
            amount: 0,
            wallet: targetWallet,
            game: "blackjack21"
        }, { timeout: 15000 });

        if (response.data && (response.data.status === "ok" || response.data.success === true)) {
            return res.json({ success: true, balance: response.data.balance });
        }
        return res.json({ success: false, balance: 0 });
    } catch (e) { 
        console.log("Blackjack Balance Stream Reconnected.");
        return res.json({ success: false, balance: 0 }); 
    }
});

// ইউজারের অ্যাক্টিভ রানিং গেম সেশন ট্র্যাকার মেমোরি নোড ভাই ভাই
let activeBlackjackSessions = {};

// 🛫 ২. ব্ল্যাকজ্যাক ২১ কোর ট্রানজেকশন ডিল রাউট (POST Route - অন্দর বাহার স্ক্রিনশটের হুবহু ওরিজিনাল ৫৪ নম্বর লাইন সিঙ্ক ভাই ভাই!)
app.post('/api/blackjack-deal', async (req, res) => {
    const { userId, amount, wallet } = req.body;
    const reqAmount = parseFloat(amount) || 50;
    const finalGameName = "blackjack21"; // 🎯 লবির কি-শর্টকোড টাইট লক
    const targetWallet = wallet || "main";

    if (reqAmount < 1 || reqAmount > 20000) {
        return res.json({ success: false, message: "🚨 Invalid Bet Parameter (৳১ - ৳Subcontinent)" });
    }

    try {
        // 🔒 [ব্যালেন্স ডেবিট প্রোটোকল]: অন্দর বাহার স্ক্রিনশটের হুবহু ওরিজিনাল ৬৮ নম্বর লাইনের মতো ১ম হিটে এক টানে বাজি কাটা ও ব্যালেন্স যাচাই সিঙ্ক!
        const balResponse = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet",
            username: userId,
            amount: reqAmount, // কাটায় কাটায় বাজি ধরার টাকা মেইন সাইটে ফায়ার হলো
            wallet: targetWallet,
            game: finalGameName
        }, { timeout: 30000 });
        
        if (!balResponse.data || balResponse.data.status !== "ok") {
            // অ্যাকাউন্টে টাকা কম থাকলে মেইন সাইটের ডাটাবেজই ডাইরেক্ট সাকসেসফুলি ইনসাফিসিয়েন্ট ব্যালেন্স নোটিশ থ্রো করবে ওস্তাদ!
            return res.json({ success: false, message: balResponse.data.message || "❌ Insufficient Balance! Please Recharge Your Wallet." });
        }

        let currentDbBalance = parseFloat(balResponse.data.balance);
        let ranks = {1:"A", 11:"J", 12:"Q", 13:"K"};
        
        let playerCards = [];
        let dealerCards = [];
        let playerScore = 0, dealerScore = 0;
        let isLoopActive = true;
        let loopSafety = 0;

        const getBJScore = (cards) => {
            let total = 0, aces = 0;
            cards.forEach(c => {
                if (["J","Q","K"].includes(c.value)) total += 10;
                else if (c.value === "A") { total += 11; aces++; }
                else total += parseInt(c.value);
            });
            while (total > 21 && aces > 0) { total -= 10; aces--; }
            return total;
        };

        // 🎰 [🎰 ৯৫% ক্যাসিনো RTP এবং প্রথম ২ কার্ড জেনারেটর লুপ ভাই ভাই]
        while (isLoopActive && loopSafety < 150) {
            loopSafety++;
            playerCards = [];
            dealerCards = [];

            for(let i=0; i<2; i++) {
                let pVal = Math.floor(Math.random() * 13) + 1;
                let dVal = Math.floor(Math.random() * 13) + 1;
                playerCards.push({ value: ranks[pVal] || pVal.toString(), suit: cardSuitsPool[Math.floor(Math.random()*4)] });
                dealerCards.push({ value: ranks[dVal] || dVal.toString(), suit: cardSuitsPool[Math.floor(Math.random()*4)] });
            }

            playerScore = getBJScore(playerCards);
            dealerScore = getBJScore(dealerCards);

            // ৯৫% আরটিপি স্বাভাবিক ট্র্যাকে ৪৫% এ ব্যালেন্সড রাখতে প্রথম ২ কার্ডের কন্ডিশন ফিল্টারিং চ্যাম (ঘন ঘন প্লেয়ার উইন মোড লক)
            if (playerScore >= 18 && playerScore <= 21) {
                if (Math.random() <= 0.45) isLoopActive = false; 
            } else {
                if (Math.random() <= 0.55) isLoopActive = false;
            }
        }

        // মেমরিতে সেশন টোকেন লক ভাই ভাই যাতে HIT/STAND ওয়ান-শটে কাজ করতে পারে
        activeBlackjackSessions[userId] = {
            playerCards: playerCards,
            dealerCards: dealerCards,
            reqAmount: reqAmount,
            wallet: targetWallet,
            currentDbBalance: currentDbBalance
        };

        // প্রথম ২ কার্ডেই যদি ন্যাচারাল ২১ বা ব্ল্যাকজ্যাক এসে যায় তবে সরাসরি সেটেলমেন্ট হবে
        if (playerScore === 21) {
            return await settleFinalBlackjackRound(userId, "win", 2.5, "Blackjack! ♠️", res);
        }

        // 📈 অন্যথায় গেম স্টেট "playing" (রানিং) স্ট্যাটাসে ফ্রন্টএন্ডে যাবে, যাতে HIT/STAND বোতাম দুটি সচল অন হয়!
        return res.json({
            success: true,
            balance: currentDbBalance,
            status: "playing",
            data: { balance: currentDbBalance }, // 🎯 অন্দর বাহারের ওরিজিনাল ডাটা রিটার্ন ফ্রেম সিঙ্ক লক
            gameData: {
                playerCards: playerCards,
                dealerCards: [dealerCards, { value: "HIDDEN", suit: "UNKNOWN" }], // 🖼️ হাইড কার্ড এরর ফিক্সড ফিল্টার চ্যাম
                playerScore: playerScore,
                dealerScore: getBJScore([dealerCards]),
                status: "playing",
                winAmount: 0,
                result: "Playing"
            }
        });

    } catch (e) { return res.json({ success: false, message: "⚠️ Timeout! Click DEAL again." }); }
});

// 🃏 ৩. প্লেয়ারের HIT (অতিরিক্ত কার্ড টানা) একশন রাউট গেটওয়ে ভাই ভাই
app.post('/api/blackjack-hit', async (req, res) => {
    const { userId } = req.body;
    let session = activeBlackjackSessions[userId];
    if (!session) return res.json({ success: false, message: "No active game session found!" });

    let ranks = {1:"A", 11:"J", 12:"Q", 13:"K"};
    let nextVal = Math.floor(Math.random() * 13) + 1;
    session.playerCards.push({ value: ranks[nextVal] || nextVal.toString(), suit: cardSuitsPool[Math.floor(Math.random()*4)] });

    const getBJScore = (cards) => {
        let total = 0, aces = 0;
        cards.forEach(c => {
            if (["J","Q","K"].includes(c.value)) total += 10;
            else if (c.value === "A") { total += 11; aces++; }
            else total += parseInt(c.value);
        });
        while (total > 21 && aces > 0) { total -= 10; aces--; }
        return total;
    };

    let playerScore = getBJScore(session.playerCards);
    
    if (playerScore > 21) {
        return await settleFinalBlackjackRound(userId, "lose", 0.00, "Player Bust 💥", res);
    }

    return res.json({
        success: true,
        balance: session.currentDbBalance,
        status: "playing",
        data: { balance: session.currentDbBalance },
        gameData: {
            playerCards: session.playerCards,
            dealerCards: [session.dealerCards],
            playerScore: playerScore,
            dealerScore: getBJScore([session.dealerCards]),
            status: "playing",
            winAmount: 0,
            result: "Hit Card Drawn"
        }
    });
});

// 🃏 ৪. প্লেয়ারের STAND (চাল লক করা) একশন রাউট গেটওয়ে ভাই ভাই
app.post('/api/blackjack-stand', async (req, res) => {
    const { userId } = req.body;
    let session = activeBlackjackSessions[userId];
    if (!session) return res.json({ success: false, message: "No active game session found!" });

    let ranks = {1:"A", 11:"J", 12:"Q", 13:"K"};
    
    const getBJScore = (cards) => {
        let total = 0, aces = 0;
        cards.forEach(c => {
            if (["J","Q","K"].includes(c.value)) total += 10;
            else if (c.value === "A") { total += 11; aces++; }
            else total += parseInt(c.value);
        });
        while (total > 21 && aces > 0) { total -= 10; aces--; }
        return total;
    };

    let playerScore = getBJScore(session.playerCards);
    let dealerScore = getBJScore(session.dealerCards);

        while (dealerScore < 17) {
        let dVal3 = Math.floor(Math.random() * 13) + 1;
        session.dealerCards.push({ value: ranks[dVal3] || dVal3.toString(), suit: cardSuitsPool[Math.floor(Math.random()*4)] });
        dealerScore = getBJScore(session.dealerCards);
    }

    if (dealerScore > 21 || playerScore > dealerScore) {
        return await settleFinalBlackjackRound(userId, "win", 2.0, dealerScore > 21 ? "Dealer Bust! 🎉" : "Player Wins 🎉", res);
    } else if (playerScore === dealerScore) {
        return await settleFinalBlackjackRound(userId, "push", 1.0, "Push (Draw) ⧗", res);
    } else {
        return await settleFinalBlackjackRound(userId, "lose", 0.00, "Dealer Wins 💥", res);
    }
});

// 🎯 ৫. অন্দর বাহার স্ক্রিনশটের হুবহু ওরিজিনাল ১৫১ এবং ১৮৫ নম্বর লাইন সিঙ্ক করা মাস্টার সেটেলমেন্ট গেটওয়ে (১০০% ডাবল-ডেবিট প্রুফ)
async function settleFinalBlackjackRound(userId, status, winMultiplier, reasonStr, res) {
    let session = activeBlackjackSessions[userId];
    if (!session) return res.json({ success: false, message: "X Active transaction session expired!" });
    
    const getBJScore = (cards) => {
        let total = 0, aces = 0;
        cards.forEach(c => {
            if (["J","Q","K"].includes(c.value)) total += 10;
            else if (c.value === "A") { total += 11; aces++; }
            else total += parseInt(c.value);
        });
        while (total > 21 && aces > 0) { total -= 10; aces--; }
        return total;
    };

    let winAmount = 0;
    let dbAction = "win"; 
    let dbAmount = 0;

    if (status === "win") {
        winAmount = Math.round(session.reqAmount * winMultiplier);
        dbAction = "win"; dbAmount = winAmount;
    } else if (status === "push") {
        winAmount = session.reqAmount;
        dbAction = "win"; dbAmount = winAmount;
    } else {
        dbAction = "win"; dbAmount = 0; // 🔒 বাজি লস হলে ডাটাবেজে ২য় বার কোনো টাকা কাটার কমান্ড যাবে না!
    }

    let phpPayload = {
        action: dbAction, username: userId, amount: dbAmount, wallet: session.wallet, game: "blackjack21"
    };

    if (status === "lose") phpPayload.status = "lose";
    else phpPayload.status = "win";

    phpPayload.bet_amount = session.reqAmount;

    try {
        // 🛫 অন্দর বাহার স্ক্রিনশটের হুবহু একই ওরিজিনাল ১৮৫ নম্বর লাইনের মতো কড়া ৪৫ সেকেন্ডে এপিআই হিট
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, phpPayload, { timeout: 45000 });
        
        if (response.data && response.data.status === "ok") {
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            
            // 🎯 অন্দর বাহার স্ক্রিনশটের হুবহু ওরিজিনাল ১৯০ নম্বর লাইনের মতো মেগা সাকসেস ডাটা রিটার্ন অবজেক্ট লক
            return res.json({
                success: true,
                balance: response.data.balance,
                data: { balance: response.data.balance }, 
                status: status,
                winAmount: winAmount,
                result: reasonStr,
                gameData: {
                    playerCards: session.playerCards,
                    dealerCards: session.dealerCards,
                    playerScore: getBJScore(session.playerCards),
                    dealerScore: getBJScore(session.dealerCards),
                    status: status,
                    winAmount: winAmount,
                    result: reasonStr
                }
            });
        } else {
            return res.json({ success: false, balance: session.currentDbBalance, message: "X Bet Settlement Declined by Database!" });
        }
    } catch (err) {
        return res.json({ success: false, message: "⚠️ Timeout! Processing fault on server transaction bridge." });
    }
}

app.get('/', (req, res) => { res.sendFile(path.resolve(__dirname, 'index.html')); });
io.on('connection', (socket) => {});

const PORT = process.env.PORT || 17000;
server.listen(PORT, () => { console.log(`🎡 Blackjack 21 Engine Running on port ${PORT}`); });

