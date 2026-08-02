// متغير لتخزين رقم واتساب المخرج ورقم العرض الحالي
let currentDirectorPhone = "201015224575";
let selectedShowId = null;

// --- 1. دالة فتح نافذة الحجز وجلب رقم المخرج بدقة ---
async function openBookingModal(showId, directorId) {
    selectedShowId = showId;
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.style.display = 'flex';

        // جلب رقم الهاتف الخاص بالمخرج من جدول users بناءً على الـ director_id
        if (directorId && directorId !== 'undefined' && directorId !== 'null' && directorId !== 'none') {
            const { data: directorData, error } = await supabase
                .from('users')
                .select('phone')
                .eq('id', directorId)
                .single();

            if (directorData && directorData.phone) {
                // تنظيف الرقم وإضافة كود الدولة مصر (20+) لضمان عمل رابط الواتساب بشكل صحيح
                let cleanPhone = directorData.phone.replace(/[^0-9]/g, '');
                if (!cleanPhone.startsWith('20')) {
                    cleanPhone = '20' + cleanPhone;
                }
                currentDirectorPhone = cleanPhone;
            }
        }
    }
}
window.openBookingModal = openBookingModal;

// --- 2. دالة إغلاق النافذة ---
function closeModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.style.display = 'none';
    selectedShowId = null;
}
window.closeModal = closeModal;

// --- 3. دالة الحفظ في جدول tickets وإرسال واتساب للمخرج ---
async function saveBooking() {
    const name = document.getElementById("userName").value.trim();
    const phone = document.getElementById("userPhone").value.trim();
    const count = document.getElementById("ticketCount").value;

    if (!name || !phone || !count) {
        alert("من فضلك املأ جميع البيانات!");
        return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        alert("يجب تسجيل الدخول أولاً لإتمام الحجز! ⚠️");
        window.location.href = "login.html";
        return;
    }

    const ticketCode = "BRV-" + Math.floor(100000 + Math.random() * 900000);

    const { error: dbError } = await supabase.from('tickets').insert([
        {
            show_id: selectedShowId,
            user_id: user.id,
            ticket_code: ticketCode
        }
    ]);

    if (dbError) {
        alert("حدث خطأ أثناء حفظ التذكرة في القاعدة: " + dbError.message);
        return;
    }

    // تنسيق وتشفير رسالة الواتساب بدقة
    const message = `طلب حجز جديد:\nالاسم: ${name}\nرقم الهاتف: ${phone}\nعدد التذاكر: ${count}\nكود التذكرة: ${ticketCode}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${currentDirectorPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    alert(`تم حجز التذكرة بنجاح وتسجيلها في النظام! 🎉\nكود التذكرة: ${ticketCode}`);

    closeModal();

    document.getElementById("userName").value = "";
    document.getElementById("userPhone").value = "";
    document.getElementById("ticketCount").value = "1";
}
window.saveBooking = saveBooking;

// --- 4. دالة جلب وعرض كل العروض المسرحية من Supabase ---
async function loadAllShows() {
    const showsContainer = document.getElementById('showsContainer');
    if (!showsContainer) return;

    const { data: shows, error } = await supabase
        .from('shows')
        .select('*')
        .order('id', { ascending: false });

    if (error || !shows) {
        showsContainer.innerHTML = "<p style='color: #fff; text-align: center; width: 100%;'>لا توجد عروض مسرحية متاحة حالياً.</p>";
        return;
    }

    showsContainer.innerHTML = "";

    if (shows.length > 0) {
        shows.forEach(show => {
            const showCard = document.createElement('div');
            showCard.style.cssText = "background: rgba(139, 0, 0, 0.4); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); border-radius: 15px; width: 300px; padding: 15px; color: #fff; text-align: right;";

            const imgHtml = show.image_url
                ? `<img src="${show.image_url}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 10px; margin-bottom: 10px;">`
                : '';

            showCard.innerHTML = `
                ${imgHtml}
                <h3 style="color: #ffcc00; margin-bottom: 8px; font-size: 18px;">🎭 ${show.title}</h3>
                <p style="font-size: 14px; margin-bottom: 6px; opacity: 0.9;">📝 ${show.description || 'لا توجد تفاصيل'}</p>
                <p style="font-size: 13px; margin-bottom: 4px;">📅 العرض: ${show.show_time || 'يحدد لاحقاً'}</p>
                <p style="font-size: 13px; margin-bottom: 4px;">📍 المكان: ${show.location || 'غير محدد'}</p>
                <p style="font-size: 14px; margin-bottom: 12px; color: #2ed573; font-weight: bold;">💵 السعر: ${show.ticket_price ? show.ticket_price + ' جنيه' : 'مجاني'}</p>
                <button onclick="openBookingModal('${show.id}', '${show.director_id}')" style="background: #ff4757; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; font-size: 14px; transition: 0.3s;">احجز الآن 🎟️</button>
            `;
            showsContainer.appendChild(showCard);
        });
    } else {
        showsContainer.innerHTML = "<p style='color: #fff; text-align: center; width: 100%;'>لا توجد عروض مسرحية حالياً.</p>";
    }
}

// تشغيل جلب العروض تلقائياً عند تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
    loadAllShows();
});