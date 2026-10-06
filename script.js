let slideIndex = 0;
let slideInterval;
let audioUnlocked = false;
let audioTriggered = {}; // Penanda agar tidak diputar dobel

document.addEventListener('DOMContentLoaded', () => {
    loadDisplay();
    setInterval(updateClock, 1000);
    setInterval(checkSchedule, 1000); // Cek jadwal adzan/tartil
});

function unlockAudio() {
    audioUnlocked = true;
    document.getElementById('audioUnlock').style.display = 'none';
    // Putar audio kosong untuk bypass browser block
    let a = document.getElementById('audioPlayer');
    a.play().then(() => { a.pause(); });
}

function extractYouTubeId(url) {
    if (!url) return "";
    if (url.length === 11) return url;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : url;
}

function loadDisplay() {
    const data = JSON.parse(localStorage.getItem('masjidSettings')) || defaultSettings();
    const c = data.colors;
    
    // Update Teks
    document.getElementById('mosqueName').innerText = data.mosqueName;
    document.getElementById('mosqueAddress').innerText = data.mosqueAddress;
    document.getElementById('runningText1').innerHTML = '<span>' + data.text1 + '</span>';
    document.getElementById('runningText2').innerHTML = '<span>' + data.text2 + '</span>';

    // Update Warna
    document.getElementById('header').style.background = c.headerBg;
    document.getElementById('header').style.color = c.headerText;

    document.getElementById('runningText1Block').style.background = c.text1Bg;
    document.getElementById('runningText1').style.color = c.text1Color;
    document.getElementById('runningText2Block').style.background = c.text2Bg;
    document.getElementById('runningText2').style.color = c.text2Color;

    // Update Prayer Times (+ Terbit)
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

    // Update Media (Unmute)
    const container = document.getElementById('mediaContainer');
    container.innerHTML = '';
    if (data.mediaType === 'youtube' && data.youtubeLink) {
        const videoId = extractYouTubeId(data.youtubeLink);
        // mute=1 diganti mute=0 agar bersuara
        container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}" frameborder="0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
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
    
    // Jadwal Adzan (kecuali Imsak & Terbit)
    const prayers = [
        {name: 'Subuh', time: pt.subuh},
        {name: 'Dzuhur', time: pt.dzuhur},
        {name: 'Ashar', time: pt.ashar},
        {name: 'Maghrib', time: pt.maghrib},
        {name: 'Isya', time: pt.isya}
    ];

    prayers.forEach(p => {
        if (!p.time) return;
        
        // Hitung waktu tartil
        const [ph, pm] = p.time.split(':').map(Number);
        let totalMin = ph * 60 + pm - tartilMin;
        if (totalMin < 0) totalMin += 24 * 60;
        const th = Math.floor(totalMin / 60);
        const tm = totalMin % 60;
        const tartilTime = `${String(th).padStart(2,'0')}:${String(tm).padStart(2,'0')}`;

        // Trigger Tartil
        if (currentStr === tartilTime && s === '00' && !audioTriggered[p.name + '-tartil']) {
            audioTriggered[p.name + '-tartil'] = true;
            playAudio('tartil.mp3'); // Pastikan file tartil.mp3 ada di github
        }
        
        // Trigger Adzan
        if (currentStr === p.time && s === '00' && !audioTriggered[p.name + '-adzan']) {
            audioTriggered[p.name + '-adzan'] = true;
            playAudio('adzan.mp3'); // Pastikan file adzan.mp3 ada di github
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

// Jadwal Sholat dan Date
setInterval(updateDate, 1000);
updateDate();

function defaultSettings() {
    return {
        mosqueName: "Masjid Raya Al-Muhajirin",
        mosqueAddress: "Banten",
        mediaType: "youtube",
        youtubeLink: "https://www.youtube.com/watch?v=C8kOruMftPo",
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
