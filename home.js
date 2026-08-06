





function createEmoji() {
    if (window.isEmojisActive === false) return;
    const emojis = ['🎭', '🎟️', '🎬', '📽️', '✨', '🎫🎫', '🥇', '🎩', '🏛️', '🎗️', '🎈', '🎀', '🎞️'];
    const emoji = document.createElement('div');
    emoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.classList.add('falling-emoji');

    // مكان عشوائي في عرض الشاشة
    emoji.style.left = Math.random() * 100 + 'vw';
    // سرعة عشوائية
    emoji.style.animationDuration = Math.random() * 2 + 2 + 's';

    document.body.appendChild(emoji);

    // حذف الإيموجي بعد انتهاء الحركة لتوفير الذاكرة
    setTimeout(() => {
        emoji.remove();
    }, 5000);
}

// إنشاء إيموجي كل 300 مللي ثانية
setInterval(createEmoji, 200);





