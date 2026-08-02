// 1. وظيفة الإيموجي (شغالة زي ما هي)
function createEmoji() {
    const emojis = ['🎭', '🎟️', '🎬', '📽️', '✨', '🎫🎫', '🥇', '🎩', '🏛️', '🎗️', '🎈', '🎀', '🎞️'];
    const emoji = document.createElement('div');
    emoji.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.position = 'fixed';
    emoji.style.top = '-50px';
    emoji.style.left = Math.random() * 100 + 'vw';
    emoji.style.fontSize = Math.random() * 20 + 20 + 'px';
    emoji.style.zIndex = '30';
    emoji.style.pointerEvents = 'none';
    document.body.appendChild(emoji);

    const animation = emoji.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(110vh)' }
    ], {
        duration: Math.random() * 2000 + 2000,
        easing: 'linear'
    });

    animation.onfinish = () => emoji.remove();
}

setInterval(createEmoji, 200);

// 2. إصلاح مشكلة الكشاف (flashlight)
const flashlight = document.querySelector('.flashlight');

// إضافة شرط if(flashlight) عشان الكود ميعملش خطأ لو العنصر مش موجود في الصفحة
if (flashlight) {
    document.addEventListener('mousemove', (e) => {
        flashlight.style.background = `radial-gradient(circle 800px at ${e.clientX}px ${e.clientY}px, transparent, rgba(0, 0, 0, 0.10))`;
    });
}