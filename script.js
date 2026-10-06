let slideIndex = 0;
let slideInterval;

document.addEventListener('DOMContentLoaded', () => {
    loadDisplay();
    setInterval(updateClock, 1000);
    setInterval(updateDate, 1000);
});

function loadDisplay() {
    const data = JSON.parse(localStorage.getItem('masjidSettings')) || defaultSettings();
    
    // Update Teks
    document.getElementById('mosqueName').innerText = data.mosqueName;
    document.getElementById('mosqueAddress').innerText = data.mosqueAddress;
    document.getElementById('runningText1').innerHTML = '<span>' + data.text1 + '</span>';
    document.getElementById('runningText2').innerHTML = '<span>' + data.text2 + '</span>';

    // Update Colors
    document.documentElement.style.setProperty('--header-bg', data.colors.headerBg);
    document.documentElement.style.setProperty('--header-text', data.colors.headerText);
    document.getElementById('header').style.background = data.colors.headerBg;
    document.getElementById('header').style.color = data.colors.headerText;

    document.querySelector('.left-panel').style.background = data.colors.leftBg;
    document.querySelector('.left-panel').style.color = data.colors.leftText;

    document.querySelector('footer').style.background = data.colors.footerBg;
    document.querySelector('footer').style.color = data.colors.footerText;

    // Update Prayer Times
    const pt = data.prayerTimes;
    const ptHtml = `
        <div class="prayer-row" id="rImsak"><span>Imsak</span><span>${pt.imsak}</span></div>
        <div class="prayer-row" id="rSubuh"><span>Subuh</span><span>${pt.subuh}</span></div>
        <div class="prayer-row" id="rDzuhur"><span>Dzuhur</span><span>${pt.dzuhur}</span></div>
        <div class="prayer-row" id="rAshar"><span>Ashar</span><span>${pt.ashar}</span></div>
        <div class="prayer-row" id="rMaghrib"><span>Maghrib</span><span>${pt.maghrib}</span></div>
        <div class="prayer-row" id="rIsya"><span>Isya</span><span>${pt.isya}</span></div>
    `;
    document.getElementById('prayerTimes').innerHTML = ptHtml;

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
    slideInterval = setInterval(showNext, 5000); // Ganti tiap 5 detik
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
    // Tanggal Masehi
    const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const gregText = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    
    // Tanggal Hijriyah (Menggunakan API default browser Intl)
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
        youtubeId: "C8kOruMftPo", // Video masjid/streaming bawaan
        slides: "",
        text1: "Selamat datang di masjid kami.",
        text2: "Jadwal kajian setiap ba'da maghrib.",
        prayerTimes: { imsak:"04:00", subuh:"04:15", dzuhur:"12:00", ashar:"15:00", maghrib:"18:00", isya:"19:00" },
        colors: { headerBg:"#1e3c72", headerText:"#ffffff", leftBg:"#2a5298", leftText:"#ffffff", footerBg:"#000000", footerText:"#ffd700" }
    };
}
