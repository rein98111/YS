let player;
let isRepeat = false;
const API_KEY = 'AIzaSyCcXxqOrzFhdn86ftd8J-P-cu1l9tJo5C4'; // ⚠️ 請確保這是有效的 YouTube Data API Key

// 1. 預設推薦音樂 (當沒有歷史紀錄時顯示)
const defaultMusic = [
    { id: 'V4FOVPhUeUA', title: 'colors', channel: 'HXPETRAIN' },
    { id: 'F5GjEwI8wEA', title: 'EMOMOMO', channel: 'yama_ko' },
    { id: 'WgqaVtnX8I0', title: 'KAMACHO', channel: 'Kizuna AI' },
    { id: 'kqj7b59D85Y', title: '雑魚', channel: '亞北ネル' },
    { id: 'zczjerfFrSI', title: '隙', channel: 'Yuri' }
];

// 2. 初始化 YouTube API
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: { 'autoplay': 0, 'controls': 0 },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady() {
    // A. 恢復搜尋結果或顯示預設清單
    const savedSearch = localStorage.getItem('lastSearch');
    if (savedSearch) {
        displayMusic(JSON.parse(savedSearch), true);
        document.querySelector('header').innerText = `上次的搜尋結果`;
    } else {
        displayMusic(defaultMusic);
    }

    // B. 恢復最後播放的音樂資訊 (不自動播放，僅載入 UI)
    const lastPlayed = localStorage.getItem('lastPlayed');
    if (lastPlayed) {
        const music = JSON.parse(lastPlayed);
        updatePlayerUI(music.title, music.thumb, music.channel);
        player.cueVideoById(music.id); // 預載影片但不播放
    }
}

// 3. 渲染音樂卡片
function displayMusic(items, isSearch = false) {
    const container = document.getElementById('recommendations');
    if (isSearch) container.innerHTML = ''; 
    
    items.forEach(item => {
        // 處理 API 格式差異 (搜尋結果 vs 預設陣列)
        const vId = isSearch ? item.id.videoId : item.id;
        const title = isSearch ? item.snippet.title : item.title;
        const channel = isSearch ? item.snippet.channelTitle : item.channel;
        const thumb = `https://img.youtube.com/vi/${vId}/mqdefault.jpg`;
        
        const card = document.createElement('div');
        card.className = 'music-card';
        card.innerHTML = `
            <img src="${thumb}">
            <div class="title">${title}</div>
            <div class="artist">${channel}</div>
        `;
        card.onclick = () => playVideo(vId, title, thumb, channel);
        container.appendChild(card);
    });
}

// 4. 搜尋功能 (含儲存機制)
document.getElementById('search-btn').addEventListener('click', async () => {
    const query = document.getElementById('query').value;
    if (!query) return;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${query}&type=video&key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.items) {
            // 儲存搜尋結果
            localStorage.setItem('lastSearch', JSON.stringify(data.items));
            displayMusic(data.items, true);
            document.querySelector('header').innerText = `搜尋結果: ${query}`;
        }
    } catch (e) { console.error("搜尋失敗", e); }
});

// 5. 播放邏輯 (含儲存機制)
function playVideo(id, title, thumb, channel) {
    player.loadVideoById(id);
    
    // 儲存目前播放資訊
    const trackData = { id, title, thumb, channel };
    localStorage.setItem('lastPlayed', JSON.stringify(trackData));
    
    updatePlayerUI(title, thumb, channel);
}

// 更新底部播放器 UI
function updatePlayerUI(title, thumb, channel) {
    document.getElementById('track-title').innerText = title;
    document.getElementById('track-thumb').src = thumb;
    document.getElementById('track-channel').innerText = channel;
}

// 6. 監測播放狀態
function onPlayerStateChange(event) {
    const playBtnIcon = document.getElementById('play-pause-icon');
    
    if (event.data === YT.PlayerState.PLAYING) {
        // 暫停圖標
        playBtnIcon.innerHTML = '<path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>';
        setInterval(updateProgress, 1000);
    } else {
        // 播放圖標
        playBtnIcon.innerHTML = '<path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>';
    }

    // 自動播放下一首 / 重複播放
    if (event.data === YT.PlayerState.ENDED) {
        if (isRepeat) {
            player.playVideo();
        } else {
            playNextRandom();
        }
    }
}

// 隨機播放下一首 (從當前顯示的卡片中挑選)
function playNextRandom() {
    const cards = document.querySelectorAll('.music-card');
    if (cards.length > 0) {
        const randomCard = cards[Math.floor(Math.random() * cards.length)];
        randomCard.click();
    }
}

// 播放/暫停按鈕
document.getElementById('play-pause-btn').addEventListener('click', () => {
    const state = player.getPlayerState();
    state === 1 ? player.pauseVideo() : player.playVideo();
});

// 重複播放切換
document.getElementById('repeat-btn').addEventListener('click', function() {
    isRepeat = !isRepeat;
    this.classList.toggle('active-repeat', isRepeat);
});

// 音量與進度更新
document.getElementById('volume-slider').addEventListener('input', (e) => player.setVolume(e.target.value));

function updateProgress() {
    const curr = player.getCurrentTime();
    const total = player.getDuration();
    if (total > 0) {
        document.getElementById('progress-bar').value = (curr / total) * 100;
        document.getElementById('current-time').innerText = formatTime(curr);
        document.getElementById('duration').innerText = formatTime(total);
    }
}

function formatTime(time) {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' + s : s}`;
}
