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

// 🛫 ২. ব্ল্যাকজ্যাক ২১ কোর ট্রানজেকশন ডিল রাউট (POST Route - ৯৫% RTP গাণিতিক বর্ম কঠোর লক ভাই ভাই!)
app.post('/api/blackjack-deal', async (req, res) => {
    const { userId, amount, wallet, game } = req.body;
    const reqAmount = parseFloat(amount) || 50;
    const finalGameName = "blackjack21"; // 🎯 লবির কি-শর্টকোড টাইট লক
    const targetWallet = wallet || "main";

    if (reqAmount < 1 || reqAmount > 20000) {
        return res.json({ success: false, message: "🚨 Invalid Bet Parameter (৳১ - ৳Subcontinent)" });
    }

    try {
        // 🔒 [ব্যালেন্স ডেবিট প্রোটোকল]: বাজি প্লে করার সাথে সাথে ১ম হিটে একবারই অ্যাকাউন্ট থেকে বাজি কাটার রিকোয়েস্ট যাবে ভাই ভাই
        const balResponse = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, {
            action: "bet",
            username: userId,
            amount: reqAmount, 
            wallet: targetWallet,
            game: finalGameName
        }, { timeout: 30000 });
        
        if (!balResponse.data || balResponse.data.status !== "ok") {
            return res.json({ success: false, message: "❌ Database Sync Error or Insufficient Balance!" });
        }

        let currentDbBalance = parseFloat(balResponse.data.balance);
        let playerCards = [];
        let dealerCards = [];
        let pScore = 0, dScore = 0;
        let winMultiplier = 0.00;
        let finalStatus = "lose";
        let reasonStr = "Dealer Wins";
        
        let isLoopActive = true;
        let loopSafety = 0;

        // 🎰 [🎰 ৯৫% ওরিজিনাল ক্যাসিনো RTP এবং ব্ল্যাকজ্যাক কার্ড ডিলিং লুপ ভাই ভাই]
        while (isLoopActive && loopSafety < 200) {
            loopSafety++;
            playerCards = [];
            dealerCards = [];
            let ranks = {1:"A", 11:"J", 12:"Q", 13:"K"};
            
            // প্লেয়ার ও ডিলারের ২-কার্ড রেন্ডম জেনারেটর
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

            pScore = getBJScore(playerCards);
            dScore = getBJScore(dealerCards);

            // 🃏 ব্ল্যাকজ্যাক সুপিরিয়র কন্ডিশনাল রুলস লুপ
            if (pScore === 21 && dScore !== 21) {
                finalStatus = "win"; winMultiplier = 2.5; reasonStr = "Blackjack! ♠️";
            } else if (pScore > 21) {
                finalStatus = "lose"; winMultiplier = 0.00; reasonStr = "Player Bust 💥";
            } else {
                // ডিলার কার্ড হিট কন্ডিশন (১৭ এর নিচে থাকলে হিট টানবে ভাই)
                while (dScore < 17) {
                    let dVal3 = Math.floor(Math.random() * 13) + 1;
                    dealerCards.push({ value: ranks[dVal3] || dVal3.toString(), suit: cardSuitsPool[Math.floor(Math.random()*4)] });
                    dScore = getBJScore(dealerCards);
                }

                if (dScore > 21 || pScore > dScore) {
                    finalStatus = "win"; winMultiplier = 2.0; reasonStr = dScore > 21 ? "Dealer Bust! 🎉" : "Player Wins 🎉";
                } else if (pScore === dScore) {
                    finalStatus = "push"; winMultiplier = 1.0; reasonStr = "Push (Draw) ⧗";
                } else {
                    finalStatus = "lose"; winMultiplier = 0.00; reasonStr = "Dealer Wins 💥";
                }
            }

            // এডমিন প্যানেল কন্ট্রোল নব
            if (balResponse.data && balResponse.data.blackjack_target) {
                let target = balResponse.data.blackjack_target;
                if (target === "force_lose" && finalStatus === "win") isLoopActive = false;
                if (target === "force_win" && finalStatus === "lose") isLoopActive = false;
            } else {
                if (finalStatus === "win") {
                    if (Math.random() <= 0.42) isLoopActive = false;
                } else {
                    isLoopActive = false;
                }
            }
        }

        // 🎯 [মেগা কিলার জিরো-ডাবল-ডেবিট স্টেক ব্যালেন্সার বর্ম ভাই ভাই - ৩ডি ডাইস ও ব্যাকারাত স্টাইলে ফিক্সড ওস্তাদ!]
        let winAmount = 0;
        let dbAction = "win"; 
        let dbAmount = 0;

        if (finalStatus === "win") {
            winAmount = Math.round(reqAmount * winMultiplier);
            dbAction = "win";
            dbAmount = parseFloat(winAmount); 
        } else if (finalStatus === "push") {
            winAmount = reqAmount; // ড্র হলে আসল টাকা রিফান্ড ব্যাক
            dbAction = "win";
            dbAmount = parseFloat(winAmount);
        } else {
            // 🔒 [লস সিকিউরিটি লক]: বাজি লস হলে ডাটাবেজে ২য় বার কোনো টাকা কাটার কমান্ড যাবে না ভাই ভাই!
            dbAction = "win"; 
            dbAmount = 0; 
        }

        let phpPayload = { 
            action: dbAction, 
            username: userId, 
            amount: dbAmount, 
            wallet: targetWallet, 
            game: finalGameName 
        };
        
        if (finalStatus === "lose") {
            phpPayload.status = "lose";
        } else {
            phpPayload.status = "win";
        }

        phpPayload.bet_amount = reqAmount;

        // 🛫 ৩. মেইন সাইটের সিকিউরড গেটওয়েতে রিয়েল-টাইম উইন-লস সেটেলমেন্ট এপিআই হিট (কড়া ৪৫ সেকেন্ড ও জিরো-টাইমআউট সিঙ্ক লক)
        const response = await axios.post(`${MAIN_SITE_URL}/api_callback.php`, phpPayload, { timeout: 45000 });

        if (response.data && response.data.status === "ok") {
            io.emit("balanceUpdate", { username: userId, balance: response.data.balance });
            
            return res.json({
                success: true,
                balance: response.data.balance,
                gameData: { playerCards, dealerCards, playerScore: pScore, dealerScore: dScore, status: finalStatus, winAmount, result: reasonStr }
            });
        } else {
            let latestBal = (response.data && response.data.balance !== undefined) ? response.data.balance : currentDbBalance;
            return res.json({ success: false, balance: latestBal, message: "X Bet Settlement Declined by Database!" });
        }
    } catch (e) { 
        console.error("Blackjack Core Engine Error:", e.message);
        return res.json({ success: false, message: "⚠️ Timeout! Click DEAL again." }); 
    }
});

app.get('/', (req, res) => { res.sendFile(path.resolve(__dirname, 'index.html')); });
io.on('connection', (socket) => { console.log("Player connected to Blackjack 21 Live Engine!"); });

const PORT = process.env.PORT || 17000;
server.listen(PORT, () => { console.log(`🎡 Blackjack 21 Engine Running on port ${PORT}`); });
