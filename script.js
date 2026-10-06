let slideIndex = 0;
let slideInterval;
let audioUnlocked = false;
let audioTriggered = {}; 

document.addEventListener('DOMContentLoaded', () => {
    // CEK LINK ADMIN: Jika ada parameter ?settings= di link, artinya admin mengirim data
    const urlParams = new URLSearchParams(window.location.search);
    const settingsParam = urlParams.get('settings');
    
    if (settingsParam) {
        try {
            // Decode link menjadi data JSON
            let decoded = settingsParam.replace(/-/g, '+').replace(/_/g, '/');
            while (decoded.length % 4) decoded += '=';
            const parsed = JSON.parse(atob(decoded));
            // Simpan ke memori TV/HP ini
            localStorage.setItem('masjidSettings', JSON.stringify(parsed));
            // Hapus parameter link agar tidak menyimpan ulang terus menerus
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch(e) {
            console.error("Gagal parse settings dari link", e);
        }
    }

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

function getYouTubeEmbedUrl(url) {
    if (!url) return "";
    url = url.trim();
    let videoId = null;

    if (url.includes('channel/') && url.includes('/live')) {
        const match = url.match(/channel\/(UC[A-Za-z0-9_-]+)/);
        if (match && match[1]) {
            return `https://www.youtube.com/embed/live_stream?channel=${match[1]}&autoplay=1&mute=0`;
        }
    }
    
    if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split(/[?&/]/)[0];
    } else if (url.includes('watch?v=')) {
        videoId = url.split('watch?v=')[1].split(/[&]/)[0];
    } else if (url.includes('/live/')) {
        videoId = url.split('/live/')[1].split(/[?&/]/)[0];
    } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1].split(/[?&/]/)[0];
    } else if (url.length === 11) {
        videoId = url;
    }

    if (!videoId) {
        const regExp = /(?:v=|be\/|\/live\/|\/embed\/)([^"&?\/\s]{11})/;
        const match = url.match(regExp);
        if (match && match[1].length === 11) videoId = match[1];
    }

    if (videoId && videoId.length === 11) {
        // TAMBAH LOOP & PLAYLIST agar video muter terus
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1&rel=0&loop=1&playlist=${videoId}`;
    }
    return ""; 
}

function loadDisplay() {
    const data = JSON.parse(localStorage.getItem('masjidSettings')) || defaultSettings();
    const c = data.colors;
    
    if (data.backgroundUrl) {
        document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${data.backgroundUrl}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
    } else {
        document.body.style.background = c.mainBg || '#111111';
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
            mainBg: "#111111",
            headerBg:"#1e3c72", headerText:"#ffffff", leftText:"#ffffff",
            imsakBg:"#0f2027", subuhBg:"#203a43", terbitBg:"#2c5364", dzuhurBg:"#0f9b0f", asharBg:"#8e2de2", maghribBg:"#4b6cb7", isyaBg:"#e65c00",
            text1Bg:"#000000", text1Color:"#ffd700", text2Bg:"#1a1a1a", text2Color:"#ffffff"
        }
    };
}
