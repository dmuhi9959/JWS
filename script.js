let slideIndex = 0;
let slideInterval;

document.addEventListener('DOMContentLoaded', () => {
    loadDisplay();
    setInterval(updateClock, 1000);
    setInterval(updateDate, 1000);
});

function loadDisplay() {
    const data = JSON.parse(localStorage.getItem('masjidSettings')) || defaultSettings();
    const c = data.colors;
    
    // Update Teks
    document.getElementById('mosqueName').innerText = data.mosqueName;
    document.getElementById('mosqueAddress').innerText = data.mosqueAddress;
    document.getElementById('runningText1').innerHTML = '<span>' + data.text1 + '</span>';
    document.getElementById('runningText2').innerHTML = '<span>' + data.text2 + '</span>';

    // Update Warna Header
    document.getElementById('header').style.background = c.headerBg;
    document.getElementById('header').style.color = c.headerText;

    // Update Warna Jam
    document.getElementById('clock').style.background = c.clockBg;
    document.getElementById('clock').style.color = c.leftText;

    // Update Warna Running Text
    document.getElementById('runningText1Block').style.background = c.text1Bg;
    document.getElementById('runningText1').style.color = c.text1Color;
    document.getElementById('runningText2Block').style.background = c.text2Bg;
    document.getElementById('runningText2').style.color = c.text2Color;

    // Update Prayer Times (Blok Terpisah)
    const pt = data.prayerTimes;
    document.getElementById('prayerTimes').innerHTML = `
        <div class="prayer-block" style="background:${c.imsakBg}; color:${c.leftText}">
            <span>Imsak</span><span>${pt.imsak}</span>
        </div>
        <div class="prayer-block" style="background:${c.subuhBg}; color:${c.leftText}">
            <span>Subuh</span><span>${pt.subuh}</span>
        </div>
        <div class="prayer-block" style="background:${c.dzuhurBg}; color:${c.leftText}">
            <span>Dzuhur</span><span>${pt.dzuhur}</span>
        </div>
        <div class="prayer-block" style="background:${c.asharBg}; color:${c.leftText}">
            <span>Ashar</span><span>${pt.ashar}</span>
        </div>
        <div class="prayer-block" style="background:${c.maghribBg}; color:${c.leftText}">
            <span>Maghrib</span><span>${pt.maghrib}</span>
        </div>
        <div class="prayer-block" style="background:${c.isyaBg}; color:${c.leftText}">
            <span>Isya</span><span>${pt.isya}</span>
        </div>
    `;

    // Update Media
    const container = document.getElementById('mediaContainer');
    container.innerHTML = '';
    if (data.mediaType === 'youtube' && data.youtubeId) {
        container.innerHTML = `<iframe src="https://www.youtube.com/embed/${data.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${data.youtubeId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        clearInterval(slideInterval);
    } else if (data.mediaType === 'slideshow' && data.slides) {
        const images = data.slides.split(',').map(url => url.trim());
        startSlideshow(images);
    }
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
    } catch(e) {
        document.getElementById('hijriDate').innerText = "";
    }
    document.getElementById('gregDate').innerText = gregText;
}

function defaultSettings() {
    return {
        mosqueName: "Masjid Raya Al-Muhajirin",
        mosqueAddress: "Banten",
        mediaType: "youtube",
        youtubeId: "C8kOruMftPo",
        slides: "",
        text1: "Selamat datang di masjid kami.",
        text2: "Jadwal kajian setiap ba'da maghrib.",
        prayerTimes: { imsak:"04:00", subuh:"04:15", dzuhur:"12:00", ashar:"15:00", maghrib:"18:00", isya:"19:00" },
        colors: {
            headerBg:"#1e3c72", headerText:"#ffffff", 
            clockBg:"#2a5298", leftText:"#ffffff",
            imsakBg:"#0f2027", subuhBg:"#203a43", dzuhurBg:"#2c5364", asharBg:"#0f9b0f", maghribBg:"#8e2de2", isyaBg:"#4b6cb7",
            text1Bg:"#000000", text1Color:"#ffd700", 
            text2Bg:"#1a1a1a", text2Color:"#ffffff"
        }
    };
}
