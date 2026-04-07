let player;
let isRepeat = false;
const API_KEY = 'AIzaSyCcXxqOrzFhdn86ftd8J-P-cu1l9tJo5C4'; // ⚠️ 請更換成你的 YouTube Data API Key

// 1. 預設推薦音樂 (可自由增減)
const defaultMusic = [
    { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', channel: 'Rick Astley' },
    { id: '9bZkp7q19f0', title: 'GANGNAM STYLE', channel: 'PSY' },
    { id: 'jfKfPfyJRdk', title: 'Lofi Girl Radio', channel: 'Lofi Girl' },
    { id: 'kJQP7kiw5Fk', title: 'Despacito', channel: 'Luis Fonsi' }
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
    displayMusic(defaultMusic);
}

// 3. 渲染音樂卡片
function displayMusic(items, isSearch = false) {
    const container = document.getElementById('recommendations');
    if (isSearch) container.innerHTML = ''; // 如果是搜尋，清空原本內容
    
    items.forEach(item => {
        const vId = isSearch ? item.id.videoId : item.id;
        const snippet = isSearch ? item.snippet : item;
        
        const card = document.createElement('div');
        card.className = 'music-card';
        const thumb = `https://img.youtube.com/vi/${vId}/mqdefault.jpg`;
        
        card.innerHTML = `
            <img src="${thumb}">
            <div class="title">${snippet.title}</div>
            <div class="artist">${snippet.channelTitle || snippet.channel}</div>
        `;
        card.onclick = () => playVideo(vId, snippet.title, thumb, snippet.channelTitle || snippet.channel);
        container.appendChild(card);
    });
}

// 4. 搜尋功能
document.getElementById('search-btn').addEventListener('click', async () => {
    const query = document.getElementById('query').value;
    if (!query) return;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${query}&type=video&key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        displayMusic(data.items, true);
        document.querySelector('header').innerText = `搜尋結果: ${query}`;
    } catch (e) { console.error("搜尋失敗", e); }
});

// 5. 播放邏輯
function playVideo(id, title, thumb, channel) {
    player.loadVideoById(id);
    document.getElementById('track-title').innerText = title;
    document.getElementById('track-thumb').src = thumb;
    document.getElementById('track-channel').innerText = channel;
}

// 監測播放狀態
function onPlayerStateChange(event) {
    const playBtnIcon = document.getElementById('play-pause-icon');
    
    if (event.data === YT.PlayerState.PLAYING) {
        // 切換為暫停圖標 (SVG)
        playBtnIcon.innerHTML = '<path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>';
        setInterval(updateProgress, 1000);
    } else {
        // 切換為播放圖標 (SVG)
        playBtnIcon.innerHTML = '<path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>';
    }

    // 自動播放下一首 / 重複播放
    if (event.data === YT.PlayerState.ENDED) {
        if (isRepeat) {
            player.playVideo();
        } else {
            playNext();
        }
    }
}

function playNext() {
    const next = defaultMusic[Math.floor(Math.random() * defaultMusic.length)];
    playVideo(next.id, next.title, `https://img.youtube.com/vi/${next.id}/mqdefault.jpg`, next.channel);
}

// 播放/暫停按鈕
document.getElementById('play-pause-btn').addEventListener('click', () => {
    const state = player.getPlayerState();
    state === 1 ? player.pauseVideo() : player.playVideo();
});

// 重複播放開關
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
