// 1. تهيئة Supabase (تعديل طفيف ليتوافق مع الإصدارات الحديثة)
const supabaseUrl = 'https://dfoqxztjsienubxqpdez.supabase.co';
const supabaseKey = 'sb_publishable_oQOLSbEI8mE9yvwtJ6SmWA_wIEOOYoq';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. دالة تسجيل مستخدم جديد
window.registerUser = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const nickname = document.getElementById("nickname").value;

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return alert(error.message);

    // إضافة البيانات لجدول الـ users في Supabase (تم تصحيح الخطأ هنا)
    const { error: dbError } = await supabase
        .from('users')
        .upsert([{
            id: data.user.id,
            nickname: nickname,
            role: "ممثل",
            bio: "أهلاً بك في بروفا"
        }]);

    if (dbError) return alert(dbError.message);

    alert("تم التسجيل بنجاح!");
    window.location.href = "logn.html";
};

// 3. دالة تسجيل الدخول
window.loginUser = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        alert("خطأ في الدخول: " + error.message);
        return;
    }

    window.location.href = "me.html";
};

// 4. دالة حفظ بيانات البروفايل
window.saveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { error } = await supabase
            .from('users')
            .update({
                nickname: document.getElementById('viewNickname').value,
                role: document.getElementById('viewRole').value,
                bio: document.getElementById('viewBio').value
            })
            .eq('id', user.id);

        if (error) alert(error.message);
        else alert("تم التحديث بنجاح!");
    }
};

// 5. إدارة صفحة البروفايل (جلب البيانات بناءً على الرابط أو المستخدم الحالي)
const urlParams = new URLSearchParams(window.location.search);
const targetUserId = urlParams.get('id');

if (window.location.pathname.includes("profile.html")) {
    const loading = document.getElementById("loading");
    if (loading) loading.style.display = "none";

    if (targetUserId) {
        // لو فاتحين بروفايل شخص تاني عن طريق البحث
        fetchUserProfile(targetUserId);
    } else {
        // لو فاتحين البروفايل الشخصي (ملفي الشخصي)
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (user) {
                const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
                if (data) {
                    fillProfileData(data);
                }
            } else {
                alert("يجب عليك تسجيل الدخول أولاً!");
                window.location.href = "logn.html";
            }
        });
    }

    window.logout = async () => {
        await supabase.auth.signOut();
        window.location.href = "logn.html";
    };
}

// دالة لجلب وتعرض بيانات أي مستخدم بالـ ID
async function fetchUserProfile(id) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error("خطأ في جلب بيانات البروفايل:", error.message);
            return;
        }

        if (data) {
            fillProfileData(data);

            // لو حابب تقفل خانات التعديل وتخليها عرض فقط لما تدخل بروفايل حد تاني:
            // document.querySelectorAll('input, textarea, button').forEach(el => { if(el.id !== 'backBtn') el.disabled = true; });
        }
    } catch (err) {
        console.error("حدث خطأ غير متوقع:", err);
    }
}

// دالة مساعدة لتعبئة الحقول بالبيانات في الصفحة
function fillProfileData(data) {
    if (document.getElementById('viewNickname')) document.getElementById('viewNickname').value = data.nickname || "";
    if (document.getElementById('viewRole')) document.getElementById('viewRole').value = data.role || "";
    if (document.getElementById('viewBio')) document.getElementById('viewBio').value = data.bio || "";
    if (document.getElementById("userName")) document.getElementById("userName").innerText = data.nickname || "";
}