// script.js
let player;
const API_KEY = 'AIzaSyCcXxqOrzFhdn86ftd8J-P-cu1l9tJo5C4'; // <--- 請在此處填入你的 API Key

// 1. 初始化 YouTube 播放器
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '0',
        width: '0',
        videoId: '',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    console.log("Player Ready");
}

// 2. 搜尋功能
document.getElementById('search-btn').addEventListener('click', async () => {
    const query = document.getElementById('query').value;
    if (!query) return;

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${query}&type=video&key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        displayResults(data.items);
    } catch (error) {
        console.error("搜尋出錯:", error);
    }
});

function displayResults(items) {
    const container = document.getElementById('recommendations');
    container.innerHTML = '';
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'music-card';
        card.innerHTML = `
            <img src="${item.snippet.thumbnails.medium.url}">
            <div class="title">${item.snippet.title.substring(0, 20)}...</div>
            <div class="artist" style="color: #b3b3b3; font-size: 12px;">${item.snippet.channelTitle}</div>
        `;
        card.onclick = () => playVideo(item.id.videoId, item.snippet.title, item.snippet.thumbnails.default.url, item.snippet.channelTitle);
        container.appendChild(card);
    });
}

// 3. 播放控制
function playVideo(id, title, thumb, channel) {
    player.loadVideoById(id);
    document.getElementById('track-title').innerText = title;
    document.getElementById('track-thumb').src = thumb;
    document.getElementById('track-channel').innerText = channel;
    document.getElementById('play-pause-btn').innerText = '⏸️';
}

document.getElementById('play-pause-btn').addEventListener('click', () => {
    const state = player.getPlayerState();
    if (state === 1) {
        player.pauseVideo();
        document.getElementById('play-pause-btn').innerText = '▶️';
    } else {
        player.playVideo();
        document.getElementById('play-pause-btn').innerText = '⏸️';
    }
});

// 4. 音量與進度
document.getElementById('volume-slider').addEventListener('input', (e) => {
    player.setVolume(e.target.value);
});

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        setInterval(updateProgress, 1000);
    }
}

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
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}