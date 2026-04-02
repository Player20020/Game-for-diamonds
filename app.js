// ==========================================
// СОХРАНЕНИЕ ДАННЫХ (LocalStorage)
// ==========================================
let coins = parseInt(localStorage.getItem('sys_coins')) || 0;
let hasPassive = localStorage.getItem('sys_passive') === 'true';
// Инвентарь для всех ресурсов
let inventory = JSON.parse(localStorage.getItem('sys_inv')) || { 
    iron: 0, emerald: 0, diamond: 0, netherite: 0 
};

// Цены на ресурсы
const prices = { 
    iron: 300, 
    emerald: 400, 
    diamond: 600, 
    netherite: 2000 
};

// ==========================================
// АУДИО ЭФФЕКТЫ (Web Audio API)
// ==========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    
    if (type === 'click') {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'success') {
        osc.type = 'square'; osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    }
}

// ==========================================
// ОСНОВНАЯ ЛОГИКА ТЕРМИНАЛА
// ==========================================

function updateUI() {
    // Обновляем баланс монет
    document.getElementById('coinsDisp').innerText = coins.toLocaleString();
    
    // Обновляем инвентарь на экране
    document.getElementById('inv-iron').innerText = inventory.iron;
    document.getElementById('inv-emerald').innerText = inventory.emerald;
    document.getElementById('inv-diamond').innerText = inventory.diamond;
    document.getElementById('inv-netherite').innerText = inventory.netherite;

    // Проверка кнопки апгрейда (Генератор за 30к)
    const upgBtn = document.getElementById('upgradeBtn');
    if (hasPassive) {
        upgBtn.innerText = "АКТИВЕН";
        upgBtn.disabled = true;
        upgBtn.style.boxShadow = "0 0 15px var(--neon-green)";
    } else {
        upgBtn.disabled = (coins < 30000);
    }

    calcExchange();
}

// Функция сбора (БЕЗ КУЛДАУНА)
function collectBonus() {
    playSound('click');
    coins += 1010;
    saveData();
    updateUI();
}

// Расчет цены при движении ползунка или смене ресурса
function calcExchange() {
    const qty = document.getElementById('diamSlider').value;
    const type = document.getElementById('resourceType').value;
    const cost = qty * prices[type];
    const btn = document.getElementById('buyBtn');
    
    document.getElementById('diamLabel').innerText = qty;
    document.getElementById('totalCost').innerText = cost.toLocaleString();

    if (coins < cost) {
        document.getElementById('statusInfo').innerHTML = `<span style="color:#ff4444">WAITING...</span>`;
        btn.disabled = true;
    } else {
        document.getElementById('statusInfo').innerHTML = `<span style="color:var(--neon-green)">READY</span>`;
        btn.disabled = false;
    }
}

// Покупка ресурсов
function executeTrade() {
    const qty = parseInt(document.getElementById('diamSlider').value);
    const type = document.getElementById('resourceType').value;
    const cost = qty * prices[type];

    if (coins >= cost) {
        playSound('success');
        coins -= cost;
        inventory[type] += qty;
        saveData();
        
        // Показ чека
        const now = new Date();
        document.getElementById('rDate').innerText = now.toLocaleString();
        document.getElementById('rHash').innerText = 'TX-' + Math.random().toString(36).substring(2, 12).toUpperCase();
        document.getElementById('rType').innerText = type.toUpperCase();
        document.getElementById('rQty').innerText = qty;
        document.getElementById('receiptOverlay').style.display = 'flex';
        
        updateUI();
    }
}

// Покупка пассивного дохода
function buyPassive() {
    if (coins >= 30000 && !hasPassive) {
        playSound('success');
        coins -= 30000;
        hasPassive = true;
        saveData();
        updateUI();
        alert("Генератор прибыли запущен! +100 монет каждую минуту.");
    }
}

// Цикл пассивного дохода (раз в минуту)
setInterval(() => {
    if (hasPassive) {
        coins += 100;
        saveData();
        updateUI();
        console.log("LOG: +100 credits generated.");
    }
}, 60000);

// ==========================================
// СЕРВИСНЫЕ ФУНКЦИИ
// ==========================================
function saveData() {
    localStorage.setItem('sys_coins', coins);
    localStorage.setItem('sys_passive', hasPassive);
    localStorage.setItem('sys_inv', JSON.stringify(inventory));
}

function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function closeReceipt() { document.getElementById('receiptOverlay').style.display = 'none'; }

function loginAdmin() {
    if (document.getElementById('adminPass').value === 'Admin2202Ai') {
        document.getElementById('adminControls').style.display = 'block';
    }
}

function adminAddCash() {
    const amt = parseInt(document.getElementById('cashAmount').value);
    if (amt) { coins += amt; saveData(); updateUI(); }
}

function applyPromo() {
    const code = document.getElementById('promoInput').value.toUpperCase();
    if (code === 'START') {
        coins += 5000;
        document.getElementById('promoInput').value = '';
        saveData(); updateUI();
        alert("PROMO OK!");
    }
}

function updateBrightness(val) {
    document.documentElement.style.setProperty('--brightness', val);
}

// Запуск
updateUI();
