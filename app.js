// 設定
const CONFIG = {
    // GASのウェブアプリURLをここに設定してください
    GAS_URL: 'https://script.google.com/macros/s/AKfycbyRt6J9fNpX2K3bs8t8ZUN0w5rObwLhXcTA_pS5lx2142o8wiRT3AN6npdHZ-SiFrnOxg/exec',
    USER_ID: 'user01',
    APP_URL: 'https://kawase-syun.github.io/-APP/'
};

// グローバル状態
let todayData = null;

// DOM要素
const elements = {
    userName: document.getElementById('userName'),
    currentTime: document.getElementById('currentTime'),
    statusText: document.getElementById('statusText'),
    statusCard: document.getElementById('statusCard'),
    checkinBtn: document.getElementById('checkinBtn'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    completeBtn: document.getElementById('completeBtn'),
    todayRecord: document.getElementById('todayRecord'),
    checkinTime: document.getElementById('checkinTime'),
    checkoutTime: document.getElementById('checkoutTime'),
    workTime: document.getElementById('workTime'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toast: document.getElementById('toast')
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    updateClock();
    setInterval(updateClock, 1000);
});

// アプリ初期化
async function initApp() {
    try {
        showLoading(true);

        // ユーザー情報取得
        await loadUserInfo();

        // 本日のデータ取得
        await loadTodayData();

        // UIを更新
        updateUI();

        showLoading(false);
    } catch (error) {
        console.error('初期化エラー:', error);
        showToast('初期化に失敗しました。GAS URLを確認してください。', 'error');
        showLoading(false);
    }
}

// ユーザー情報読み込み
async function loadUserInfo() {
    try {
        const response = await fetch(`${CONFIG.GAS_URL}?action=getUserInfo&userId=${CONFIG.USER_ID}`);
        const data = await response.json();

        if (data.success) {
            elements.userName.textContent = `${data.user.name}（${data.user.id}）`;
        } else {
            throw new Error(data.message || 'ユーザー情報の取得に失敗');
        }
    } catch (error) {
        elements.userName.textContent = '研修生';
        throw error;
    }
}

// 本日のデータ読み込み
async function loadTodayData() {
    try {
        const response = await fetch(`${CONFIG.GAS_URL}?action=getTodayRecord&userId=${CONFIG.USER_ID}`);
        const data = await response.json();

        if (data.success) {
            todayData = data.record;
        } else {
            todayData = null;
        }
    } catch (error) {
        console.error('本日のデータ取得エラー:', error);
        todayData = null;
    }
}

// UI更新
function updateUI() {
    if (!todayData || !todayData.checkinTime) {
        // 出勤前
        elements.statusText.textContent = '出勤打刻をしてください';
        elements.statusCard.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
        elements.checkinBtn.disabled = false;
        elements.checkoutBtn.disabled = true;
        elements.todayRecord.style.display = 'none';
    } else if (!todayData.checkoutTime) {
        // 出勤済み、退勤前
        elements.statusText.textContent = '勤務中です。お疲れ様です！';
        elements.statusCard.style.background = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
        elements.checkinBtn.disabled = true;
        elements.checkoutBtn.disabled = false;

        // 本日の記録を表示
        elements.todayRecord.style.display = 'block';
        elements.checkinTime.textContent = todayData.checkinTime;
        elements.checkoutTime.textContent = '--:--';
        elements.workTime.textContent = '--';
    } else {
        // 退勤済み
        elements.statusText.textContent = '本日の勤務は終了しました。お疲れ様でした！';
        elements.statusCard.style.background = 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)';
        elements.checkinBtn.disabled = true;
        elements.checkoutBtn.disabled = true;

        // 本日の記録を表示
        elements.todayRecord.style.display = 'block';
        elements.checkinTime.textContent = todayData.checkinTime;
        elements.checkoutTime.textContent = todayData.checkoutTime;
        elements.workTime.textContent = todayData.workTime || '--';
    }
}

// 時計更新
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    });
    elements.currentTime.textContent = `${dateString} ${timeString}`;
}

// 出勤打刻
elements.checkinBtn.addEventListener('click', async () => {
    if (!confirm('出勤打刻を行いますか？')) return;

    try {
        showLoading(true);

        const response = await fetch(CONFIG.GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'checkin',
                userId: CONFIG.USER_ID
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('出勤打刻が完了しました！', 'success');
            await loadTodayData();
            updateUI();
        } else {
            throw new Error(data.message || '出勤打刻に失敗しました');
        }
    } catch (error) {
        console.error('出勤打刻エラー:', error);
        showToast(error.message || '出勤打刻に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
});

// 退勤打刻
elements.checkoutBtn.addEventListener('click', async () => {
    if (!confirm('退勤打刻を行いますか？')) return;

    try {
        showLoading(true);

        const response = await fetch(CONFIG.GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'checkout',
                userId: CONFIG.USER_ID
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('退勤打刻が完了しました！お疲れ様でした！', 'success');
            await loadTodayData();
            updateUI();
        } else {
            throw new Error(data.message || '退勤打刻に失敗しました');
        }
    } catch (error) {
        console.error('退勤打刻エラー:', error);
        showToast(error.message || '退勤打刻に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
});

// 課題完了報告
elements.completeBtn.addEventListener('click', async () => {
    if (!confirm('課題完了報告を送信しますか？\n管理者に通知が届きます。')) return;

    try {
        showLoading(true);

        const response = await fetch(CONFIG.GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'complete',
                userId: CONFIG.USER_ID,
                appUrl: CONFIG.APP_URL
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('🎉 課題完了報告を送信しました！\n管理者が確認します。', 'success');
        } else {
            throw new Error(data.message || '課題完了報告の送信に失敗しました');
        }
    } catch (error) {
        console.error('課題完了報告エラー:', error);
        showToast(error.message || '課題完了報告の送信に失敗しました', 'error');
    } finally {
        showLoading(false);
    }
});

// ローディング表示
function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.add('show');
    } else {
        elements.loadingOverlay.classList.remove('show');
    }
}

// トースト表示
function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = 'toast show';

    if (type === 'success') {
        elements.toast.classList.add('success');
    } else if (type === 'error') {
        elements.toast.classList.add('error');
    }

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Service Worker登録
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker登録成功:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker登録失敗:', error);
            });
    });
}
