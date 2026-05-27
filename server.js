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

// 🧠 [অফিশিয়াল ব্ল্যাকজ্যাক গেম মেমোরি সেশন ট্র্যাকার লক ভাই ভাই]
let blackjackSessions = {};

// তাসের ডেক জেনারেট করার স্ট্যান্ডার্ড ফর্মুলা ভাই ভাই
const suits = ["♥️", "♦️", "♣️", "♠️"];
const values = [
    { name: "2", val: 2 }, { name: "3", val: 3 }, { name: "4", val: 4 }, 
    { name: "5", val: 5 }, { name: "6", val: 6 }, { name: "7", val: 7 }, 
    { name: "8", val: 8 }, { name: "9", val: 9 }, { name: "10", val: 10 },
    { name: "J", val: 10 }, { name: "Q", val: 10 }, { name: "K", val: 10 }, 
    { name: "A", val: 11 } // টেক্কার মান ডিফল্ট ১১ ভাই ভাই
];

function createDeck() {
    let deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ value: value.name, suit: suit, points: value.val });
        }
    }
    // তাস ওলট-পালট (Shuffle) করার ক্যাসিনো লুপ ভাই ভাই
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// 🧮 তাসের পয়েন্ট নিখুঁত হিসাব করার এবং Ace ১ বা ১১ রি-ম্যাপ করার প্রো মেথড ভাই
function calculateHandPoints(hand) {
    let points = 0;
    let aces = 0;
    for (let card of hand) {
        points += card.points;
        if (card.value === "A") aces++;
    }
    // প্লেয়ার ২১ ক্রস করলে টেক্কার মান ১১ থেকে কমিয়ে ১ লক করবে ভাই ভাই
    while (points > 21 && aces > 0) {
        points -= 10;
        aces--;
    }
    return points;
}

// 💰 ১. লাইভ অ্যাকাউন্ট ব্যালেন্স নিয়ে আসার ডেডিকেটেড গেটওয়ে
app.get('/api/blackjack-balance', async (req, res) => {
    const { userId, wallet } = req.query;
    try {
        const response = await axios.get(`${MAIN_SITE_URL}/api_callback.php?action=get_balance&username=${userId}&wallet=${wallet}`, { timeout: 30000 });
        if (response.data && response.data.status === "ok") {
            return res.json({ success: true, balance: response.data.balance });
        }
        return res.json({ success: false, balance: 0 });
    } catch (e) { return res.json({ success: false, balance: 0 }); }
});

// 🛫 ২. ব্ল্যাকজ্যাক গেম ডিল/স্টার্ট এপিআই রাউট (🔒 ৯৫% RTP প্রোটেকশন চালিত ভাই ভাই)
app.post('/api/blackjack-deal', async (req, res) => {
    const { userId, amount, wallet } = req.body;
    const targetWallet = wallet || "main";
    const reqAmount = parseFloat(amount) || 50;

    // 🔒 ১ থেকে ২০০০ বিডিটি পর্যন্ত কড়া বেট সিকিউরিটি ফিল্টার লক ভাই ভাই
    if (reqAmount < 1 || reqAmount > 2000) {
        return res.json({ success: false, message: "🚨 Invalid Bet Amount (৳১ - ৳২০০০)" });
    }

    try {
        const balCheck = await axios.get(`${MAIN_SITE_URL}/api_callback.php?action=get_balance&username=${userId}&wallet=${targetWallet}`, { timeout: 30000 });
        
        let currentDbBalance = 0;
        if (balCheck.data && balCheck.data.balance !== undefined && balCheck.data.balance !== null) {
            currentDbBalance = parseFloat(balCheck.data.balance);
        } else { currentDbBalance = 9999999; }

        if (currentDbBalance < reqAmount && currentDbBalance !== 9999999) {
            return res.json({ success: false, balance: currentDbBalance, message: "❌ Insufficient Balance!" });
        }

        // 🎰 [৯৫% আরটিপি প্রোটেকশন গেটওয়ে লক ভাই ভাই]: এডমিন কন্ট্রোল প্লাগইন ব্যাকআপ
        let adminTrigger = (balCheck.data && balCheck.data.blackjack_target) ? balCheck.data.blackjack_target : null;

        // নতুন ফ্রেশ তাসের ডেক এবং প্রাথমিক কার্ড ডিলিং ভাই ভাই
        let deck = createDeck();
        let playerHand = [deck.pop(), deck.pop()];
        let dealerHand = [deck.pop(), deck.pop()];

        // 🔒 ৯৫% আরটিপি ও এডমিন সেফটি লুপ: সাধারণ স্পিনে প্লেয়ার শুরুতে ডিরেক্ট ন্যাচারাল ব্ল্যাকজ্যাক (২১) যেন না পায় ভাই
        if (!adminTrigger && calculateHandPoints(playerHand) === 21) {
            deck = createDeck();
            playerHand = [deck.pop(), deck.pop()];
        }

        blackjackSessions[userId] = {
            betAmount: reqAmount,
            wallet: targetWallet,
            deck: deck,
            playerHand: playerHand,
            dealerHand: dealerHand,
            adminControl: adminTrigger
        };

        // পিএইচপি ডাটাবেজে মেইন বেটের টাকা মাইনাস করার কলব্যাক ফায়ার হলো ভাই
        const response = await axios.post(MAIN_SITE_URL + '/api_callback.php', {
            action: "bet",
            username: userId,
            amount: reqAmount,
            wallet: targetWallet
        }, { timeout: 30000 });

        if (response.data && response.data.status === "ok") {
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            
            return res.json({ 
                success: true, 
                balance: response.data.balance,
                playerHand: playerHand,
                dealerHand: dealerHand,
                playerPoints: calculateHandPoints(playerHand),
                dealerPoints: calculateHandPoints([dealerHand[0]]) // শুরুতে ডিলারের কেবল ১ম তাসটি দৃশ্যমান ভাই
            });
        } else {
            delete blackjackSessions[userId];
            let latestBal = (response.data && response.data.balance !== undefined) ? response.data.balance : currentDbBalance;
            return res.json({ success: false, balance: latestBal, message: "❌ Bet Declined by Database!" });
        }

    } catch (e) {
        return res.json({ success: false, message: "⚠️ Timeout! Click DEAL again." });
    }
});

// 🛫 ৩. HIT বোতাম (প্লেয়ার আরেকটি অতিরিক্ত তাস টানবে ভাই ভাই)
app.post('/api/blackjack-hit', (req, res) => {
    const { userId } = req.body;
    const session = blackjackSessions[userId];

    if (!session) return res.json({ success: false, message: "🚨 No Active Session!" });

    // ডেক থেকে ১টি তাস প্লেয়ারের হাতে পুশ লক ভাই ভাই
    let newCard = session.deck.pop();
    session.playerHand.push(newCard);

    let pPoints = calculateHandPoints(session.playerHand);

    // প্লেয়ার যদি ২১ এর বেশি খেয়ে বাস্ট (Bust) হয়ে যায় ভাই ভাই
    if (pPoints > 21) {
        delete blackjackSessions[userId]; // সেশন ক্লোজ, প্লেয়ার লস ভাই
        return res.json({
            success: true,
            status: "bust",
            playerHand: session.playerHand,
            playerPoints: pPoints,
            message: "💥 বাস্ট! আপনার তাসের যোগফল ২১ পার হয়ে গেছে ভাই!"
        });
    }

    return res.json({
        success: true,
        status: "continue",
        playerHand: session.playerHand,
        playerPoints: pPoints
    });
});

// 🛫 ৪. STAND বোতাম (প্লেয়ার আর তাস টানবে না, এবার ডিলার খেলবে এবং চূড়ান্ত ফয়সালা হবে ভাই ভাই)
app.post('/api/blackjack-stand', async (req, res) => {
    const { userId } = req.body;
    const session = blackjackSessions[userId];

    if (!session) return res.json({ success: false, message: "🚨 Request Denied!" });

    try {
        let pPoints = calculateHandPoints(session.playerHand);
        let dPoints = calculateHandPoints(session.dealerHand);

        // ক্যাসিনো রুলস: ডিলারের পয়েন্ট ১৭ এর কম থাকলে সে বাধ্য হয়ে তাস টানতেই থাকবে ভাই ভাই
        while (dPoints < 17) {
            session.dealerHand.push(session.deck.pop());
            dPoints = calculateHandPoints(session.dealerHand);
        }

        // 🔒 [৯৫% RTP ও এডমিন কিলার বর্ম ভাই ভাই]: সাধারণ র্যান্ডম সময়ে ডিলারকে ডাইনামিক শক্তিশালী জেতানোর লুপ
        if (session.adminControl === "force_lose" || (dPoints < pPoints && dPoints <= 16 && Math.random() > 0.05)) {
            session.dealerHand.push(session.deck.pop());
            dPoints = calculateHandPoints(session.dealerHand);
        }

        let gameOutcome = "lose"; // ডিফল্ট প্লেয়ার লস লক
        let winMultiplier = 0.00;

        if (dPoints > 21) {
            gameOutcome = "win"; // ডিলার বাস্ট খেয়েছে, প্লেয়ার বিজয়ী ধামাকা!
            winMultiplier = 2.00;
        } else if (pPoints > dPoints) {
            gameOutcome = "win"; // প্লেয়ারের পয়েন্ট বেশি
            winMultiplier = 2.00;
        } else if (pPoints === dPoints) {
            gameOutcome = "push"; // টাই বা ড্র হয়েছে ভাই ভাই (টাকা ফেরত)
            winMultiplier = 1.00;
        }

        let dbAction = "bet";
        let winAmount = 0;
        if (gameOutcome === "win" || gameOutcome === "push") {
            winAmount = Math.floor(session.betAmount * winMultiplier);
            dbAction = "win";
        }

        let phpPayload = {
            action: dbAction,
            username: userId,
            amount: parseFloat(winAmount),
            wallet: session.wallet
        };

               if (dbAction === "win") {
            phpPayload.bet_amount = session.betAmount;
            phpPayload.multiplier = winMultiplier.toFixed(2);
            phpPayload.status = "win";
            phpPayload.type = "win";
            phpPayload.is_win = 1;
            phpPayload.win_status = "win";
            phpPayload.log_status = "win";
        }

        const response = await axios.post(MAIN_SITE_URL + '/api_callback.php', phpPayload, { timeout: 30000 });

        if (response.data && response.data.status === "ok") {
            delete blackjackSessions[userId]; // 🔒 সফল সেশন ক্লোজ বর্ম ভাই ভাই
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });

            return res.json({
                success: true,
                status: gameOutcome,
                balance: response.data.balance,
                winAmount: winAmount,
                dealerHand: session.dealerHand,
                dealerPoints: dPoints
            });
        } else {
            return res.json({ success: false, message: "❌ Database Callback Synced Error!" });
        }

    } catch (e) {
        console.error("Blackjack stand engine error:", e.message);
        return res.json({ success: false, message: "⚠️ Connection Issue! Click STAND again." });
    }
});

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

// ৯ নম্বর গেম ১৬০০০ এ চলছে, তাই ১০ নম্বর মাইলফলক ব্ল্যাকজ্যাক গেম প্রজেক্টের স্বাধীন কাস্টম পোর্ট ১৭০০০ কড়া লক হলো ভাই ভাই!
const PORT = process.env.PORT || 17000;
server.listen(PORT, () => { console.log(`🃏 Blackjack 21 Engine Running on port ${PORT}`); });
 
