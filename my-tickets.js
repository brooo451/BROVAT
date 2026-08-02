async function loadUserTickets() {
    const container = document.getElementById('myTicketsContainer');
    if (!container) return;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        container.innerHTML = "<p style='color: #fff; text-align: center; width: 100%; font-size: 18px;'>يجب تسجيل الدخول أولاً لعرض تذاكرك! ⚠️</p>";
        return;
    }

    // جلب التذاكر لوحدها بدون علاقات معقدة
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

    if (error) {
        container.innerHTML = `<p style='color: #ff4757; text-align: center; width: 100%;'>حدث خطأ أثناء تحميل التذاكر: ${error.message}</p>`;
        return;
    }

    container.innerHTML = "";

    if (tickets && tickets.length > 0) {
        for (let ticket of tickets) {
            // جلب بيانات العرض الخاص بكل تذكرة على حدة
            const { data: show } = await supabase
                .from('shows')
                .select('*')
                .eq('id', ticket.show_id)
                .single();

            const showData = show || {};
            const card = document.createElement('div');
            card.style.cssText = "background: rgba(139, 0, 0, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.25); border-radius: 16px; width: 320px; padding: 20px; color: #fff; text-align: right; box-shadow: 0 10px 30px rgba(0,0,0,0.5);";

            const imgHtml = showData.image_url
                ? `<img src="${showData.image_url}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 10px; margin-bottom: 12px;">`
                : '';

            card.innerHTML = `
                ${imgHtml}
                <h3 style="color: #ffcc00; margin-bottom: 10px; font-size: 20px;">🎭 ${showData.title || 'عرض مسرحي'}</h3>
                <p style="font-size: 14px; margin-bottom: 6px;">📅 الميعاد: ${showData.show_time || 'يحدد لاحقاً'}</p>
                <p style="font-size: 14px; margin-bottom: 10px;">📍 المكان: ${showData.location || 'غير محدد'}</p>
                <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px; margin-bottom: 15px; border: 1px dashed rgba(255,255,255,0.3); text-align: center;">
                    <span style="font-size: 12px; display: block; opacity: 0.8;">كود التذكرة الخاص بك:</span>
                    <strong style="font-size: 18px; color: #2ed573; letter-spacing: 2px;">${ticket.ticket_code}</strong>
                </div>
                <button onclick="alert('كود التذكرة الخاص بك هو: ${ticket.ticket_code}\\nاحتفظ به لإظهاره عند دخول المسرح.')" style="background: linear-gradient(45deg, #ff4757, #ff6b81); color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; font-size: 14px;">عرض تفاصيل التذكرة 🎟️</button>
            `;
            container.appendChild(card);
        }
    } else {
        container.innerHTML = "<p style='color: #fff; text-align: center; width: 100%; font-size: 18px;'>ليس لديك أي تذاكر محجوزة حتى الآن. اذهب لصفحة العروض واحجز تذكرتك الأولى! 🎭</p>";
    }
}

window.addEventListener('DOMContentLoaded', () => {
    loadUserTickets();
});