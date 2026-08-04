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

async function loadEverything() {
    const { data: { session } } = await supabase.auth.getSession();
    let userId = null;
    if (session && session.user) {
        userId = session.user.id;
    }
    if (!userId) return;

    const { data: userData, error } = await supabase.from('users').select('*').eq('id', userId).single();

    if (userData) {
        const avatarImg = document.getElementById("avatarImage");
        if (avatarImg && userData.avatar_url) {
            avatarImg.src = userData.avatar_url + "?t=" + new Date().getTime();
        }

        const mappings = {
            "nicknameDisplay": userData.nickname || "",
            "bioDisplay": userData.bio || "لا توجد سيرة ذاتية",
            "roleDisplay": translateRole(userData.role),
            "ageDisplay": (userData.age || "غير محدد") + (userData.age ? " سنة" : ""),
            "locationDisplay": userData.location || "غير محدد",
            "phoneDisplay": userData.phone || "غير محدد"
        };

        for (const [id, value] of Object.entries(mappings)) {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        }
    }

    loadUserProfileSubscription();
    await checkUserRoleForShowButton();
    await checkUserRoleForAudioButton();

    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('id') || userId;
    await loadFollowStatusAndCounts(targetUserId);

    const { data: posts } = await supabase.from('posts').select('*').eq('user_id', userId);
    const gallery = document.getElementById('galleryContainer');

    if (gallery) {
        gallery.innerHTML = "";
        if (posts && posts.length > 0) {
            for (let post of posts) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'gallery-item';
                itemDiv.style.cssText = "position: relative; background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 15px; text-align: center; backdrop-filter: blur(5px); margin-bottom: 15px; cursor: pointer; transition: transform 0.2s;";

                itemDiv.onclick = () => {
                    window.location.href = `next.html#post-${post.id}`;
                };

                let mediaHtml = "";
                if (post.media_url && post.media_url.trim() !== "") {
                    const isAudio = post.type === 'audio' || post.media_url.endsWith('.mp3') || post.media_url.endsWith('.wav');
                    const isVideo = post.type === 'video' || post.media_url.endsWith('.mp4') || post.media_url.endsWith('.mov');

                    if (isAudio) {
                        mediaHtml = `<div style="background: rgba(0,0,0,0.4); padding: 8px; border-radius: 8px; margin-bottom: 8px;"><p style="color: #ffcc00; font-size: 12px; margin-bottom: 4px;">🎵 تراك موسيقي</p><audio controls src="${post.media_url}" style="width: 100%; height: 35px;"></audio></div>`;
                    } else if (isVideo) {
                        mediaHtml = `<video src="${post.media_url}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; pointer-events: none;"></video>`;
                    } else {
                        mediaHtml = `<img src="${post.media_url}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">`;
                    }
                }

                const captionHtml = post.caption ? `<p style="color: #fff; font-size: 14px; word-break: break-word; margin: 0 0 10px 0;">${post.caption}</p>` : "";
                const likesCount = post.likes_count || 0;

                const { count: commentsCount } = await supabase
                    .from('comments')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                const totalComments = commentsCount || 0;

                const statsSection = `
                <div style="display: flex; justify-content: center; align-items: center; gap: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; margin-top: 5px; font-size: 14px; color: #fff;">
                    <span>❤️ ${likesCount}</span>
                    <span>💬 ${totalComments}</span>
                </div>
            `;

                const deleteBtn = `<button onclick="event.stopPropagation(); deletePost('${post.id}')" title="حذف المنشور" style="position: absolute; top: 10px; right: 10px; background: rgba(255, 71, 87, 0.8); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3); backdrop-filter: blur(5px);">×</button>`;
                const editBtn = `<button onclick="event.stopPropagation(); openEditPostModal('${post.id}', \`${post.caption || ''}\`)" title="تعديل المنشور" style="position: absolute; top: 10px; right: 45px; background: rgba(255, 204, 0, 0.8); color: #000; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3); backdrop-filter: blur(5px);">✏️</button>`;

                itemDiv.innerHTML = deleteBtn + editBtn + mediaHtml + captionHtml + statsSection;
                gallery.appendChild(itemDiv);
            }
        } else {
            gallery.innerHTML = "<p style='text-align: center; color: #ccc;'>لا توجد أعمال منشورة في معرض حتى الآن.</p>";
        }
    }

    loadDirectorShows();
}

loadEverything();

// --- دالة إنشاء المنشورات العامة مع شريط التحميل (Progress Bar) ---
async function createPost() {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        alert("يجب تسجيل الدخول أولاً للنشر! ⚠️");
        window.location.href = "logn.html";
        return;
    }

    const captionText = document.getElementById('postCaption')?.value.trim();
    const mediaInput = document.getElementById('mediaUpload');
    const file = mediaInput ? mediaInput.files[0] : null;

    if (!captionText && !file) {
        alert("يرجى كتابة نص أو إختيار صورة/فيديو للنشر!");
        return;
    }

    const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

    const hasActiveSub = subs && subs.length > 0;

    if (!hasActiveSub) {
        const { data: allUserPosts, error: fetchError } = await supabase
            .from('posts')
            .select('id, created_at')
            .eq('user_id', user.id);

        if (!fetchError && allUserPosts) {
            const now = new Date();
            const oneWeekAgoMs = 7 * 24 * 60 * 60 * 1000;

            const postsThisWeek = allUserPosts.filter(post => {
                if (!post.created_at) return false;
                const postDate = new Date(post.created_at);
                return (now - postDate) <= oneWeekAgoMs;
            });

            if (postsThisWeek.length >= 5) {
                alert("لقد وصلت للحد الأقصى للبوستات في الباقة المجانية هذا الأسبوع (5 منشورات).");
                window.location.href = "subscriptions.html";
                return;
            }
        }
    }

    let mediaUrl = null;
    let progressBox = null;

    if (file) {
        // إنشاء شريط التحميل ديناميكياً وعرضه للمستخدم
        progressBox = document.getElementById('uploadProgressBox');
        if (!progressBox) {
            progressBox = document.createElement('div');
            progressBox.id = 'uploadProgressBox';
            progressBox.style.cssText = "margin: 15px auto; text-align: center; max-width: 400px; background: rgba(0,0,0,0.85); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);";
            progressBox.innerHTML = `
                <p id="uploadStatusText" style="color: #ffcc00; margin-bottom: 8px; font-size: 14px;">جاري رفع الملف ... 🔄</p>
                <div style="width: 100%; background: rgba(255,255,255,0.2); border-radius: 10px; overflow: hidden; height: 10px;">
                    <div id="uploadProgressBar" style="width: 40%; height: 100%; background: #2ed573; transition: width 0.3s;"></div>
                </div>
            `;
            const captionInput = document.getElementById('postCaption');
            if (captionInput) captionInput.parentNode.insertBefore(progressBox, captionInput.nextSibling);
            else document.body.appendChild(progressBox);
        } else {
            progressBox.style.display = 'block';
            document.getElementById('uploadProgressBar').style.width = '40%';
            document.getElementById('uploadStatusText').innerText = "جاري رفع الملف ... 🔄";
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, file);

        if (uploadError) {
            if (progressBox) progressBox.style.display = 'none';
            alert("خطأ في رفع الملف: " + uploadError.message);
            return;
        }

        // تحديث شريط التحميل لـ 100%
        document.getElementById('uploadProgressBar').style.width = '100%';
        document.getElementById('uploadStatusText').innerText = "تم الرفع بنجاح! جاري النشر... ✅";

        const { data } = await supabase.storage.from('posts').getPublicUrl(filePath);
        mediaUrl = data.publicUrl;
    }

    const userBadge = localStorage.getItem('userBadge') || '';

    const { error: dbError } = await supabase.from('posts').insert([{
        user_id: user.id,
        media_url: mediaUrl,
        caption: captionText || "",
        user_badge: userBadge
    }]);

    if (progressBox) {
        setTimeout(() => {
            progressBox.style.display = 'none';
        }, 1000);
    }

    if (dbError) {
        alert("خطأ في حفظ البوست: " + dbError.message);
        return;
    }

    if (document.getElementById('postCaption')) document.getElementById('postCaption').value = "";
    if (mediaInput) mediaInput.value = "";

    alert("تم النشر بنجاح! 🚀");
    loadEverything();
}
window.createPost = createPost;

// --- دالة نشر التراكات الصوتيّة مع شريط التحميل ---
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

    let progressBox = document.getElementById('uploadProgressBox');
    if (!progressBox) {
        progressBox = document.createElement('div');
        progressBox.id = 'uploadProgressBox';
        progressBox.style.cssText = "margin: 15px auto; text-align: center; max-width: 400px; background: rgba(0,0,0,0.85); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2);";
        progressBox.innerHTML = `
            <p id="uploadStatusText" style="color: #ffcc00; margin-bottom: 8px; font-size: 14px;">جاري رفع التراك الصوتي... 🔄</p>
            <div style="width: 100%; background: rgba(255,255,255,0.2); border-radius: 10px; overflow: hidden; height: 10px;">
                <div id="uploadProgressBar" style="width: 40%; height: 100%; background: #2ed573; transition: width 0.3s;"></div>
            </div>
        `;
        document.body.appendChild(progressBox);
    } else {
        progressBox.style.display = 'block';
        document.getElementById('uploadProgressBar').style.width = '40%';
        document.getElementById('uploadStatusText').innerText = "جاري رفع التراك الصوتي... 🔄";
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `tracks/${user.id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, file);
    if (uploadError) {
        progressBox.style.display = 'none';
        alert("خطأ في رفع التراك: " + uploadError.message);
        return;
    }

    document.getElementById('uploadProgressBar').style.width = '100%';
    document.getElementById('uploadStatusText').innerText = "تم رفع التراك بنجاح! جاري الحفظ... ✅";

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

    setTimeout(() => {
        progressBox.style.display = 'none';
    }, 1000);

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

async function checkUserRoleForAudioButton() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    const audioSection = document.getElementById('audioPostSection');

    if (audioSection) {
        if (userData && userData.role === 'music') {
            audioSection.style.display = 'block';
        } else {
            audioSection.style.display = 'none';
        }
    }
}

async function deletePost(postId) {
    if (!confirm("هل أنت متأكد من حذف هذا المنشور نهائياً؟")) return;

    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
        alert("خطأ أثناء الحذف: " + error.message);
    } else {
        alert("تم حذف المنشور بنجاح!");
        loadEverything();
    }
}
window.deletePost = deletePost;

window.updateAllProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ageVal = document.getElementById("editage")?.value;
    const updates = {
        nickname: document.getElementById("editNickname")?.value,
        role: document.getElementById("editRole")?.value,
        bio: document.getElementById("editBio")?.value,
        location: document.getElementById("editLocation")?.value,
        phone: document.getElementById("editPhone")?.value,
        age: ageVal ? parseInt(ageVal, 10) : null
    };
    const { error } = await supabase.from('users').update(updates).eq('id', user.id);
    if (error) alert("خطأ: " + error.message);
    else {
        alert("تم التحديث!");
        document.getElementById('profileEditor').style.display = 'none';
        loadEverything();
    }
};

const avatarUploadInput = document.getElementById('avatarUpload');
if (avatarUploadInput) {
    avatarUploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error: err } = await supabase.storage.from('avatars').upload(`${user.id}.jpg`, file, { upsert: true });
        if (err) return alert("خطأ الرفع: " + err.message);

        const { data } = await supabase.storage.from('avatars').getPublicUrl(`${user.id}.jpg`);
        await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', user.id);

        document.getElementById('avatarImage').src = data.publicUrl + "?t=" + new Date().getTime();
        alert("تم تحديث صورة البروفايل بنجاح!");
    });
}

async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("خطأ في تسجيل الخروج:", error.message);
    } else {
        window.location.href = "index.html";
    }
}
window.logout = logout;

async function showEditor() {
    const editorModal = document.getElementById('profileEditor');
    if (editorModal) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
            if (userData) {
                if (document.getElementById('editNickname')) document.getElementById('editNickname').value = userData.nickname || '';
                if (document.getElementById('editRole')) document.getElementById('editRole').value = userData.role || 'actor';
                if (document.getElementById('editBio')) document.getElementById('editBio').value = userData.bio || '';
                if (document.getElementById('editLocation')) document.getElementById('editLocation').value = userData.location || '';
                if (document.getElementById('editPhone')) document.getElementById('editPhone').value = userData.phone || '';
                if (document.getElementById('editage')) document.getElementById('editage').value = userData.age || '';
            }
        }
        editorModal.style.display = 'flex';
    }
}
window.showEditor = showEditor;

function openEditPostModal(postId, currentCaption) {
    let modal = document.getElementById('editPostModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'editPostModal';
        modal.style.cssText = "display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; justify-content: center; align-items: center; backdrop-filter: blur(8px);";
        modal.innerHTML = `
            <div style="background: rgba(139, 0, 0, 0.6); backdrop-filter: blur(15px); padding: 25px; border-radius: 20px; width: 90%; max-width: 400px; color: #fff; text-align: right; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px 0 rgba(0,0,0,0.37);" dir="rtl">
                <h3 style="color: #ffcc00; margin-bottom: 15px; font-family: 'Lobster', cursive; font-size: 22px; text-align: center;">تعديل المنشور 🪄</h3>
                <input type="hidden" id="editPostId">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">النص الجديد:</label>
                <textarea id="editPostCaptionInput" style="width: 100%; height: 100px; padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.4); color: #fff; outline: none; resize: none; margin-bottom: 15px;"></textarea>
                <div style="display: flex; justify-content: space-between;">
                    <button onclick="savePostEdit()" style="background: linear-gradient(135deg, #2ed573, #26af5f); color: #fff; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: bold;">حفظ التعديل ✨</button>
                    <button onclick="document.getElementById('editPostModal').style.display='none'" style="background: rgba(255,255,255,0.2); color: #fff; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer;">إغلاق</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('editPostId').value = postId;
    document.getElementById('editPostCaptionInput').value = currentCaption === 'null' ? '' : currentCaption;
    modal.style.display = 'flex';
}
window.openEditPostModal = openEditPostModal;

async function savePostEdit() {
    const postId = document.getElementById('editPostId').value;
    const newCaption = document.getElementById('editPostCaptionInput').value.trim();

    if (!postId) return;

    const { error } = await supabase
        .from('posts')
        .update({ caption: newCaption })
        .eq('id', postId);

    if (error) {
        alert("خطأ أثناء التعديل: " + error.message);
    } else {
        alert("تم تعديل المنشور بنجاح! 🚀");
        document.getElementById('editPostModal').style.display = 'none';
        loadEverything();
    }
}
window.savePostEdit = savePostEdit;

async function checkUserRoleForShowButton() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    const addShowSection = document.getElementById('directorAddShowSection');

    if (userData && userData.role === 'director') {
        if (addShowSection) addShowSection.style.display = 'block';
    } else {
        if (addShowSection) addShowSection.style.display = 'none';
    }
}

async function loadFollowStatusAndCounts(profileUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user ? user.id : null;

    const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileUserId);

    const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileUserId);

    if (document.getElementById('followersCountDisplay')) {
        document.getElementById('followersCountDisplay').innerText = followersCount || 0;
    }
    if (document.getElementById('followingCountDisplay')) {
        document.getElementById('followingCountDisplay').innerText = followingCount || 0;
    }

    const followBtn = document.getElementById('followActionBtn');
    if (followBtn) {
        if (!currentUserId || currentUserId === profileUserId) {
            followBtn.style.display = 'none';
            return;
        }

        followBtn.style.display = 'block';

        const { data: existingFollow } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUserId)
            .eq('following_id', profileUserId)
            .maybeSingle();

        if (existingFollow) {
            followBtn.innerText = "إلغاء المتابعة (Unfollow) 👤-";
            followBtn.style.background = "#555";
            followBtn.setAttribute('data-is-following', 'true');
        } else {
            followBtn.innerText = "متابعة (Follow) 👤+";
            followBtn.style.background = "#ff4757";
            followBtn.setAttribute('data-is-following', 'false');
        }

        followBtn.setAttribute('onclick', `toggleFollow('${profileUserId}')`);
    }
}

async function toggleFollow(profileUserId) {
    const { data: { user } } = await supabase.auth.getUser();
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
    const isFollowing = followBtn.getAttribute('data-is-following') === 'true';

    if (isFollowing) {
        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', profileUserId);

        if (error) {
            alert("خطأ أثناء إلغاء المتابعة: " + error.message);
        } else {
            loadFollowStatusAndCounts(profileUserId);
        }
    } else {
        const { error } = await supabase
            .from('follows')
            .insert([{ follower_id: user.id, following_id: profileUserId }]);

        if (error) {
            alert("خطأ أثناء المتابعة: " + error.message);
        } else {
            const { data: currentUserData } = await supabase
                .from('users')
                .select('nickname, avatar_url')
                .eq('id', user.id)
                .single();

            const followerName = currentUserData ? (currentUserData.nickname || "فنان") : "فنان";
            const followerAvatar = currentUserData ? (currentUserData.avatar_url || 'img/default-avatar.png') : 'img/default-avatar.png';

            const { error: notifError } = await supabase
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

            loadFollowStatusAndCounts(profileUserId);
        }
    }
}
window.toggleFollow = toggleFollow;

async function toggleShowForm() {
    if (typeof supabase === 'undefined') {
        alert("مكتبة Supabase غير محملة!");
        return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        alert("لا! يجب تسجيل الدخول أولاً.");
        window.location.href = "logn.html";
        return;
    }

    const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

    const activeSub = subs && subs.length > 0 ? subs[0] : null;
    const { data: userData } = await supabase.from('users').select('free_show_used').eq('id', user.id).single();

    if (!activeSub) {
        const { count: existingShowsCount } = await supabase
            .from('shows')
            .select('*', { count: 'exact', head: true })
            .eq('director_id', user.id);

        if ((userData && userData.free_show_used === true) || (existingShowsCount && existingShowsCount > 0)) {
            alert("لقد استنفذت عرضك المجاني المتاح! ❌ يرجى ترقية باقتك لإضافة المزيد.");
            window.location.href = "subscriptions.html";
            return;
        }
    } else {
        const subCreatedAt = new Date(activeSub.created_at);

        const { data: userShows } = await supabase
            .from('shows')
            .select('id, created_at')
            .eq('director_id', user.id);

        const showsCreatedInThisSub = userShows ? userShows.filter(s => new Date(s.created_at) >= subCreatedAt) : [];

        if (showsCreatedInThisSub.length >= 1 || (userData && userData.free_show_used === true)) {
            alert("لقد استنفذت الحد الأقصى لعروض هذه الباقة (عرض واحد لكل باقة مدفوعة)! 🎬 يرجى تجديد أو شراء باقة جديدة.");
            window.location.href = "subscriptions.html";
            return;
        }
    }

    alert("مرحباً بك يا فنان! 🌟 يمكنك تسجيل عرضك الآن.");

    const mainSection = document.getElementById('directorAddShowSection');
    if (mainSection) {
        mainSection.style.cssText = "display: block !important; visibility: visible !important; opacity: 1 !important; margin-top: 25px; background: rgba(139, 0, 0, 0.4); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); padding: 25px; border-radius: 20px; text-align: right; max-width: 500px; margin-left: auto; margin-right: auto; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);";
    }

    const formContainer = document.getElementById('showFormContainer');
    if (formContainer) {
        formContainer.style.cssText = "display: block !important; visibility: visible !important; opacity: 1 !important; margin-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.15); padding-top: 15px;";
        formContainer.scrollIntoView({ behavior: 'smooth' });
    }
}
window.toggleShowForm = toggleShowForm;

async function addNewShow() {
    const title = document.getElementById('showTitle').value;
    const description = document.getElementById('showDescription').value;
    const showTime = document.getElementById('showTime').value;
    const location = document.getElementById('showLocation').value;
    const price = document.getElementById('showPrice').value;
    const durationInput = document.getElementById('showDuration');
    const duration = durationInput ? durationInput.value : "5";
    const imageFile = document.getElementById('showImageFile').files[0];

    if (!title) {
        alert("يرجى إدخال اسم العرض على الأقل!");
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("يجب تسجيل الدخول أولاً!");
        return;
    }

    const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

    const activeSub = subs && subs.length > 0 ? subs[0] : null;
    const { data: userData } = await supabase.from('users').select('free_show_used').eq('id', user.id).single();

    if (!activeSub) {
        const { count: existingShowsCount } = await supabase
            .from('shows')
            .select('*', { count: 'exact', head: true })
            .eq('director_id', user.id);

        if ((userData && userData.free_show_used === true) || (existingShowsCount && existingShowsCount > 0)) {
            alert("لقد استنفذت عرضك المجاني! ❌ يرجى ترقية باقتك.");
            window.location.href = "subscriptions.html";
            return;
        }
    } else {
        const subCreatedAt = new Date(activeSub.created_at);
        const { data: userShows } = await supabase.from('shows').select('id, created_at').eq('director_id', user.id);
        const showsCreatedInThisSub = userShows ? userShows.filter(s => new Date(s.created_at) >= subCreatedAt) : [];

        if (showsCreatedInThisSub.length >= 1 || (userData && userData.free_show_used === true)) {
            alert("لقد استنفذت عروض هذه الباقة! 🎬 يرجى تجديد اشتراكك.");
            window.location.href = "subscriptions.html";
            return;
        }
    }

    let imageUrl = "";

    if (imageFile) {
        const filePath = `shows/${user.id}_${Date.now()}_${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, imageFile);

        if (uploadError) {
            alert("خطأ في رفع صورة العرض: " + uploadError.message);
            return;
        }

        const { data: pubData } = supabase.storage.from('posts').getPublicUrl(filePath);
        imageUrl = pubData.publicUrl;
    }

    const { error } = await supabase.from('shows').insert([
        {
            director_id: user.id,
            title: title,
            description: description,
            image_url: imageUrl,
            show_time: showTime,
            location: location,
            ticket_price: price,
            duration_days: parseInt(duration, 10)
        }
    ]);

    if (error) {
        alert("خطأ أثناء إضافة العرض: " + error.message);
    } else {
        await supabase
            .from('users')
            .update({ free_show_used: true })
            .eq('id', user.id);

        alert("تم إضافة العرض بنجاح يا فنان! 🌟");

        document.getElementById('showTitle').value = "";
        document.getElementById('showDescription').value = "";
        document.getElementById('showTime').value = "";
        document.getElementById('showLocation').value = "";
        document.getElementById('showPrice').value = "";
        if (document.getElementById('showImageFile')) document.getElementById('showImageFile').value = "";
        loadEverything();
    }
}
window.addNewShow = addNewShow;

async function loadDirectorShows() {
    const container = document.getElementById('directorShowsContainer');
    if (!container) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: shows, error } = await supabase
        .from('shows')
        .select('*')
        .eq('director_id', user.id);

    if (error || !shows) return;

    container.innerHTML = "";

    if (shows.length > 0) {
        shows.forEach(show => {
            const card = document.createElement('div');
            card.style.cssText = "background: #222; color: #fff; border-radius: 10px; width: 250px; padding: 12px; border: 1px solid #444; text-align: right;";

            const imgHtml = show.image_url
                ? `<img src="${show.image_url}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 6px; display: block; margin: 0 auto 8px auto;">`
                : '';

            card.innerHTML = `
                ${imgHtml}
                <h4 style="color: #ffcc00; margin-bottom: 5px;">${show.title}</h4>
                <p style="font-size: 12px; margin-bottom: 4px;">📅 ${show.show_time || 'غير محدد'}</p>
                <p style="font-size: 12px; margin-bottom: 8px;">📍 ${show.location || 'غير محدد'}</p>
                <button onclick="deleteShow('${show.id}')" style="background: #ff4757; color: white; border: none; padding: 6px; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold; font-size: 13px;">حذف العرض 🗑️</button>
            `;
            container.appendChild(card);
        });
    } else {
        container.innerHTML = "<p style='color: #ccc; text-align: center; width: 100%;'>لم تقم بإضافة أي عروض مسرحية بعد.</p>";
    }
}

async function deleteShow(showId) {
    if (!confirm("هل أنت متأكد من حذف هذا العرض نهائياً؟")) return;

    const { error } = await supabase.from('shows').delete().eq('id', showId);

    if (error) {
        alert("خطأ أثناء الحذف: " + error.message);
    } else {
        alert("تم حذف العرض بنجاح!");
        loadEverything();
    }
}
window.deleteShow = deleteShow;

async function checkAndRemoveExpiredShows() {
    const { data: shows, error } = await supabase.from('shows').select('*');
    if (error || !shows) return;

    const now = new Date();

    shows.forEach(async (show) => {
        if (show.created_at && show.duration_days) {
            const createdAt = new Date(show.created_at);
            const expiryDate = new Date(createdAt.getTime() + (show.duration_days * 24 * 60 * 60 * 1000));

            if (now > expiryDate) {
                await supabase.from('shows').delete().eq('id', show.id);
            }
        }
    });
}

checkAndRemoveExpiredShows();

async function loadUserProfileSubscription() {
    const subContainer = document.getElementById('subContainer');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) return;

    const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id);

    const subData = subs ? subs.find(s => s.status === 'active') : null;

    let planDisplayName = "الباقة المجانية 🎭";
    let badgeEmoji = "";
    let expiryInfoHtml = "";

    if (subData && subData.plan_name) {
        if (subData.plan_name.includes('Star') || subData.plan_name.includes('النجم')) {
            planDisplayName = "باقة النجم الصاعد 🌟";
            badgeEmoji = "⭐";
        }
        else if (subData.plan_name.includes('Director') || subData.plan_name.includes('المخرج')) {
            planDisplayName = "باقة المخرج الشامل 🎬";
            badgeEmoji = "🎬";
        }
        else if (subData.plan_name.includes('VIP') || subData.plan_name.includes('عاشق')) {
            planDisplayName = "عاشق المسرح VIP ⭐";
            badgeEmoji = "⭐";
        }
        else if (subData.plan_name.includes('Gold') || subData.plan_name.includes('الداعم')) {
            planDisplayName = "الداعم الذهبي 🎭";
            badgeEmoji = "🎭";
        } else {
            planDisplayName = subData.plan_name;
            badgeEmoji = "⭐";
        }

        localStorage.setItem('userBadge', badgeEmoji);
        localStorage.setItem('userPlanTitle', planDisplayName);

        if (subData.expires_at) {
            const now = new Date();
            const expiryDate = new Date(subData.expires_at);
            const diffTime = expiryDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) {
                expiryInfoHtml = `<p style="margin: 4px 0; font-size: 13px; color: #ff4757;">⚠️ انتهت صلاحية الاشتراك</p>`;
            } else {
                expiryInfoHtml = `
                    <p style="margin: 4px 0; font-size: 13px; color: #ddd;">📅 ينتهي في: ${expiryDate.toLocaleDateString('ar-EG')}</p>
                    <p style="margin: 4px 0; font-size: 13px; color: #2ed573;">⏳ متبقي على الانتهاء: <strong>${diffDays} يوم</strong></p>
                `;
            }
        }
    } else {
        localStorage.removeItem('userBadge');
    }

    if (subContainer) {
        const formattedDate = subData && subData.created_at ? new Date(subData.created_at).toLocaleDateString('ar-EG') : 'حديث';
        subContainer.innerHTML = `
            <div style="background: rgba(139, 0, 0, 0.6); backdrop-filter: blur(10px); border: 2px solid #ffcc00; padding: 20px; border-radius: 15px; color: #fff; text-align: right; margin-top: 15px;" dir="rtl">
                <h3 style="margin-bottom: 8px; color: #ffcc00; font-size: 18px;">
                    اشتراكك الحالي: ${planDisplayName} ${badgeEmoji}
                </h3>
                <p style="margin: 4px 0; font-size: 14px; color: #fff;">حالة الاشتراك: <span style="color: #2ed573; font-weight: bold;">${subData ? 'نشط ✅' : 'مجاني 🎟️'}</span></p>
                <p style="margin: 4px 0; font-size: 13px; color: #ddd;">تاريخ التفعيل: ${formattedDate}</p>
                ${expiryInfoHtml}
                <div style="margin-top: 12px; text-align: left;">
                    <a href="subscriptions.html" style="background: #ffcc00; color: #000; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px;">ترقية أو تغيير الباقة ⚡</a>
                </div>
            </div>
        `;
    }
}