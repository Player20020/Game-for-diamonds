// ==========================================
// СОСТОЯНИЕ СИСТЕМЫ (ЗАГРУЗКА)
// ==========================================
let coins = parseInt(localStorage.getItem('sys_coins')) || 0;
let lastBonusTime = parseInt(localStorage.getItem('sys_last_bonus')) || 0;
let hasPassive = localStorage.getItem('sys_passive') === 'true';
let globalMsg = localStorage.getItem('sys_global_msg') || "ДОБРО ПОЖАЛОВАТЬ. СИСТЕМА ОБНОВЛЕНА ДО V4.1";

// Инвентарь и История
let inventory = JSON.parse(localStorage.getItem('sys_inv')) || { iron: 0, emerald: 0, diamond: 0, netherite: 0 };
let history = JSON.parse(localStorage.getItem('sys_history')) || [];

// Цены
const prices = { iron: 300, emerald: 400, diamond: 600, netherite: 2000 };

// ==========================================
// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
// ==========================================

function updateUI() {
    // Числа и тексты
    safeSetText('coinsDisp', coins.toLocaleString());
    safeSetText('inv-iron', inventory.iron);
    safeSetText('inv-emerald', inventory.emerald);
    safeSetText('inv-diamond', inventory.diamond);
    safeSetText('inv-netherite', inventory.netherite);
    
    // Глобальные сообщения
    safeSetText('globalTicker', globalMsg);
    safeSetText('inboxContent', globalMsg);

    // Кнопка апгрейда (30к)
    const upgBtn = document.getElementById('upgradeBtn');
    if (upgBtn) {
        if (hasPassive) {
            upgBtn.innerText = "АКТИВЕН";
            upgBtn.disabled = true;
            upgBtn.style.boxShadow = "0 0 10px var(--neon-green)";
        } else {
            upgBtn.disabled = (coins < 30000);
        }
    }

    renderHistory();
    calcExchange();
}

// Таймер на 30 минут
function updateTimer() {
    const btn = document.getElementById('bonusBtn');
    const timerText = document.getElementById('timerText');
    if (!btn || !timerText) return;

    const cooldown = 30 * 60 * 1000; // 30 минут
    const now = Date.now();
    const elapsed = now - lastBonusTime;
    const remaining = cooldown - elapsed;

    if (remaining > 0) {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        timerText.innerText = `ДОСТУПНО ЧЕРЕЗ: ${m}м ${s}с`;
        setTimeout(updateTimer, 1000);
    } else {
        btn.disabled = false;
        btn.style.opacity = "1";
        timerText.innerText = "СИСТЕМА ГОТОВА К СБОРУ";
        timerText.style.color = "var(--neon-green)";
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

function calcExchange() {
    const slider = document.getElementById('diamSlider');
    const typeSelect = document.getElementById('resourceType');
    if (!slider || !typeSelect) return;

    const qty = parseInt(slider.value);
    const type = typeSelect.value;
    const cost = qty * prices[type];
    
    safeSetText('diamLabel', qty);
    safeSetText('totalCost', cost.toLocaleString());
    
    const buyBtn = document.getElementById('buyBtn');
    if (buyBtn) buyBtn.disabled = (coins < cost);
}

function executeTrade() {
    const qty = parseInt(document.getElementById('diamSlider').value);
    const type = document.getElementById('resourceType').value;
    const cost = qty * prices[type];

    if (coins >= cost) {
        coins -= cost;
        inventory[type] += qty;
        
        const dateStr = new Date().toLocaleString();
        const hashStr = 'TX-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        
        // В историю
        history.unshift({ date: dateStr, hash: hashStr, type: type.toUpperCase(), qty: qty });
        if (history.length > 15) history.pop();

        // В чек
        safeSetText('rDate', dateStr);
        safeSetText('rHash', hashStr);
        safeSetText('rType', type.toUpperCase());
        safeSetText('rQty', qty);
        
        document.getElementById('receiptOverlay').style.display = 'flex';
        saveData();
        updateUI();
    }
}

function buyPassive() {
    if (coins >= 30000 && !hasPassive) {
        coins -= 30000;
        hasPassive = true;
        saveData();
        updateUI();
    }
}

// Доход +100 каждые 60 сек
setInterval(() => {
    if (hasPassive) {
        coins += 100;
        saveData();
        updateUI();
    }
}, 60000);

// ==========================================
// АДМИН-ПАНЕЛЬ И ОКНА
// ==========================================

function openAdminDirect() {
    closeModal('settingsModal');
    openModal('adminModal');
}

function loginAdmin() {
    const pass = document.getElementById('adminPass').value;
    if (pass === 'Admin2202Ai') {
        document.getElementById('adminControls').style.display = 'block';
        document.getElementById('adminMsgText').value = globalMsg;
    } else {
        alert("ОТКАЗАНО В ДОСТУПЕ");
    }
}

function adminAddCash() {
    const val = parseInt(document.getElementById('cashAmount').value);
    if (val) { coins += val; saveData(); updateUI(); }
}

function adminSetMessage() {
    const txt = document.getElementById('adminMsgText').value;
    if (txt) { globalMsg = txt; saveData(); updateUI(); alert("ОТПРАВЛЕНО!"); }
}

function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;
    list.innerHTML = history.length ? "" : "История пуста";
    history.forEach(item => {
        list.innerHTML += `
            <div style="border-bottom:1px solid #222; padding:5px 0;">
                <span style="color:var(--neon-cyan)">${item.date}</span><br>
                ${item.type}: <b>${item.qty}</b> <small style="color:#444">${item.hash}</small>
            </div>`;
    });
}

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ
// ==========================================

function saveData() {
    localStorage.setItem('sys_coins', coins);
    localStorage.setItem('sys_last_bonus', lastBonusTime);
    localStorage.setItem('sys_passive', hasPassive);
    localStorage.setItem('sys_inv', JSON.stringify(inventory));
    localStorage.setItem('sys_history', JSON.stringify(history));
    localStorage.setItem('sys_global_msg', globalMsg);
}

function safeSetText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.innerText = txt;
}

function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function closeReceipt() { document.getElementById('receiptOverlay').style.display = 'none'; }
function updateBrightness(val) { document.documentElement.style.setProperty('--brightness', val); }

// СТАРТ
updateUI();
updateTimer();
