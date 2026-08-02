// --- 1. الدوال المساعدة ---
function translateRole(role) {
    const roles = {
        actor: "ممثل 🎭",
        director: "مخرج 🎬",
        decor: "مهندس ديكور 📐",
        music: "موسيقي 🎵",
        light: "مهندس إضاءة 💡",
        dance: "مصمم استعراضات 💃"
    };
    return roles[role] || role;
}

// دالة مساعدة لجلب شارة التميز حسب نوع الاشتراك
async function getUserBadge(userId) {
    if (!userId || typeof supabase === 'undefined') return "";

    const { data: subData, error } = await supabase
        .from('subscriptions')
        .select('plan_name')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

    if (error || !subData || !subData.plan_name) return "";

    const pName = subData.plan_name.toLowerCase();
    if (pName.includes('النجم') || pName.includes('star')) return ' 🌟';
    if (pName.includes('المخرج') || pName.includes('director')) return ' 🎬';
    if (pName.includes('vip') || pName.includes('عاشق')) return ' ⭐';
    if (pName.includes('الداعم') || pName.includes('gold')) return ' 🎭';

    return " ⭐";
}

// --- 2. الدالة المسؤولة عن تحميل الـ Feed الأساسية ---
async function loadHomeFeed() {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer || typeof supabase === 'undefined') return;

    // إضافة شريط التخصصات للموبايل فقط (أقل من 768px)
    if (window.innerWidth <= 768 && !document.getElementById('mobileDropdownFilter')) {
        const dropdownWrapper = document.createElement('div');
        dropdownWrapper.id = 'mobileDropdownFilter';
        dropdownWrapper.style.cssText = `
            width: 90%;
            max-width: 400px;
            margin: 0 auto 20px auto;
            position: relative;
            z-index: 999;
            text-align: right;
            top:-500px;
        `;

        dropdownWrapper.innerHTML = `
            <button id="dropdownToggleBtn" style="
                width: 100%;
                background: rgba(139, 0, 0, 0.85);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.3);
                padding: 12px 15px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            ">
                <span>التخصصات 🎭</span>
                <span id="arrowIcon" style="transition: transform 0.3s;">▼</span>
            </button>
            <div id="dropdownMenuContent" style="
                display: none;
                position: absolute;
                top: 100%;
                right: 0;
                width: 100%;
                background: rgba(20, 0, 0, 0.95);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 12px;
                margin-top: 5px;
                overflow: hidden;
                box-shadow: 0 5px 15px rgba(0,0,0,0.5);
                backdrop-filter: blur(15px);
                z-index: 1000;
            ">
                <div class="role-option" data-role="all" style="padding: 12px 15px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer;">جميع العروض 🌟</div>
                <div class="role-option" data-role="actor" style="padding: 12px 15px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer;">ممثل 🎭</div>
                <div class="role-option" data-role="director" style="padding: 12px 15px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer;">مخرج 🎬</div>
                <div class="role-option" data-role="decor" style="padding: 12px 15px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer;">مهندس ديكور 📐</div>
                <div class="role-option" data-role="music" style="padding: 12px 15px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer;">موسيقي 🎵</div>
                <div class="role-option" data-role="light" style="padding: 12px 15px; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer;">مهندس إضاءة 💡</div>
                <div class="role-option" data-role="dance" style="padding: 12px 15px; color: #fff; cursor: pointer;">مصمم استعراضات 💃</div>
            </div>
        `;

        feedContainer.parentNode.insertBefore(dropdownWrapper, feedContainer);

        const toggleBtn = document.getElementById('dropdownToggleBtn');
        const menuContent = document.getElementById('dropdownMenuContent');
        const arrowIcon = document.getElementById('arrowIcon');

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = menuContent.style.display === 'block';
            menuContent.style.display = isOpen ? 'none' : 'block';
            arrowIcon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        });

        document.addEventListener('click', () => {
            if (menuContent) {
                menuContent.style.display = 'none';
                if (arrowIcon) arrowIcon.style.transform = 'rotate(0deg)';
            }
        });

        const options = menuContent.querySelectorAll('.role-option');
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                const selectedRole = opt.getAttribute('data-role');
                toggleBtn.querySelector('span:first-child').innerText = opt.innerText;
                menuContent.style.display = 'none';
                arrowIcon.style.transform = 'rotate(0deg)';

                if (selectedRole === 'all') {
                    loadHomeFeed();
                } else {
                    if (typeof filterPostsByRole === 'function') {
                        filterPostsByRole(selectedRole);
                    }
                }
            });
        });
    }

    // 1. جلب كل البوستات من القاعدة
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*');

    if (error) {
        console.error("خطأ في جلب الـ Feed:", error.message);
        return;
    }

    // 2. خلط البوستات عشوائياً
    if (posts && posts.length > 0) {
        for (let i = posts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [posts[i], posts[j]] = [posts[j], posts[i]];
        }
    }

    feedContainer.innerHTML = "";
    feedContainer.style.cssText = "display: flex !important; flex-direction: column !important; align-items: center !important; margin-top: 300px !important; padding: 20px !important; gap: 20px !important;";

    if (posts && posts.length > 0) {
        for (let post of posts) {
            let userName = "فنان مسرحي";
            let userAvatar = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRt6pKH1AW7VC50Kl7C41QB7NOUwD9dyqzHvpF3cra1Sg&s=10";

            if (post.user_id) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('nickname, avatar_url')
                    .eq('id', post.user_id)
                    .single();

                if (userData) {
                    userName = userData.nickname || userName;
                    userAvatar = userData.avatar_url || userAvatar;
                }
            }

            const userBadge = await getUserBadge(post.user_id);
            const displayName = userName + userBadge;

            const likesCount = post.likes_count || 0;

            const { count: commentsCount } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            const totalComments = commentsCount || 0;

            const actionsSection = `
                <div style="display: flex; align-items: center; gap: 20px; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                    <button onclick="handleLike(${post.id}, this)" style="background: none; border: none; color: #ff4757; font-size: 20px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                        ❤️ <span class="like-count" style="font-size: 16px; color: #fff;">${likesCount}</span>
                    </button>
                    <div onclick="openCommentsModal(${post.id})" style="color: #fff; font-size: 18px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                        💬 <span id="comment-count-${post.id}" style="font-size: 16px; font-weight: bold;">${totalComments}</span>
                    </div>
                </div>
            `;

            const postCard = document.createElement('div');
            postCard.className = 'feed-post-card';
            postCard.id = `post-${post.id}`;
            postCard.style.cssText = "position: relative !important; display: block !important; width: 100% !important; max-width: 500px !important; background: rgba(139, 0, 0, 0.4); backdrop-filter: blur(15px); border-radius: 20px; padding: 15px; color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); text-align: right;";

            const header = `
                <div style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;" onclick="goToUserProfile('${post.user_id}')">
                    <img src="${userAvatar}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; margin-left: 12px; border: 2px solid #ff4757; transition: transform 0.2s;" title="زيارة البروفايل">
                    <span style="font-weight: bold; font-size: 18px; color: #fff;" title="زيارة البروفايل">${displayName}</span>
                </div>
            `;

            // معالجة عرض الوسائط مع تفعيل خاصية التكبير للصور
            let mediaContent = "";
            if (post.media_url && post.media_url !== "null" && post.media_url.trim() !== "") {
                const isAudio = post.type === 'audio' || post.media_url.endsWith('.mp3') || post.media_url.endsWith('.wav');
                const isVideo = post.type === 'video' || post.media_url.endsWith('.mp4') || post.media_url.endsWith('.mov');

                if (isAudio) {
                    mediaContent = `
                        <div style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 12px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.1);">
                            <p style="color: #ffcc00; font-size: 14px; margin-bottom: 8px; font-weight: bold;">🎵 تراك موسيقي مسرحي</p>
                            <audio controls src="${post.media_url}" style="width: 100%;"></audio>
                        </div>
                    `;
                } else if (isVideo) {
                    mediaContent = `<video src="${post.media_url}" controls style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px; margin-bottom: 8px;"></video>`;
                } else {
                    // تم إضافة onclick و cursor: zoom-in هنا لتكبير الصورة عند النقر
                    mediaContent = `<img src="${post.media_url}" onclick="openImageModal('${post.media_url}')" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px; margin-bottom: 8px; cursor: zoom-in;" title="اضغط لتكبير الصورة">`;
                }
            }

            const captionText = post.caption ? `<p style="margin-top: 12px; font-size: 15px; line-height: 1.4; word-break: break-word;">${post.caption}</p>` : "";

            postCard.innerHTML = header + mediaContent + captionText + actionsSection;
            feedContainer.appendChild(postCard);
        }
    } else {
        feedContainer.innerHTML = "<p style='text-align: center; color: #fff; font-size: 16px;'>لا توجد عروض أو منشورات مسرحية حتى الآن.</p>";
    }
}
window.loadHomeFeed = loadHomeFeed;

// دالة الانتقال لصفحة المستخدم
function goToUserProfile(targetUserId) {
    if (!targetUserId) return;
    window.location.href = `user-profile.html?id=${targetUserId}`;
}
window.goToUserProfile = goToUserProfile;

// --- 3. نافذة التعليقات المنسدلة (Modal) ---
window.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('commentsModal')) {
        const modalDiv = document.createElement('div');
        modalDiv.id = 'commentsModal';
        modalDiv.style.cssText = `
            display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.8); z-index: 9999; justify-content: center; align-items: center;
            backdrop-filter: blur(8px);
        `;
        modalDiv.innerHTML = `
            <div style="width: 90%; max-width: 450px; height: 75vh; background: rgba(30, 0, 0, 0.95); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; display: flex; flex-direction: column; overflow: hidden;" dir="rtl">
                <div style="padding: 15px; background: rgba(139,0,0,0.8); color: #ffcc00; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
                    <span>التعليقات 💬</span>
                    <button onclick="closeCommentsModal()" style="background:none; border:none; color:#fff; font-size:18px; cursor:pointer;">✕</button>
                </div>
                <div id="modalCommentsList" style="flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                    <div style="color: #aaa; text-align: center; margin: auto;">جاري تحميل التعليقات...</div>
                </div>
                <div style="padding: 12px; background: rgba(20,0,0,0.9); display: flex; gap: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <input type="text" id="modalCommentInput" placeholder="اكتب تعليقاً..." style="flex:1; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.4); color: #fff; outline: none; text-align: right;" onkeypress="if(event.key === 'Enter') sendModalComment()">
                    <button onclick="sendModalComment()" style="padding: 10px 18px; background: #ff4757; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">تعليق</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalDiv);
    }
});

let currentPostIdForComments = null;

async function openCommentsModal(postId) {
    currentPostIdForComments = postId;
    const modal = document.getElementById('commentsModal');
    if (modal) modal.style.display = 'flex';
    fetchModalComments(postId);
}
window.openCommentsModal = openCommentsModal;

function closeCommentsModal() {
    const modal = document.getElementById('commentsModal');
    if (modal) modal.style.display = 'none';
    currentPostIdForComments = null;
}
window.closeCommentsModal = closeCommentsModal;

async function fetchModalComments(postId) {
    const container = document.getElementById('modalCommentsList');
    if (!container || typeof supabase === 'undefined') return;

    container.innerHTML = `<div style="color: #aaa; text-align: center; margin: auto;">جاري تحميل التعليقات...</div>`;

    const { data: postInfo } = await supabase.from('posts').select('user_id').eq('id', postId).maybeSingle();
    const postOwnerId = postInfo ? postInfo.user_id : null;

    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user ? user.id : null;

    const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', String(postId));

    if (error) {
        container.innerHTML = `<div style="color: #ff4757; text-align: center; margin: auto;">حدث خطأ في تحميل التعليقات</div>`;
        return;
    }

    if (!comments || comments.length === 0) {
        container.innerHTML = `<div style="color: #aaa; text-align: center; margin: auto;">لا توجد تعليقات حتى الآن، كن أول المعلقين! 🎭</div>`;
        return;
    }

    let html = "";
    for (let c of comments) {
        let commenterName = "فنان";
        const { data: userData } = await supabase
            .from('users')
            .select('nickname')
            .eq('id', c.user_id)
            .maybeSingle();

        if (userData && userData.nickname) {
            commenterName = userData.nickname;
        }

        const commentBadge = await getUserBadge(c.user_id);
        const commenterDisplayName = commenterName + commentBadge;

        const isCommentOwner = currentUserId && c.user_id === currentUserId;
        const isPostOwner = currentUserId && postOwnerId === currentUserId;

        let actionsHtml = "";
        if (isCommentOwner || isPostOwner) {
            actionsHtml += `<div style="display: flex; gap: 10px; font-size: 12px; margin-top: 5px;">`;
            if (isCommentOwner) {
                actionsHtml += `<span onclick="editComment('${c.id}', \`${encodeURIComponent(c.comment)}\`)" style="color: #ffcc00; cursor: pointer;">تعديل ✏️</span>`;
            }
            if (isCommentOwner || isPostOwner) {
                actionsHtml += `<span onclick="deleteComment('${c.id}', ${postId})" style="color: #ff4757; cursor: pointer;">حذف 🗑️</span>`;
            }
            actionsHtml += `</div>`;
        }

        html += `
            <div id="comment-row-${c.id}" style="background: rgba(255,255,255,0.07); padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); text-align: right;">
                <div style="font-size: 13px; color: #ffcc00; font-weight: bold; margin-bottom: 4px;">${commenterDisplayName}</div>
                <div id="comment-text-${c.id}" style="font-size: 14px; color: #fff; word-break: break-word;">${c.comment}</div>
                ${actionsHtml}
            </div>
        `;
    }
    container.innerHTML = html;
}
window.fetchModalComments = fetchModalComments;

async function deleteComment(commentId, postId) {
    if (!confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;

    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

    if (!error) {
        fetchModalComments(postId);
        const { count: newTotalComments } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', String(postId));

        const countSpan = document.getElementById(`comment-count-${postId}`);
        if (countSpan) countSpan.innerText = newTotalComments || 0;
    } else {
        alert("تعذر حذف التعليق: " + error.message);
    }
}
window.deleteComment = deleteComment;

function editComment(commentId, encodedText) {
    const currentText = decodeURIComponent(encodedText);
    const textContainer = document.getElementById(`comment-text-${commentId}`);
    if (!textContainer) return;

    textContainer.innerHTML = `
        <div style="display: flex; gap: 5px; margin-top: 5px;">
            <input type="text" id="edit-input-${commentId}" value="${currentText}" style="flex: 1; padding: 5px; border-radius: 5px; border: 1px solid #ffcc00; background: rgba(0,0,0,0.5); color: #fff; outline: none; font-size: 14px;">
            <button onclick="saveEditedComment('${commentId}', ${currentPostIdForComments})" style="padding: 5px 10px; background: #ffcc00; color: #000; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 12px;">حفظ</button>
            <button onclick="fetchModalComments(${currentPostIdForComments})" style="padding: 5px 10px; background: #555; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">إلغاء</button>
        </div>
    `;
}
window.editComment = editComment;

async function saveEditedComment(commentId, postId) {
    const input = document.getElementById(`edit-input-${commentId}`);
    if (!input) return;

    const newText = input.value.trim();
    if (!newText) {
        alert("لا يمكن أن يكون التعليق فارغاً!");
        return;
    }

    const { error } = await supabase
        .from('comments')
        .update({ comment: newText })
        .eq('id', commentId);

    if (!error) {
        fetchModalComments(postId);
    } else {
        alert("تعذر تعديل التعليق: " + error.message);
    }
}
window.saveEditedComment = saveEditedComment;

async function sendModalComment() {
    const input = document.getElementById('modalCommentInput');
    const commentText = input.value.trim();
    if (!commentText || !currentPostIdForComments) return;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        alert("يجب تسجيل الدخول أولاً لكتابة تعليق!");
        return;
    }

    const { data: postDataInfo } = await supabase.from('posts').select('user_id').eq('id', currentPostIdForComments).single();

    const { error } = await supabase
        .from('comments')
        .insert([{
            post_id: currentPostIdForComments,
            user_id: user.id,
            comment: commentText
        }]);

    if (!error) {
        input.value = "";
        fetchModalComments(currentPostIdForComments);

        const { count: newTotalComments } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', currentPostIdForComments);

        const countSpan = document.getElementById(`comment-count-${currentPostIdForComments}`);
        if (countSpan) countSpan.innerText = newTotalComments || 0;

        if (postDataInfo) {
            const { data: currentUserData } = await supabase.from('users').select('nickname, avatar_url').eq('id', user.id).single();
            if (currentUserData) {
                window.sendNotification(
                    postDataInfo.user_id,
                    user.id,
                    currentUserData.nickname || 'فنان',
                    currentUserData.avatar_url || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRt6pKH1AW7VC50Kl7C41QB7NOUwD9dyqzHvpF3cra1Sg&s=10',
                    'comment',
                    currentPostIdForComments
                );
            }
        }
    }
}
window.sendModalComment = sendModalComment;

// --- 4. دالة إرسال الإشعارات ---
window.sendNotification = async function (postOwnerId, actorId, actorName, actorAvatar, actionType, postId) {
    if (typeof supabase === 'undefined') return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === postOwnerId) return;

    const { error } = await supabase
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

// --- 5. دالة تفاعل اللايك ---
async function handleLike(postId, btnElement) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        alert("يجب تسجيل الدخول أولاً لتسجيل الإعجاب!");
        return;
    }

    const currentUserId = user.id;
    const countSpan = btnElement.querySelector('.like-count');

    const { data: postDataInfo } = await supabase.from('posts').select('user_id, likes_count').eq('id', postId).single();
    if (!postDataInfo) return;

    const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', currentUserId)
        .maybeSingle();

    if (checkError) return;

    let newLikesCount = 0;

    if (existingLike) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUserId);
        newLikesCount = Math.max(0, (postDataInfo.likes_count || 1) - 1);
        countSpan.innerText = newLikesCount;
    } else {
        await supabase.from('likes').insert([{ post_id: postId, user_id: currentUserId }]);
        newLikesCount = (postDataInfo.likes_count || 0) + 1;
        countSpan.innerText = newLikesCount;

        const { data: currentUserData } = await supabase.from('users').select('nickname, avatar_url').eq('id', currentUserId).single();
        if (currentUserData) {
            window.sendNotification(
                postDataInfo.user_id,
                currentUserId,
                currentUserData.nickname || 'فنان',
                currentUserData.avatar_url || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRt6pKH1AW7VC50Kl7C41QB7NOUwD9dyqzHvpF3cra1Sg&s=10',
                'like',
                postId
            );
        }
    }

    await supabase.from('posts').update({ likes_count: newLikesCount }).eq('id', postId);
}
window.handleLike = handleLike;

// --- 6. زر الإضافة العائم وعناصر القائمة ---
window.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('floatingAddBtn')) {
        const floatBtn = document.createElement('a');
        floatBtn.id = 'floatingAddBtn';
        floatBtn.href = 'me.html';
        floatBtn.innerHTML = '➕';
        floatBtn.style.cssText = `
            position: fixed; bottom: 30px; left: 30px; width: 60px; height: 60px;
            background: #ff4757; color: #fff; border-radius: 50%; display: flex;
            align-items: center; justify-content: center; font-size: 28px;
            text-decoration: none; box-shadow: 0 4px 20px rgba(255, 71, 87, 0.4);
            z-index: 1000; transition: transform 0.3s ease, background 0.3s ease;
        `;
        document.body.appendChild(floatBtn);
    }

    loadHomeFeed();
});

// --- 7. البحث الحي (Live Search) ---
async function searchUsersLive() {
    const query = document.getElementById('userSearchInput').value.trim();
    const dropdown = document.getElementById('searchResultsDropdown');

    if (!dropdown) return;

    if (query === "") {
        dropdown.style.display = "none";
        dropdown.innerHTML = "";
        return;
    }

    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, nickname, role, avatar_url')
            .ilike('nickname', `%${query}%`)
            .limit(5);

        if (error) return;

        if (!users || users.length === 0) {
            dropdown.style.display = "block";
            dropdown.innerHTML = `<div style="padding: 12px; color: #aaa; text-align: center;">لا يوجد نتائج مطابقة 🔍</div>`;
            return;
        }

        let html = "";
        users.forEach(user => {
            const userAvatar = user.avatar_url || 'img/default-avatar.png';
            const userRole = user.role || 'عضو';

            html += `
                <div onclick="goToProfile('${user.id}')" style="
                    display: flex; align-items: center; padding: 10px 15px;
                    border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; background: rgba(20, 0, 0, 0.95);
                " onmouseover="this.style.background='rgba(255,71,87,0.3)'" onmouseout="this.style.background='rgba(20, 0, 0, 0.95)'">
                    <img src="${userAvatar}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; margin-left: 10px;">
                    <div>
                        <div style="color: #fff; font-weight: bold; font-size: 13px;">${user.nickname}</div>
                        <div style="color: #ffcc00; font-size: 10px;">${userRole}</div>
                    </div>
                </div>
            `;
        });

        dropdown.innerHTML = html;
        dropdown.style.display = "block";
    } catch (err) {
        console.error("حدث خطأ غير متوقع:", err);
    }
}
window.searchUsersLive = searchUsersLive;

function goToProfile(userId) {
    window.location.href = `user-profile.html?id=${userId}`;
}
window.goToProfile = goToProfile;

async function filterPostsByRole(selectedRole) {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer || typeof supabase === 'undefined') return;

    feedContainer.style.cssText = "display: flex !important; flex-direction: column !important; align-items: center !important; margin-top: 250px !important; padding: 20px !important; gap: 20px !important;";
    feedContainer.innerHTML = "<p style='text-align: center; color: #fff; width: 100%;'>جاري تصفية العروض...</p>";

    const client = window.supabaseClient || window.supabase;

    const { data: usersWithRole, error: userError } = await client
        .from('users')
        .select('id, nickname, avatar_url')
        .eq('role', selectedRole);

    if (userError || !usersWithRole || usersWithRole.length === 0) {
        feedContainer.innerHTML = "<p style='text-align: center; color: rgba(255,255,255,0.6); width: 100%;'>لا توجد منشورات لهذا التخصص حالياً.</p>";
        return;
    }

    const userIds = usersWithRole.map(u => u.id);

    const { data: posts, error: postError } = await client
        .from('posts')
        .select('*')
        .in('user_id', userIds)
        .order('id', { ascending: false });

    feedContainer.innerHTML = "";

    if (postError || !posts || posts.length === 0) {
        feedContainer.innerHTML = "<p style='text-align: center; color: rgba(255,255,255,0.6); width: 100%;'>لا توجد منشورات لهذا التخصص حالياً.</p>";
        return;
    }

    for (let post of posts) {
        const postOwner = usersWithRole.find(u => u.id === post.user_id);
        const nickname = postOwner ? postOwner.nickname : 'فنان';
        const userAvatar = postOwner && postOwner.avatar_url ? postOwner.avatar_url : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRt6pKH1AW7VC50Kl7C41QB7NOUwD9dyqzHvpF3cra1Sg&s=10";

        const likesCount = post.likes_count || 0;

        const { count: commentsCount } = await client
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

        const totalComments = commentsCount || 0;

        const actionsSection = `
            <div style="display: flex; align-items: center; gap: 20px; margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                <button onclick="handleLike(${post.id}, this)" style="background: none; border: none; color: #ff4757; font-size: 20px; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                    ❤️ <span class="like-count" style="font-size: 16px; color: #fff;">${likesCount}</span>
                </button>
                <div onclick="openCommentsModal(${post.id})" style="color: #fff; font-size: 18px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                    💬 <span id="comment-count-${post.id}" style="font-size: 16px; font-weight: bold;">${totalComments}</span>
                </div>
            </div>
        `;

        const postCard = document.createElement('div');
        postCard.className = 'feed-post-card';
        postCard.id = `post-${post.id}`;
        postCard.style.cssText = "position: relative !important; display: block !important; width: 100% !important; max-width: 500px !important; background: rgba(139, 0, 0, 0.4); backdrop-filter: blur(15px); border-radius: 20px; padding: 15px; color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); text-align: right;";

        const header = `
            <div style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;" onclick="goToUserProfile('${post.user_id}')">
                <img src="${userAvatar}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; margin-left: 12px; border: 2px solid #ff4757;">
                <span style="font-weight: bold; font-size: 18px; color: #fff;">${nickname}</span>
            </div>
        `;

        let mediaContent = "";
        if (post.media_url && post.media_url !== "null" && post.media_url.trim() !== "") {
            const isAudio = post.type === 'audio' || post.media_url.endsWith('.mp3') || post.media_url.endsWith('.wav');
            const isVideo = post.type === 'video' || post.media_url.endsWith('.mp4') || post.media_url.endsWith('.mov');

            if (isAudio) {
                mediaContent = `
                    <div style="background: rgba(0,0,0,0.4); padding: 12px; border-radius: 12px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.1);">
                        <p style="color: #ffcc00; font-size: 14px; margin-bottom: 8px; font-weight: bold;">🎵 تراك موسيقي مسرحي</p>
                        <audio controls src="${post.media_url}" style="width: 100%;"></audio>
                    </div>
                `;
            } else if (isVideo) {
                mediaContent = `<video src="${post.media_url}" controls style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px; margin-bottom: 8px;"></video>`;
            } else {
                mediaContent = `<img src="${post.media_url}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px; margin-bottom: 8px;">`;
            }
        }

        const captionText = post.caption ? `<p style="margin-top: 12px; font-size: 15px; line-height: 1.4; word-break: break-word;">${post.caption}</p>` : "";

        postCard.innerHTML = header + mediaContent + captionText + actionsSection;
        feedContainer.appendChild(postCard);
    }
}
window.filterPostsByRole = filterPostsByRole;

window.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash) {
        const checkAndScroll = () => {
            const targetElement = document.querySelector(window.location.hash);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetElement.style.transition = "border 0.3s ease";
                targetElement.style.border = "3px solid #ffcc00";

                setTimeout(() => {
                    targetElement.style.border = "1px solid rgba(255, 255, 255, 0.2)";
                }, 4000);
                return true;
            }
            return false;
        };

        if (!checkAndScroll()) {
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (checkAndScroll() || attempts > 15) {
                    clearInterval(interval);
                }
            }, 300);
        }
    }
});

// دالة نشر التراكات للموسيقيين فقط
async function createAudioPost() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        alert("يجب تسجيل الدخول أولاً للنشر! ⚠️");
        window.location.href = "logn.html";
        return;
    }

    const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userFetchError || !userData || userData.role !== 'music') {
        alert("عذراً، قسم نشر التراكات الصوتيّة مخصص للموسيقيين فقط 🎵!");
        return;
    }

    const captionText = document.getElementById('postCaption')?.value.trim();
    const audioInput = document.getElementById('audioUploadInput');
    const file = audioInput ? audioInput.files[0] : null;

    if (!file) {
        alert("يرجى اختيار ملف صوتي (تراك) لنشره!");
        return;
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `tracks/${user.id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, file);
    if (uploadError) {
        alert("خطأ في رفع التراك: " + uploadError.message);
        return;
    }

    const { data: pubData } = supabase.storage.from('posts').getPublicUrl(filePath);
    const audioUrl = pubData.publicUrl;

    const userBadge = localStorage.getItem('userBadge') || '';

    const { error: dbError } = await supabase.from('posts').insert([{
        user_id: user.id,
        media_url: audioUrl,
        type: 'audio',
        caption: captionText || "تراك موسيقي جديد 🎵",
        user_badge: userBadge
    }]);

    if (dbError) {
        alert("خطأ في حفظ التراك: " + dbError.message);
        return;
    }

    if (document.getElementById('postCaption')) document.getElementById('postCaption').value = "";
    if (audioInput) audioInput.value = "";

    alert("تم نشر التراك بنجاح يا فنان! 🎵🚀");
    loadEverything();
}
window.createAudioPost = createAudioPost;