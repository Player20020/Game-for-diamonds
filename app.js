// ==========================================
// БАЗА ДАННЫХ И СОХРАНЕНИЯ
// ==========================================
let coins = parseInt(localStorage.getItem('sys_coins')) || 0;
let diamonds = parseInt(localStorage.getItem('sys_diamonds')) || 0;
let lastTime = parseInt(localStorage.getItem('sys_time')) || 0;
let activePromos = JSON.parse(localStorage.getItem('sys_promos')) || { "START": 5000, "HACK2026": 1500 };
let upgrades = JSON.parse(localStorage.getItem('sys_upgrades')) || { supercharge120w: false };
let stats = JSON.parse(localStorage.getItem('sys_stats')) || { totalMined: 0, totalDiamonds: 0 };

// ==========================================
// КИБЕР-АУДИО СИСТЕМА (Генерирует звуки без файлов)
// ==========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'click') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'success') {
        osc.type = 'square'; osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'error') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    }
}

// ==========================================
// ОСНОВНАЯ ЛОГИКА
// ==========================================
function getCooldownTime() {
    // Если куплен апгрейд 120W, кулдаун 15 минут, иначе 30 минут
    return upgrades.supercharge120w ? (15 * 60 * 1000) : (30 * 60 * 1000);
}

function updateUI() {
    // Обновление балансов
    document.getElementById('coinsDisp').innerText = coins.toLocaleString();
    document.getElementById('inventoryDiamonds').innerText = diamonds.toLocaleString();
    
    // Обновление ранга
    let rankName = "GUEST";
    if (stats.totalDiamonds >= 1) rankName = "ROOKIE";
    if (stats.totalDiamonds >= 10) rankName = "MERCENARY";
    if (stats.totalDiamonds >= 50) rankName = "NETRUNNER";
    if (stats.totalDiamonds >= 100) rankName = "CYBER-LEGEND";
    
    // Находим бейдж ранга (первый элемент в правом верхнем углу)
    const rankBadge = document.querySelector('div[style*="RANK:"]');
    if (rankBadge) rankBadge.innerText = `RANK: ${rankName}`;

    // Обновление черного рынка
    const upgBtn = document.getElementById('upgradeBtn');
    if (upgrades.supercharge120w) {
        upgBtn.innerText = "УСТАНОВЛЕНО";
        upgBtn.disabled = true;
        upgBtn.style.color = "#00ff9d";
        upgBtn.style.borderColor = "#00ff9d";
    } else {
        upgBtn.disabled = coins < 5000;
    }

    calcExchange();
    refreshTimer();
}

function refreshTimer() {
    const btn = document.getElementById('bonusBtn');
    const timer = document.getElementById('timerText');
    const diff = getCooldownTime() - (Date.now() - lastTime);

    if (diff > 0) {
        btn.disabled = true;
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        timer.innerText = `ПЕРЕЗАРЯДКА УЗЛА: ${m}м ${s}с`;
        setTimeout(refreshTimer, 1000);
    } else {
        btn.disabled = false;
        timer.innerHTML = "<span style='color: #00ff9d;'>СИСТЕМА ГОТОВА К СБОРУ</span>";
    }
}

function calcExchange() {
    const qty = document.getElementById('diamSlider').value;
    const cost = qty * 600;
    const btn = document.getElementById('buyBtn');
    const status = document.getElementById('statusInfo');

    document.getElementById('diamLabel').innerHTML = `${qty} <i class="far fa-gem"></i>`;
    document.getElementById('totalCost').innerText = cost.toLocaleString();

    if (coins < cost) {
        status.innerHTML = `<span style="color:#ff4444">Не хватает: ${(cost - coins).toLocaleString()} 🪙</span>`;
        btn.disabled = true;
    } else {
        status.innerHTML = `<span style="color:#00f2ff">Баланс подтвержден</span>`;
        btn.disabled = false;
    }
}

// ==========================================
// ИГРОВЫЕ ДЕЙСТВИЯ
// ==========================================
function collectBonus() {
    playSound('click');
    coins += 1010;
    stats.totalMined += 1010;
    lastTime = Date.now();
    saveData();
    updateUI();
}

function buyUpgrade() {
    if (coins >= 5000 && !upgrades.supercharge120w) {
        playSound('success');
        coins -= 5000;
        upgrades.supercharge120w = true;
        saveData();
        updateUI();
        alert("Модуль 120W Supercharge установлен! Время зарядки снижено до 15 минут.");
    } else {
        playSound('error');
    }
}

function executeTrade() {
    const qty = parseInt(document.getElementById('diamSlider').value);
    const cost = qty * 600;

    if (coins >= cost) {
        playSound('success');
        coins -= cost;
        diamonds += qty;
        stats.totalDiamonds += qty;
        saveData();
        
        // Заполняем стационарный чек
        const now = new Date();
        document.getElementById('rDate').innerText = now.toLocaleString('ru-RU');
        document.getElementById('rHash').innerText = 'TX-' + Math.random().toString(36).substring(2, 12).toUpperCase();
        document.getElementById('rQty').innerText = qty;
        
        document.getElementById('receiptOverlay').style.display = 'flex';
        updateUI();
    } else {
        playSound('error');
    }
}

function applyPromo() {
    const input = document.getElementById('promoInput');
    const code = input.value.toUpperCase();

    if (activePromos[code]) {
        playSound('success');
        coins += activePromos[code];
        delete activePromos[code]; 
        saveData();
        updateUI();
        input.value = '';
        alert("КОД ПРИНЯТ! Средства зачислены.");
    } else {
        playSound('error');
        alert("ОШИБКА: Код недействителен или уже использован.");
    }
}

// ==========================================
// UI И АДМИНКА
// ==========================================
function openModal(id) { playSound('click'); document.getElementById(id).style.display = 'block'; }
function closeModal(id) { playSound('click'); document.getElementById(id).style.display = 'none'; }
function closeReceipt() { playSound('click'); document.getElementById('receiptOverlay').style.display = 'none'; }

function openAdmin() {
    closeModal('settingsModal');
    openModal('adminModal');
}

function loginAdmin() {
    const pass = document.getElementById('adminPass').value;
    if (pass === 'Admin2202Ai') {
        playSound('success');
        document.getElementById('adminControls').style.display = 'block';
    } else {
        playSound('error');
        alert("ACCESS DENIED");
    }
}

function adminAddCash() {
    const amt = parseInt(document.getElementById('cashAmount').value);
    if (amt) { 
        coins += amt; 
        playSound('success');
        saveData(); updateUI(); 
        alert("Успешно начислено"); 
    }
}

function adminCreatePromo() {
    const name = document.getElementById('newPromoName').value.toUpperCase();
    const val = parseInt(document.getElementById('newPromoVal').value);
    if (name && val) {
        activePromos[name] = val;
        playSound('success');
        saveData();
        alert(`Промокод [${name}] на ${val} монет создан!`);
    }
}

function updateBrightness(val) {
    document.documentElement.style.setProperty('--brightness', val);
}

function saveData() {
    localStorage.setItem('sys_coins', coins);
    localStorage.setItem('sys_diamonds', diamonds);
    localStorage.setItem('sys_time', lastTime);
    localStorage.setItem('sys_promos', JSON.stringify(activePromos));
    localStorage.setItem('sys_upgrades', JSON.stringify(upgrades));
    localStorage.setItem('sys_stats', JSON.stringify(stats));
}

// Запуск при загрузке страницы
updateUI();

// Небольшая пасхалка в консоли разработчика
console.log("%c TERMINAL V2.0 INITIALIZED ", "background: #00f2ff; color: #000; font-weight: bold; font-size: 20px;");
console.log("Welcome to the underground network, runner.");
