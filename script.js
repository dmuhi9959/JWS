let slideIndex = 0;
let slideInterval;
let audioUnlocked = false;
let audioTriggered = {}; 

document.addEventListener('DOMContentLoaded', () => {
    loadDisplay();
    setInterval(updateClock, 1000);
    setInterval(updateDate, 1000);
    setInterval(checkSchedule, 1000);
});

function unlockAudio() {
    audioUnlocked = true;
    document.getElementById('audioUnlock').style.display = 'none';
    
    let elem = document.documentElement;
    let requestFullscreen = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
    
    if (requestFullscreen) {
        requestFullscreen.call(elem).then(() => {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(e => console.log("Lock orientasi gagal:", e));
            }
        }).catch(e => console.log("Fullscreen gagal:", e));
    }

    let a = document.getElementById('audioPlayer');
    a.play().then(() => { a.pause(); });
}

// FUNGSI BARU: Extract ID dari SEMUA format link YouTube
function getYouTubeEmbedUrl(url) {
    if (!url) return "";
    url = url.trim();
    
    let videoId = null;

    // 1. Cek format youtu.be/ID
    if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split(/[?&/]/)[0];
    }
    // 2. Cek format watch?v=ID
    else if (url.includes('watch?v=')) {
        videoId = url.split('watch?v=')[1].split(/[&]/)[0];
    }
    // 3. Cek format /live/ID (Seperti link yang Anda kirim)
    else if (url.includes('/live/')) {
        videoId = url.split('/live/')[1].split(/[?&/]/)[0];
    }
    // 4. Cek format /embed/ID
    else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1].split(/[?&/]/)[0];
    }
    // 5. Jika user mengetik ID 11 karakter langsung
    else if (url.length === 11) {
        videoId = url;
    }
    // 6. Cek format channel/UCxxxx/live (Live 24 Jam)
    else if (url.includes('channel/') && url.includes('/live')) {
        const match = url.match(/channel\/(UC[A-Za-z0-9_-]+)/);
        if (match && match[1]) {
            return `https://www.youtube.com/embed/live_stream?channel=${match[1]}&autoplay=1&mute=0`;
        }
    }

    // Jika ID berhasil ditemukan (biasanya 11 karakter)
    if (videoId && videoId.length === 11) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1&rel=0`;
    }
    
    // Fallback pakai regex jika semua gagal
    const regExp = /(?:v=|be\/|\/live\/|\/embed\/)([^"&?\/\s]{11})/;
    const match = url.match(regExp);
    if (match && match[1].length === 11) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=0&playsinline=1&rel=0`;
    }

    return ""; // Kembalikan kosong jika tidak valid
}

function loadDisplay() {
    const data = JSON.parse(localStorage.getItem('masjidSettings')) || defaultSettings();
    const c = data.colors;
    
    if (data.backgroundUrl) {
        document.body.style.backgroundImage = `url('${data.backgroundUrl}')`;
    } else {
        document.body.style.backgroundImage = 'none';
    }

    document.getElementById('mosqueName').innerText = data.mosqueName;
    document.getElementById('mosqueAddress').innerText = data.mosqueAddress;
    document.getElementById('runningText1').innerHTML = '<span>' + data.text1 + '</span>';
    document.getElementById('runningText2').innerHTML = '<span>' + data.text2 + '</span>';

    document.getElementById('header').style.background = c.headerBg;
    document.getElementById('header').style.color = c.headerText;

    document.getElementById('runningText1Block').style.background = c.text1Bg;
    document.getElementById('runningText1').style.color = c.text1Color;
    document.getElementById('runningText2Block').style.background = c.text2Bg;
    document.getElementById('runningText2').style.color = c.text2Color;

    const pt = data.prayerTimes;
    document.getElementById('prayerTimes').innerHTML = `
        <div class="prayer-block" style="background:${c.imsakBg}; color:${c.leftText}"><span>Imsak</span><span>${pt.imsak}</span></div>
        <div class="prayer-block" style="background:${c.subuhBg}; color:${c.leftText}"><span>Subuh</span><span>${pt.subuh}</span></div>
        <div class="prayer-block" style="background:${c.terbitBg}; color:${c.leftText}"><span>Terbit</span><span>${pt.terbit}</span></div>
        <div class="prayer-block" style="background:${c.dzuhurBg}; color:${c.leftText}"><span>Dzuhur</span><span>${pt.dzuhur}</span></div>
        <div class="prayer-block" style="background:${c.asharBg}; color:${c.leftText}"><span>Ashar</span><span>${pt.ashar}</span></div>
        <div class="prayer-block" style="background:${c.maghribBg}; color:${c.leftText}"><span>Maghrib</span><span>${pt.maghrib}</span></div>
        <div class="prayer-block" style="background:${c.isyaBg}; color:${c.leftText}"><span>Isya</span><span>${pt.isya}</span></div>
    `;

    const container = document.getElementById('mediaContainer');
    container.innerHTML = '';
    
    if (data.mediaType === 'youtube' && data.youtubeLink) {
        // Gunakan fungsi extract yang baru
        const embedUrl = getYouTubeEmbedUrl(data.youtubeLink);
        
        if (embedUrl) {
            container.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
        }
        clearInterval(slideInterval);
    } else if (data.mediaType === 'slideshow' && data.slides) {
        const images = data.slides.split(',').map(url => url.trim());
        startSlideshow(images);
    }
}

function checkSchedule() {
    if(!audioUnlocked) return;
    const data = JSON.parse(localStorage.getItem('masjidSettings')) || defaultSettings();
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const currentStr = `${h}:${m}`;
    
    const pt = data.prayerTimes;
    const tartilMin = data.tartilMinutes || 5;
    
    const prayers = [
        {name: 'Subuh', time: pt.subuh},
        {name: 'Dzuhur', time: pt.dzuhur},
        {name: 'Ashar', time: pt.ashar},
        {name: 'Maghrib', time: pt.maghrib},
        {name: 'Isya', time: pt.isya}
    ];

    prayers.forEach(p => {
        if (!p.time) return;
        
        const [ph, pm] = p.time.split(':').map(Number);
        let totalMin = ph * 60 + pm - tartilMin;
        if (totalMin < 0) totalMin += 24 * 60;
        const th = Math.floor(totalMin / 60);
        const tm = totalMin % 60;
        const tartilTime = `${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}`;

        if (currentStr === tartilTime && s === '00' && !audioTriggered[p.name + '-tartil']) {
            audioTriggered[p.name + '-tartil'] = true;
            playAudio('tartil.mp3'); 
        }
        
        if (currentStr === p.time && s === '00' && !audioTriggered[p.name + '-adzan']) {
            audioTriggered[p.name + '-adzan'] = true;
            playAudio('adzan.mp3'); 
        }
    });
}

function playAudio(file) {
    const a = document.getElementById('audioPlayer');
    a.src = file;
    a.play().catch(e => console.log("Error play audio:", e));
}

function startSlideshow(images) {
    const container = document.getElementById('mediaContainer');
    function showNext() {
        container.innerHTML = `<img src="${images[slideIndex]}" alt="Slideshow">`;
        slideIndex = (slideIndex + 1) % images.length;
    }
    showNext();
    clearInterval(slideInterval);
    slideInterval = setInterval(showNext, 5000);
}

function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').innerText = `${h}:${m}:${s}`;
}

function updateDate() {
    const now = new Date();
    const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const gregText = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    
    try {
        const hijriFormatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' });
        const hijriText = hijriFormatter.format(now) + " H";
        document.getElementById('hijriDate').innerText = hijriText;
    } catch(e) { document.getElementById('hijriDate').innerText = ""; }
    document.getElementById('gregDate').innerText = gregText;
}

function defaultSettings() {
    return {
        mosqueName: "Masjid Raya Al-Muhajirin",
        mosqueAddress: "Banten",
        backgroundUrl: "",
        mediaType: "youtube",
        youtubeLink: "https://www.youtube.com/live/LauWgjH9zog",
        slides: "",
        text1: "Selamat datang di masjid kami.",
        text2: "Jadwal kajian setiap ba'da maghrib.",
        tartilMinutes: 5,
        prayerTimes: { imsak:"04:00", subuh:"04:15", terbit:"05:30", dzuhur:"12:00", ashar:"15:00", maghrib:"18:00", isya:"19:00" },
        colors: {
            headerBg:"#1e3c72", headerText:"#ffffff", leftText:"#ffffff",
            imsakBg:"#0f2027", subuhBg:"#203a43", terbitBg:"#2c5364", dzuhurBg:"#0f9b0f", asharBg:"#8e2de2", maghribBg:"#4b6cb7", isyaBg:"#e65c00",
            text1Bg:"#000000", text1Color:"#ffd700", text2Bg:"#1a1a1a", text2Color:"#ffffff"
        }
    };
}
