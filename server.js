const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);

// 🎯 [উইনগো কালার ট্রেড সিঙ্ক - গেটওয়ে সকেট প্রোটোকল লক ভাই ভাই]
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

// 🎰 [উইনগো কালার ট্রেড ওরিজিনাল ডোমেইন সিঙ্ক ভাই ভাই]
const MAIN_SITE_URL = "https://betlover247.onrender.com"; 
const cardSuitsPool = ["HEARTS", "DIAMONDS", "CLUBS", "SPADES"];

// একটিভ গেম সেশন ট্র্যাকার মেমোরি নোড
let activeBlackjackSessions = {};

// 💰 ১. লাইভ অ্যাকাউন্ট ব্যালেন্স ইন্টারсеপ্টর গেটওয়ে
app.get('/api/blackjack-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    const targetWallet = wallet || "main";
    try {
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet", username: userId, amount: 0, wallet: targetWallet, game: "blackjack21"
        }, { timeout: 30000 });

        if (response.data && response.data.status === "ok" && response.data.balance !== undefined) {
            return res.json({ success: true, balance: response.data.balance });
        }
        return res.json({ success: false, balance: 0 });
    } catch (e) { return res.json({ success: false, balance: 0 }); }
});

// 🛫 ২. ব্ল্যাকজ্যাক ২১ কোর ট্রানজেকশন ডিল রাউট (ইনিশিয়াল রাউন্ড কার্ড ফ্লিপ লক ভাই ভাই!)
app.post('/api/blackjack-deal', async (req, res) => {
    const { userId, amount, wallet, game } = req.body;
    const reqAmount = parseFloat(amount) || 50;
    const finalGameName = "blackjack21"; // 🎯 লবির কি-শর্টকোড টাইট লক

    if (reqAmount < 1 || reqAmount > 20000) {
        return res.json({ success: false, message: "🚨 Invalid Bet Parameter (৳১ - ৳Subcontinent)" });
    }

    try {
        // 🔒 [ব্যালেন্স যাচাই প্রোটোকল]: বাজি প্লে করার সাথে সাথে ডাটাবেজ থেকে BDT টাকা কেটে নেওয়ার বর্ম লক
        const balResponse = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet", username: userId, amount: reqAmount, wallet: wallet || "main", game: finalGameName
        }, { timeout: 30000 });
        
        if (!balResponse.data || balResponse.data.status !== "ok") {
            return res.json({ success: false, message: "X Database Sync Error or Insufficient Balance!" });
        }

        let currentDbBalance = parseFloat(balResponse.data.balance);
        let ranks = { 1: "A", 11: "J", 12: "Q", 13: "K" };

        let playerCards = [];
        let dealerCards = [];

        // প্লেয়ার এবং ডিলারের জন্য শুরুর ২টি করে কার্ড র্যান্ডমাইজেশন লুপ
        for (let i = 0; i < 2; i++) {
            let pVal = Math.floor(Math.random() * 13) + 1;
            let dVal = Math.floor(Math.random() * 13) + 1;
            playerCards.push({ value: ranks[pVal] || pVal.toString(), suit: cardSuitsPool[Math.floor(Math.random() * 4)] });
            dealerCards.push({ value: ranks[dVal] || dVal.toString(), suit: cardSuitsPool[Math.floor(Math.random() * 4)] });
        }

        // ব্ল্যাকজ্যাক স্কোর গণনাকারী সুপ্রিম অ্যালগরিদম ভাই ভাই
        const calcBlackjackScore = (cardsList) => {
            let score = 0;
            let acesCount = 0;
            cardsList.forEach(c => {
                if (["J", "Q", "K"].includes(c.value)) score += 10;
                else if (c.value === "A") { score += 11; acesCount++; }
                else score += parseInt(c.value);
            });
            while (score > 21 && acesCount > 0) {
                score -= 10;
                acesCount--;
            }
            return score;
        };

        let pScore = calcBlackjackScore(playerCards);
        let dScore = calcBlackjackScore(dealerCards);

        // সেডুলিং ট্র্যাকার মেমরিতে সেশন সেভ লক
        activeBlackjackSessions[userId] = {
            reqAmount, wallet: wallet || "main", playerCards, dealerCards, finalGameName, currentDbBalance
        };

        // যদি শুরুতেই ন্যাচারাল ২১ মিলে যায় তবে ওয়ান-শটে সেটেলমেন্ট গেটওয়ে চালু হবে
        if (pScore === 21) {
            return await processBlackjackSettlement(userId, res, "PLAYER_NATURAL");
        }

        return res.json({
            success: true, balance: currentDbBalance,
            gameData: { playerCards, dealerCards: [dealerCards[0], { value: "HIDDEN", suit: "HIDDEN" }], playerScore: pScore, dealerScore: "?", isGameOver: false }
        });

    } catch (e) { return res.json({ success: false, message: "⚠️ Timeout! Click DEAL again." }); }
});

// 🃏 ৩. হিট (HIT) অ্যাকশন গেটওয়ে রাউট - প্লেয়ার অতিরিক্ত কার্ড টানার চাবি
app.post('/api/blackjack-hit', async (req, res) => {
    const { userId } = req.body;
    let session = activeBlackjackSessions[userId];
    if (!session) return res.json({ success: false, message: "🚨 No Active Session Found!" });

    let ranks = { 1: "A", 11: "J", 12: "Q", 13: "K" };
    let pVal = Math.floor(Math.random() * 13) + 1;
    session.playerCards.push({ value: ranks[pVal] || pVal.toString(), suit: cardSuitsPool[Math.floor(Math.random() * 4)] });

    const calcBlackjackScore = (cardsList) => {
        let score = 0; let acesCount = 0;
        cardsList.forEach(c => {
            if (["J", "Q", "K"].includes(c.value)) score += 10;
            else if (c.value === "A") { score += 11; acesCount++; }
            else score += parseInt(c.value);
        });
        while (score > 21 && acesCount > 0) { score -= 10; acesCount--; }
        return score;
    };

    let pScore = calcBlackjackScore(session.playerCards);
    if (pScore > 21) {
        return await processBlackjackSettlement(userId, res, "PLAYER_BUST");
    }

    return res.json({
        success: true, balance: session.currentDbBalance,
        gameData: { playerCards: session.playerCards, dealerCards: [session.dealerCards[0], { value: "HIDDEN", suit: "HIDDEN" }], playerScore: pScore, dealerScore: "?", isGameOver: false }
    });
});

// 🛑 ৪. স্ট্যান্ড (STAND) অ্যাকশন গেটওয়ে রাউট - প্লেয়ার কার্ড লক করে ডিলারকে চাল দেওয়ার চাবি
app.post('/api/blackjack-stand', async (req, res) => {
    const { userId } = req.body;
    return await processBlackjackSettlement(userId, res, "STAND");
});

async function processBlackjackSettlement(userId, res, triggerType) {
    let session = activeBlackjackSessions[userId];
    if (!session) return res.json({ success: false, message: "🚨 Error Processing Settlement!" });

    const calcBlackjackScore = (cardsList) => {
        let score = 0; let acesCount = 0;
        cardsList.forEach(c => {
            if (["J", "Q", "K"].includes(c.value)) score += 10;
            else if (c.value === "A") { score += 11; acesCount++; }
            else score += parseInt(c.value);
        });
        while (score > 21 && acesCount > 0) { score -= 10; acesCount--; }
        return score;
    };

    let pScore = calcBlackjackScore(session.playerCards);
    let dScore = calcBlackjackScore(session.dealerCards);

    // 🤖 [ইন্টারন্যাশনাল ডিলার সফট ১৭ লুপ বর্ম]: ডিলার স্কোর ১৭ এর নিচে থাকলে বা সফট ১৭ হলে বাধ্যতামূলক কার্ড টানবে ভাই ভাই
    if (triggerType === "STAND" && pScore <= 21) {
        let ranks = { 1: "A", 11: "J", 12: "Q", 13: "K" };
        while (dScore < 17) {
            let dVal = Math.floor(Math.random() * 13) + 1;
            session.dealerCards.push({ value: ranks[dVal] || dVal.toString(), suit: cardSuitsPool[Math.floor(Math.random() * 4)] });
            dScore = calcBlackjackScore(session.dealerCards);
        }
    }

    let finalResultStatus = "lose"; // win, lose, push
    let winMultiplier = 0.00;
    let reasonString = "Dealer Wins";

    if (pScore > 21) {
        finalResultStatus = "lose"; winMultiplier = 0.0; reasonString = "Player Bust (Over 21)";
    } else if (triggerType === "PLAYER_NATURAL") {
        finalResultStatus = "win"; winMultiplier = 2.5; reasonString = "Blackjack 21 Natural!";
    } else if (dScore > 21) {
        finalResultStatus = "win"; winMultiplier = 2.0; reasonString = "Dealer Busts! Player Wins";
    } else if (pScore > dScore) {
        finalResultStatus = "win"; winMultiplier = 2.0; reasonString = "Player Higher Score Wins";
    } else if (dScore > pScore) {
        finalResultStatus = "lose"; winMultiplier = 0.0; reasonString = "Dealer Higher Score Wins";
    } else {
        finalResultStatus = "push"; winMultiplier = 1.0; reasonString = "Push (Tie Hand Match)";
    }

    // 🎰 [🎰 ৯৫% ক্যাসিনো RTP সিঙ্ক মডিউল ইন্টারসেপ্টর লক ভাই ভাই]
    if (finalResultStatus === "win" && triggerType === "STAND") {
        if (Math.random() > 0.43) {
            let ranks = { 1: "A", 11: "J", 12: "Q", 13: "K" };
            let dVal = Math.floor(Math.random() * 3) + 7; // 7, 8, 9, 10
            session.dealerCards.push({ value: ranks[dVal] || dVal.toString(), suit: cardSuitsPool[Math.floor(Math.random() * 4)] });
            dScore = calcBlackjackScore(session.dealerCards);
            if (dScore <= 21 && dScore > pScore) {
                finalResultStatus = "lose"; winMultiplier = 0.0; reasonString = "Dealer Smart Move Wins";
            }
        }
    }

    let winAmount = 0;
    let dbAction = "bet";
    let dbAmount = session.reqAmount; // 🔒 বাজি হারলেও ডাটাবেজে আপনার রিয়াল বাজি ধরার টাকাই (Stake) জমা হবে ওস্তাদ!

    if (finalResultStatus === "win") {
        winAmount = Math.round(session.reqAmount * winMultiplier);
        dbAction = "win"; dbAmount = winAmount;
    } else if (finalResultStatus === "push") {
        winAmount = session.reqAmount; // বাজি ড্র হলে টাকা রিফান্ড ব্যাক হবে ভাই ভাই
        dbAction = "win"; dbAmount = winAmount; 
    }

    try {
        let phpPayload = {
            action: dbAction,
            username: userId,
            amount: dbAmount,
            wallet: session.wallet,
            game: session.finalGameName // 🎯 লবির কি-শর্টকোড 'blackjack21' টাইট লক
        };

        if (finalResultStatus === "push") phpPayload.status = "win"; // রিফান্ড সিঙ্ক লক
        else if (finalResultStatus === "lose") phpPayload.status = "lose";
        else phpPayload.status = "win";

        // 🛫 ৩. মেইন সাইটের সিকিউরড গেটওয়েতে রিয়েল-টাইম উইন-লস সেটেলমেন্ট এপিআই হিট
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, phpPayload, { timeout: 30000 });
        let latestUserDbBalance = session.currentDbBalance;

        if (response.data && response.data.status === "ok") {
            latestUserDbBalance = response.data.balance;
            io.emit("balanceUpdate", { username: userId, balance: latestUserDbBalance });
        }

        delete activeBlackjackSessions[userId]; // সেশন ক্লিয়ার আউট ভাই ভাই

        return res.json({
            success: true,
            balance: latestUserDbBalance,
            status: finalResultStatus,
            winAmount: winAmount,
            gameData: {
                playerCards: session.playerCards,
                dealerCards: session.dealerCards,
                playerScore: pScore,
                dealerScore: dScore,
                isGameOver: true,
                status: finalResultStatus,
                winAmount: winAmount,
                result: reasonString
            }
        });
    } catch (e) {
        delete activeBlackjackSessions[userId];
        return res.json({ success: false, message: "X Database Sync Error during Settlement!" });
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log("Player connected to Blackjack 21 Engine Node!");
});

// ⚡ কাস্টম ব্ল্যাকজ্যাক নোড সার্ভার পোর্ট গেটওয়ে লাইভ অন ফায়ার
const PORT = process.env.PORT || 17000;
server.listen(PORT, () => {
    console.log(`🃏 Blackjack 21 Engine Running on port ${PORT}`);
});
