// ==================== 0. تهيئة الاتصال بـ Supabase بدون تعارض ====================
const supabaseUrl = 'https://dfoqxztjsienubxqpdez.supabase.co';
const supabaseKey = 'sb_publishable_oQOLSbEI8mE9yvwtJ6SmWA_wIEOOYoq';

// استخدام supabase المعرف في النظام العام لمنع أي تعارض
const dbClient = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(supabaseUrl, supabaseKey)
    : (window.supabase || null);

// ==================== 1. القائمة الجانبية (Sidebar) ====================
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const sideMenu = document.getElementById('sideMenu');

    if (menuBtn && sideMenu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sideMenu.classList.toggle('active');
        });

        const menuLinks = sideMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                sideMenu.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!sideMenu.contains(e.target) && !menuBtn.contains(e.target)) {
                sideMenu.classList.remove('active');
            }
        });
    }
});

// ==================== 2. زر لوحة التحكم للأدمن ====================
document.addEventListener('DOMContentLoaded', async () => {
    const adminEmail = "mamabb@gmail.com";
    const activeSupabase = window.supabase;

    if (activeSupabase && activeSupabase.auth) {
        const { data: sessionData } = await activeSupabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (user && user.email === adminEmail) {
            const sideMenuUl = document.querySelector('.side-menu ul');
            if (sideMenuUl) {
                if (!document.getElementById('adminMenuLink')) {
                    const adminLi = document.createElement('li');
                    adminLi.innerHTML = `
                        <a href="admin.html" id="adminMenuLink" class="menu-link" style="color: #ff4757; font-weight: bold;">
                            <span class="menu-icon">🛡️</span>
                            <span>لوحة التحكم</span>
                        </a>
                    `;
                    sideMenuUl.appendChild(adminLi);
                }
            }
        }
    }
});

// ==================== 3. تفعيل شارات وأيموجي الباقات ====================
document.addEventListener('DOMContentLoaded', async () => {
    const activeSupabase = window.supabase;
    if (!activeSupabase || !activeSupabase.auth) return;

    const { data: sessionData } = await activeSupabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) return;

    const { data: sub } = await activeSupabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

    if (sub) {
        let badgeEmoji = "⭐";
        const planName = sub.plan_name.toLowerCase();

        if (planName.includes('النجم') || planName.includes('star')) {
            badgeEmoji = "🌟";
        } else if (planName.includes('المخرج') || planName.includes('director')) {
            badgeEmoji = "🎬";
        } else if (planName.includes('vip') || planName.includes('عاشق')) {
            badgeEmoji = "⭐";
        } else if (planName.includes('الداعم') || planName.includes('gold')) {
            badgeEmoji = "🎭";
        }

        const userNameElements = document.querySelectorAll('.user-name, #profileName, .username');
        userNameElements.forEach(el => {
            if (!el.innerHTML.includes(badgeEmoji)) {
                el.innerHTML += ` <span title="اشتراك مفعل: ${sub.plan_name}" style="cursor: pointer;">${badgeEmoji}</span>`;
            }
        });

        window.userSubscription = {
            isSubscribed: true,
            plan: sub.plan_name,
            badge: badgeEmoji
        };
    } else {
        window.userSubscription = { isSubscribed: false };
    }
});

function checkUploadPermission() {
    if (window.userSubscription && window.userSubscription.isSubscribed) {
        return true;
    } else {
        alert("هذه الميزة متاحة لأصحاب الباقات المدفوعة فقط. اشترك الآن لتستمتع بكل المميزات! 🚀");
        window.location.href = "subscriptions.html";
        return false;
    }
}

// ==================== 4. رابط "سجل في البروفا" في القائمة ====================
window.addEventListener('DOMContentLoaded', () => {
    const sideMenuUl = document.querySelector('.side-menu ul');
    if (sideMenuUl) {
        if (!sideMenuUl.innerHTML.includes('logn.html')) {
            const loginLi = document.createElement('li');
            loginLi.innerHTML = `<a href="logn.html" class="menu-link" style="color: #ff4757; font-weight: bold;">سجل في البروفا 🌟</a>`;
            sideMenuUl.prepend(loginLi);
        }
    }
});

// ==================== 5. نظام الإشعارات المتطور والموحد ====================
window.sendNotification = async function (postOwnerId, actorId, actorName, actorAvatar, actionType, postId) {
    const activeSupabase = window.supabase;
    if (!activeSupabase || !activeSupabase.auth) return;

    const { data: { user } } = await activeSupabase.auth.getUser();
    if (user && user.id === postOwnerId) return;

    const { error } = await activeSupabase
        .from('notifications')
        .insert([{
            user_id: postOwnerId,
            actor_id: actorId,
            actor_name: actorName,
            actor_avatar: actorAvatar,
            action_type: actionType,
            post_id: postId
        }]);

    if (error) console.error("خطأ في إرسال الإشعار:", error.message);
};

// ==================== دالة جلب وعرض الإشعارات في صفحة notifications.html ====================
async function loadUserNotifications() {
    const listContainer = document.getElementById('notificationsList');
    if (!listContainer) return;

    const activeSupabase = window.supabase;
    if (!activeSupabase || !activeSupabase.auth) {
        listContainer.innerHTML = `<div style="color: #ff4757; text-align: center;">خطأ: لم يتم تحميل Supabase</div>`;
        return;
    }

    const { data: { user }, error: authError } = await activeSupabase.auth.getUser();
    if (authError || !user) {
        listContainer.innerHTML = `<div style="color: #ff4757; text-align: center; padding: 15px;">يجب تسجيل الدخول أولاً لعرض الإشعارات!</div>`;
        return;
    }

    const { data: notifications, error } = await activeSupabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("خطأ في جلب الإشعارات:", error.message);
        listContainer.innerHTML = `<div style="color: #ff4757; text-align: center;">خطأ في تحميل الإشعارات</div>`;
        return;
    }

    if (!notifications || notifications.length === 0) {
        listContainer.innerHTML = `<div style="color: #aaa; text-align: center; padding: 20px;">لا توجد إشعارات حتى الآن 📭</div>`;
        return;
    }

    let html = "";
    notifications.forEach(notif => {
        const avatar = notif.actor_avatar || 'img/default-avatar.png';
        let actionText = "";
        let clickAction = "";

        if (notif.action_type === 'like') {
            actionText = "قام بالاعجاب بمنشورك ❤️";
            clickAction = `window.location.href='next.html#post-${notif.post_id}'`;
        } else if (notif.action_type === 'comment') {
            actionText = "قام بالتعليق على منشورك 💬";
            clickAction = `window.location.href='next.html#post-${notif.post_id}'`;
        } else if (notif.action_type === 'follow' || (notif.message && notif.message.includes('متابعتك'))) {
            actionText = "قام بمتابعتك! 🌟";
            clickAction = `window.location.href='user-profile.html?id=${notif.actor_id}'`;
        } else {
            actionText = notif.message || "تفاعل معك 🔔";
            clickAction = notif.actor_id ? `window.location.href='user-profile.html?id=${notif.actor_id}'` : `void(0)`;
        }

        const actorName = notif.actor_name || "مستخدم";

        html += `
            <div onclick="${clickAction}" style="
                display: flex;
                align-items: center;
                background: rgba(20, 0, 0, 0.95);
                border: 1px solid rgba(255,255,255,0.15);
                padding: 12px 15px;
                border-radius: 12px;
                backdrop-filter: blur(10px);
                margin-bottom: 10px;
                cursor: pointer;
                transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,71,87,0.2)'" onmouseout="this.style.background='rgba(20, 0, 0, 0.95)'">
                
                <img src="${avatar}" onclick="event.stopPropagation(); ${notif.actor_id ? `window.location.href='user-profile.html?id=${notif.actor_id}'` : ''}" style="
                    width: 40px; 
                    height: 40px; 
                    border-radius: 50%; 
                    object-fit: cover; 
                    margin-left: 12px; 
                    cursor: pointer;
                    border: 2px solid #ff4757;
                " title="زيارة البروفايل">

                <div style="flex-grow: 1; text-align: right;">
                    <div style="font-weight: bold; font-size: 14px; color: #fff;">${actorName}</div>
                    <div style="font-size: 12px; color: #ffcc00; margin-top: 2px;">${actionText}</div>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", () => {
    loadUserNotifications();
});

// دالة فتح الصورة بحجم كبير
function openImageModal(imgSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImageContent');
    if (modal && modalImg) {
        modalImg.src = imgSrc;
        modal.style.display = 'flex';
    }
}
window.openImageModal = openImageModal;

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
window.closeImageModal = closeImageModal;

window.addEventListener('click', (event) => {
    const modal = document.getElementById('imageModal');
    if (event.target === modal) {
        closeImageModal();
    }
});

// فحص الإشعارات الجديدة لعرض النقطة الحمراء
async function checkNewFollowNotifications() {
    const activeSupabase = window.supabase;
    if (!activeSupabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { count } = await activeSupabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action_type', 'follow');

    const badge = document.getElementById('followersBadge');
    if (badge) {
        badge.style.display = (count && count > 0) ? 'inline-block' : 'none';
    }
}
document.addEventListener("DOMContentLoaded", checkNewFollowNotifications);

// --- نافذة عرض قائمة المتابعين أو من يتابعهم ---
// --- نافذة عرض قائمة المتابعين أو من يتابعهم (محدثة لإخفاء النقطة الحمراء عند الفتح) ---
async function openFollowersModal(type) {
    const activeSupabase = window.supabase;
    if (!activeSupabase) {
        alert("مكتبة Supabase غير متصلة!");
        return;
    }

    const modal = document.getElementById('followersModal');
    const titleEl = document.getElementById('followersModalTitle');
    const listContainer = document.getElementById('followersModalList');

    if (!modal) return;

    const urlParams = new URLSearchParams(window.location.search);
    let profileId = urlParams.get('id');

    if (!profileId) {
        const { data: { user } } = await activeSupabase.auth.getUser();
        if (user) profileId = user.id;
    }

    if (!profileId) {
        alert("يجب تسجيل الدخول أولاً!");
        return;
    }

    // --- إخفاء النقطة الحمراء وحذف إشعارات المتابعة من قاعدة البيانات فور الضغط ---
    if (type === 'followers') {
        const badge = document.getElementById('followersBadge');
        if (badge) badge.style.display = 'none';

        const { data: { user } } = await activeSupabase.auth.getUser();
        if (user && profileId === user.id) {
            // حذف أو تحديث إشعارات الفولو عشان ما تظهرش تاني
            await activeSupabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id)
                .eq('action_type', 'follow');
        }
    }

    modal.style.display = 'flex';
    listContainer.innerHTML = `<div style="color: #aaa; text-align: center; padding: 20px;">جاري التحميل...</div>`;

    let userIds = [];

    if (type === 'followers') {
        titleEl.innerText = "المتابعون 🌟";
        const { data } = await activeSupabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', profileId);

        userIds = data ? data.map(item => item.follower_id) : [];
    } else {
        titleEl.innerText = "يتابع 🎭";
        const { data } = await activeSupabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', profileId);

        userIds = data ? data.map(item => item.following_id) : [];
    }

    if (userIds.length === 0) {
        listContainer.innerHTML = `<div style="color: #aaa; text-align: center; padding: 20px;">لا يوجد أحد هنا حتى الآن 📭</div>`;
        return;
    }

    const { data: usersData, error } = await activeSupabase
        .from('users')
        .select('id, nickname, avatar_url, role')
        .in('id', userIds);

    if (error || !usersData || usersData.length === 0) {
        listContainer.innerHTML = `<div style="color: #ff4757; text-align: center; padding: 20px;">خطأ في تحميل البيانات</div>`;
        return;
    }

    let html = "";
    usersData.forEach(u => {
        const avatar = u.avatar_url || 'img/default-avatar.png';
        const name = u.nickname || 'فنان مسرحي';

        html += `
            <div onclick="window.location.href='user-profile.html?id=${u.id}'" style="
                display: flex;
                align-items: center;
                background: rgba(20, 0, 0, 0.9);
                border: 1px solid rgba(255,255,255,0.1);
                padding: 10px 15px;
                border-radius: 12px;
                cursor: pointer;
                transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255,71,87,0.2)'" onmouseout="this.style.background='rgba(20, 0, 0, 0.9)'">
                <img src="${avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-left: 12px; border: 2px solid #ffcc00;">
                <div style="flex-grow: 1;">
                    <div style="font-weight: bold; font-size: 14px; color: #fff;">${name}</div>
                    <div style="font-size: 12px; color: #ffcc00;">${u.role || 'عضو بالفريق'}</div>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

function closeFollowersModal() {
    const modal = document.getElementById('followersModal');
    if (modal) modal.style.display = 'none';
}

window.addEventListener('click', (event) => {
    const modal = document.getElementById('followersModal');
    if (event.target === modal) {
        closeFollowersModal();
    }
});

// --- دالة المتابعة وإرسال الإشعار ---
async function toggleFollow(profileUserId) {
    const activeSupabase = window.supabase;
    if (!activeSupabase || !activeSupabase.auth) return;

    const { data: { user } } = await activeSupabase.auth.getUser();
    if (!user) {
        alert("يجب تسجيل الدخول أولاً للمتابعة! ⚠️");
        window.location.href = "logn.html";
        return;
    }

    if (user.id === profileUserId) {
        alert("لا يمكنك متابعة نفسك! ❌");
        return;
    }

    const followBtn = document.getElementById('followActionBtn');
    const isFollowing = followBtn ? followBtn.getAttribute('data-is-following') === 'true' : false;

    if (isFollowing) {
        const { error } = await activeSupabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', profileUserId);

        if (error) {
            alert("خطأ أثناء إلغاء المتابعة: " + error.message);
        } else {
            if (typeof loadFollowStatusAndCounts === 'function') {
                loadFollowStatusAndCounts(profileUserId);
            }
        }
    } else {
        const { error } = await activeSupabase
            .from('follows')
            .insert([{ follower_id: user.id, following_id: profileUserId }]);

        if (error) {
            alert("خطأ أثناء المتابعة: " + error.message);
        } else {
            const { data: currentUserData } = await activeSupabase
                .from('users')
                .select('nickname, avatar_url')
                .eq('id', user.id)
                .single();

            const followerName = currentUserData ? (currentUserData.nickname || "فنان") : "فنان";
            const followerAvatar = currentUserData ? (currentUserData.avatar_url || 'img/default-avatar.png') : 'img/default-avatar.png';

            const { error: notifError } = await activeSupabase
                .from('notifications')
                .insert([{
                    user_id: profileUserId,
                    actor_id: user.id,
                    actor_name: followerName,
                    actor_avatar: followerAvatar,
                    action_type: 'follow',
                    message: `قام ${followerName} بمتابعتك! 🌟`
                }]);

            if (notifError) {
                console.error("خطأ في إرسال إشعار المتابعة:", notifError.message);
            }

            if (typeof loadFollowStatusAndCounts === 'function') {
                loadFollowStatusAndCounts(profileUserId);
            }
            if (typeof checkNewFollowNotifications === 'function') {
                checkNewFollowNotifications();
            }
        }
    }
}
window.toggleFollow = toggleFollow;
// --- دالة فحص وتحديث العدادات في القائمة الجانبية (Sidebar Badges) ---
// --- دالة تحديث وإنشاء العدادات في القائمة الجانبية تلقائياً ---
// --- دالة تحديث وإنشاء العدادات في القائمة الجانبية تلقائياً ---
async function updateSidebarBadges() {
    const activeSupabase = window.supabase || dbClient;
    if (!activeSupabase || !activeSupabase.auth) return;

    const { data: { user } } = await activeSupabase.auth.getUser();
    if (!user) return;

    // البحث عن روابط القائمة الجانبية بالـ href الخاص بها
    const links = document.querySelectorAll('.side-menu a');

    if (links.length === 0) {
        // لو الـ Sidebar لسه متحملش، نعيد المحاولة بعد نصف ثانية
        setTimeout(updateSidebarBadges, 500);
        return;
    }

    links.forEach(async (link) => {
        const href = link.getAttribute('href');
        let count = 0;
        let badgeId = '';

        try {
            // 1. حساب إشعارات الإشعارات غير المقروءة
            if (href && href.includes('notifications.html')) {
                badgeId = 'notifBadgeCount';
                const { count: unreadNotifs } = await activeSupabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .or('is_read.is.null,is_read.eq.false'); // يدعم لو القيمة false أو null
                count = unreadNotifs || 0;
            }
            // 2. حساب المتابعات الجديدة لملفي الشخصي
            else if (href && href.includes('me.html')) {
                badgeId = 'profileBadgeCount';
                const { count: newFollowers } = await activeSupabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('action_type', 'follow')
                    .or('is_read.is.null,is_read.eq.false');
                count = newFollowers || 0;
            }
            // 3. حساب الرسائل الخاصة
            else if (href && href.includes('messages.html')) {
                badgeId = 'msgBadgeCount';
                const { count: unreadMessages } = await activeSupabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('receiver_id', user.id)
                    .or('is_read.is.null,is_read.eq.false');
                count = unreadMessages || 0;
            }

            if (badgeId) {
                let badge = document.getElementById(badgeId);
                if (!badge) {
                    badge = document.createElement('span');
                    badge.id = badgeId;
                    badge.style.cssText = "background: #ff4757; color: #fff; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 50px; margin-right: auto; margin-left: 10px; display: inline-block;";

                    // ضمان أن الـ link يدعم الفليكس لعرض العنصر في الأقصى
                    link.style.display = 'flex';
                    link.style.alignItems = 'center';
                    link.style.justifyContent = 'space-between';
                    link.appendChild(badge);
                }

                if (count > 0) {
                    badge.innerText = count;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (err) {
            console.error("خطأ في تحديث العدادات للرابط:", href, err);
        }
    });
}

// تشغيل الفحص عند اكتمال التحميل وعند فتح الصفحة
document.addEventListener('DOMContentLoaded', () => {
    updateSidebarBadges();
});
window.addEventListener('load', () => {
    updateSidebarBadges();
});

// تشغيل الفحص أول ما الصفحة تفتح
// تصفير الإشعارات وجعلها مقروءة بمجرد فتح الصفحة
async function markNotificationsAsRead() {
    const activeSupabase = window.supabase || dbClient;
    if (!activeSupabase || !activeSupabase.auth) return;

    const { data: { user } } = await activeSupabase.auth.getUser();
    if (!user) return;

    await activeSupabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
}

document.addEventListener('DOMContentLoaded', () => {
    markNotificationsAsRead();
});
// متغير عام لحالة الأيموجي (يعمل افتراضياً)
window.isEmojisActive = true;
let emojiInterval = null;

// دالة تشغيل وإيقاف الأيموجي
// ==================== زرار تشغيل وإيقاف الأيموجي المتحركة ====================
window.isEmojisActive = true;

function toggleEmojis(checkbox) {
    window.isEmojisActive = checkbox.checked; // true أو false حسب حالة الزرار

    if (!window.isEmojisActive) {
        console.log("تم إيقاف تساقط الأيموجي 🛑");

        // إزالة أي أيموجي نازلة حالياً على الشاشة فوراً
        const fallingElements = document.querySelectorAll('.falling-emoji, .emoji, span[style*="position: fixed"], div[style*="position: fixed"]');
        fallingElements.forEach(el => {
            // للتأكد من حذف عناصر الأيموجي فقط وعدم حذف عناصر الموقع الأساسية
            if (el.innerText && /[\u{1F300}-\u{1F9FF}]/u.test(el.innerText)) {
                el.remove();
            }
        });
    } else {
        console.log("تم تشغيل تساقط الأيموجي 🌟");
    }
}