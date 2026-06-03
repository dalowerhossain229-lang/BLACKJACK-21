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

// 💰 ১. লাইভ অ্যাকাউন্ট ব্যালেন্স ইন্টারসেপ্টর গেটওয়ে (অন্দর বাহার ও ব্যাকারাত স্টাইলে ১০০% টাইমআউট ও জ্যাম ব্লকার বর্ম ওস্তাদ)
app.get('/api/blackjack-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    const targetWallet = wallet || "main";
    try {
        // 🔒 বাজি ট্র্যাপ ও টাইমআউট এড়াতে সরাসরি পিওর ব্যালেন্স কি-নেম "balance" পাস লক ওস্তাদ
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "balance", 
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

// 🛫 ২. ব্ল্যাকজ্যাক ২১ কোর ট্রানজেকশন ডিল রাউট (POST Route - ১০০% রিয়েল ক্লিকেবল আর্কিটেকচার ভাই ভাই!)
app.post('/api/blackjack-deal', async (req, res) => {
    const { userId, amount, wallet } = req.body;
    const reqAmount = parseFloat(amount) || 50;
    const finalGameName = "blackjack21";
    const targetWallet = wallet || "main";

    if (reqAmount < 1 || reqAmount > 20000) {
        return res.json({ success: false, message: "🚨 Invalid Bet Parameter (৳১ - ৳Subcontinent)" });
    }

    try {
        // 🔒 [ব্যালেন্স ডেবিট প্রোটোকল]: বাজি প্লে করার সাথে সাথে ১ম হিটে একবারই অ্যাকাউন্ট থেকে বাজি কাটার রিকোয়েস্ট যাবে ভাই ভাই
        const balResponse = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet", username: userId, amount: reqAmount, wallet: targetWallet, game: finalGameName
        }, { timeout: 30000 });
        
        if (!balResponse.data || balResponse.data.status !== "ok") {
            return res.json({ success: false, message: "❌ Database Sync Error or Insufficient Balance!" });
        }

        let currentDbBalance = parseFloat(balResponse.data.balance);
        let ranks = {1:"A", 11:"J", 12:"Q", 13:"K"};
        
        // 🃏 প্রথম ২ কার্ডের খাঁটি ডিস্ট্রিবিউশন লুপ
        let playerCards = [];
        let dealerCards = [];
        
        for(let i=0; i<2; i++) {
            let pVal = Math.floor(Math.random() * 13) + 1;
            let dVal = Math.floor(Math.random() * 13) + 1;
            playerCards.push({ value: ranks[pVal] || pVal.toString(), suit: cardSuitsPool[Math.floor(Math.random()*4)] });
            dealerCards.push({ value: ranks[dVal] || dVal.toString(), suit: cardSuitsPool[Math.floor(Math.random()*4)] });
        }

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

        let playerScore = getBJScore(playerCards);
        let dealerScore = getBJScore(dealerCards);

        // মেমরিতে এই সেশন টোকেন ডাটা লক করে রাখা হলো যাতে HIT/STAND কাজ করতে পারে ওস্তাদ
        activeBlackjackSessions[userId] = {
            playerCards: playerCards,
            dealerCards: dealerCards,
            reqAmount: reqAmount,
            wallet: targetWallet,
            currentDbBalance: currentDbBalance
        };

        // 🎯 [মেগা বাটন আনলকার লজিক]: প্রথম ২ কার্ডে যদি ন্যাচারাল ২১ এসে যায় তবেই সরাসরি গেম ক্লোজ হবে
        if (playerScore === 21) {
            return await settleFinalBlackjackRound(userId, "win", 2.5, "Blackjack! ♠️", res);
        }

        // 📈 অন্যথায় গেম স্টেট "playing" (রানিং) স্ট্যাটাসে ফ্রন্টএন্ডে যাবে, যাতে HIT/STAND বোতাম দুটি ১ সেকেন্ডে অন ফায়ার সচল হয়!
        return res.json({
            success: true,
            balance: currentDbBalance,
            status: "playing",
            gameData: {
                playerCards: playerCards,
                dealerCards: [dealerCards[0], { value: "HIDDEN", suit: "UNKNOWN" }], // ডিলারের ১ম কার্ড শো, ২য় কার্ড হাইড ক্লাসিক রুলস
                playerScore: playerScore,
                dealerScore: getBJScore([dealerCards[0]]),
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
    
    // প্লেয়ার ২১ পার হয়ে গেলে সাথে সাথে বাস্ট (Bust) লস
    if (playerScore > 21) {
        return await settleFinalBlackjackRound(userId, "lose", 0.00, "Player Bust 💥", res);
    }

    return res.json({
        success: true,
        balance: session.currentDbBalance,
        status: "playing",
        gameData: {
            playerCards: session.playerCards,
            dealerCards: [session.dealerCards[0], { value: "HIDDEN", suit: "UNKNOWN" }],
            playerScore: playerScore,
            dealerScore: getBJScore([session.dealerCards[0]]),
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

    // ডিলার কার্ড হিট কন্ডিশন (১৭ এর নিচে থাকলে হিট টানবে ভাই ভাই)
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
async function settleFinalBlackjackRound(userId, status, winMultiplier, reasonStr, res) {
    let session = activeBlackjackSessions[userId];
    if (!session) {
        return res.json({ success: false, message: "X Active transaction session expired!" });
    }
    
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
    let dbAction = "win"; // খেলা শেষে ২য় হিটে ডিরেক্ট ক্রেডিট মেথড বাউন্স ফিল্টার লক
    let dbAmount = 0;

    if (status === "win") {
        winAmount = Math.round(session.reqAmount * winMultiplier);
        dbAction = "win"; 
        dbAmount = winAmount;
    } else if (status === "push") {
        winAmount = session.reqAmount; // ড্র হলে বাজি ধরার আসল টাকা রিফান্ড ব্যাক ওস্তাদ
        dbAction = "win"; 
        dbAmount = winAmount;
    } else {
        // 🔒 [লস সিকিউরিটি লক]: বাজি লস হলে ডাটাবেজে ২য় বার কোনো টাকা কাটার কমান্ড যাবে না ভাই ভাই!
        dbAction = "win"; 
        dbAmount = 0; 
    }

    let phpPayload = {
        action: dbAction, 
        username: userId, 
        amount: dbAmount, 
        wallet: session.wallet, 
        game: "blackjack21"
    };

    if (status === "lose") {
        phpPayload.status = "lose";
    } else {
        phpPayload.status = "win";
    }

    // ডাটাবেজ হিস্টোরি ও লগে স্টেক ডাটা ফিক্সড রাখার প্যারামিটার ইনজেকশন
    phpPayload.bet_amount = session.reqAmount;

    try {
        // 🛫 ৩. মেইন সাইটের সিকিউরড গেটওয়েতে রিয়েল-টাইম উইন-লস সেটেলমেন্ট এপিআই হিট (কড়া ৪৫ সেকেন্ড সিঙ্ক)
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, phpPayload, { timeout: 45000 });
        
        if (response.data && response.data.status === "ok") {
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            
            let finalOutput = {
                success: true,
                balance: response.data.balance,
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
            };
            
            delete activeBlackjackSessions[userId]; // মেমোরি সেশন ক্যাশ ক্লিনআপ লুপ ওস্তাদ
            return res.json(finalOutput);
        } else {
            return res.json({ success: false, balance: session.currentDbBalance, message: "X Bet Settlement Declined by Database!" });
        }
    } catch (err) {
        console.error("Blackjack Settlement API Hook Error:", err.message);
        return res.json({ success: false, message: "⚠️ Timeout! Processing fault on server transaction bridge." });
    }
}

app.get('/', (req, res) => { res.sendFile(path.resolve(__dirname, 'index.html')); });
io.on('connection', (socket) => { console.log("Player connected to Blackjack 21 Live Engine Node!"); });

// ⚡ কাস্টম ব্ল্যাকজ্যাক নোড সার্ভার পোর্ট গেটওয়ে লাইভ অন ফায়ার
const PORT = process.env.PORT || 17000;
server.listen(PORT, () => { console.log(`🎡 Blackjack 21 Engine Running on port ${PORT}`); });

