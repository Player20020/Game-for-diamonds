// ==========================================
// СОСТОЯНИЕ СИСТЕМЫ
// ==========================================
let coins = parseInt(localStorage.getItem('sys_coins')) || 0;
let lastBonusTime = parseInt(localStorage.getItem('sys_last_bonus')) || 0;
let hasPassive = localStorage.getItem('sys_passive') === 'true';
let globalMsg = localStorage.getItem('sys_global_msg') || "ДОБРО ПОЖАЛОВАТЬ В ТЕРМИНАЛ V4.0. СИСТЕМА СТАБИЛЬНА.";

// Инвентарь
let inventory = JSON.parse(localStorage.getItem('sys_inv')) || { 
    iron: 0, emerald: 0, diamond: 0, netherite: 0 
};

// История чеков
let history = JSON.parse(localStorage.getItem('sys_history')) || [];

// Цены
const prices = { iron: 300, emerald: 400, diamond: 600, netherite: 2000 };

// ==========================================
// ИНИЦИАЛИЗАЦИЯ И ОБНОВЛЕНИЕ UI
// ==========================================

function updateUI() {
    // Баланс и инвентарь
    document.getElementById('coinsDisp').innerText = coins.toLocaleString();
    document.getElementById('inv-iron').innerText = inventory.iron;
    document.getElementById('inv-emerald').innerText = inventory.emerald;
    document.getElementById('inv-diamond').innerText = inventory.diamond;
    document.getElementById('inv-netherite').innerText = inventory.netherite;

    // Глобальное сообщение
    document.getElementById('globalTicker').innerText = globalMsg;
    document.getElementById('inboxContent').innerText = globalMsg;

    // Кнопка апгрейда
    const upgBtn = document.getElementById('upgradeBtn');
    if (hasPassive) {
        upgBtn.innerText = "АКТИВЕН";
        upgBtn.disabled = true;
    } else {
        upgBtn.disabled = (coins < 30000);
    }

    renderHistory();
    calcExchange();
}

// Таймер для кнопки бонуса
function updateTimer() {
    const btn = document.getElementById('bonusBtn');
    const timerText = document.getElementById('timerText');
    const cooldown = 10 * 60 * 1000; // 10 минут в миллисекундах
    const now = Date.now();
    const diff = cooldown - (now - lastBonusTime);

    if (diff > 0) {
        btn.disabled = true;
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        timerText.innerText = `ПЕРЕЗАРЯДКА: ${m}м ${s}с`;
        setTimeout(updateTimer, 1000);
    } else {
        btn.disabled = false;
        timerText.innerText = "СИСТЕМА ГОТОВА К СБОРУ";
    }
}

// ==========================================
// ЛОГИКА ДЕЙСТВИЙ
// ==========================================

function collectBonus() {
    coins += 1010;
    lastBonusTime = Date.now();
    saveData();
    updateUI();
    updateTimer();
}

function buyPassive() {
    if (coins >= 30000 && !hasPassive) {
        coins -= 30000;
        hasPassive = true;
        saveData();
        updateUI();
        alert("Авто-майнер запущен!");
    }
}

// Пассивный доход раз в минуту
setInterval(() => {
    if (hasPassive) {
        coins += 100;
        saveData();
        updateUI();
    }
}, 60000);

function calcExchange() {
    const qty = document.getElementById('diamSlider').value;
    const type = document.getElementById('resourceType').value;
    const cost = qty * prices[type];
    
    document.getElementById('diamLabel').innerText = qty;
    document.getElementById('totalCost').innerText = cost.toLocaleString();
    
    const btn = document.getElementById('buyBtn');
    if (coins < cost) {
        document.getElementById('statusInfo').innerHTML = "<span style='color:red'>HACK...</span>";
        btn.disabled = true;
    } else {
        document.getElementById('statusInfo').innerHTML = "<span style='color:var(--neon-green)'>READY</span>";
        btn.disabled = false;
    }
}

function executeTrade() {
    const qty = parseInt(document.getElementById('diamSlider').value);
    const type = document.getElementById('resourceType').value;
    const cost = qty * prices[type];

    if (coins >= cost) {
        coins -= cost;
        inventory[type] += qty;
        
        const dateStr = new Date().toLocaleString();
        const hashStr = 'TX-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Создаем объект чека для истории
        const receipt = {
            date: dateStr,
            hash: hashStr,
            type: type.toUpperCase(),
            qty: qty
        };
        
        history.unshift(receipt); // Добавляем в начало списка
        if (history.length > 20) history.pop(); // Храним только последние 20 сделок

        // Показ текущего чека
        document.getElementById('rDate').innerText = dateStr;
        document.getElementById('rHash').innerText = hashStr;
        document.getElementById('rType').innerText = type.toUpperCase();
        document.getElementById('rQty').innerText = qty;
        document.getElementById('receiptOverlay').style.display = 'flex';
        
        saveData();
        updateUI();
    }
}

function renderHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = "";
    
    if (history.length === 0) {
        list.innerHTML = "<div style='color:#444'>История пуста...</div>";
        return;
    }

    history.forEach(item => {
        list.innerHTML += `
            <div class="history-item">
                <div style="color:var(--neon-cyan)">${item.date}</div>
                <div>${item.type}: <span style="color:#fff">${item.qty} ед.</span></div>
                <div style="font-size:0.6rem; color:#555">${item.hash}</div>
            </div>
        `;
    });
}

// ==========================================
// АДМИНКА
// ==========================================

function openAdminModal() {
    closeModal('settingsModal');
    openModal('adminModal');
}

function loginAdmin() {
    const pass = document.getElementById('adminPass').value;
    if (pass === 'Admin2202Ai') {
        document.getElementById('adminControls').style.display = 'block';
        document.getElementById('adminMsgText').value = globalMsg;
    } else {
        alert("ОШИБКА ДОСТУПА");
    }
}

function adminAddCash() {
    const val = parseInt(document.getElementById('cashAmount').value);
    if (val) {
        coins += val;
        saveData();
        updateUI();
    }
}

function adminSetMessage() {
    const newMsg = document.getElementById('adminMsgText').value;
    if (newMsg) {
        globalMsg = newMsg;
        saveData();
        updateUI();
        alert("Сообщение обновлено!");
    }
}

// ==========================================
// СЕРВИСНЫЕ
// ==========================================

function saveData() {
    localStorage.setItem('sys_coins', coins);
    localStorage.setItem('sys_last_bonus', lastBonusTime);
    localStorage.setItem('sys_passive', hasPassive);
    localStorage.setItem('sys_inv', JSON.stringify(inventory));
    localStorage.setItem('sys_history', JSON.stringify(history));
    localStorage.setItem('sys_global_msg', globalMsg);
}

function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function closeReceipt() { document.getElementById('receiptOverlay').style.display = 'none'; }
function updateBrightness(val) { document.documentElement.style.setProperty('--brightness', val); }

// Запуск
updateUI();
updateTimer();
