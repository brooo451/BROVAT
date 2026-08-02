window.loginUser = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        alert("خطأ في الدخول: " + error.message);
        return;
    }

    window.location.href = "next.html";
};

window.registerUser = async () => {
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const nickname = document.getElementById("nickname").value;
    const role = document.getElementById("roleSelect").value;
    const phone = document.getElementById("phone").value;

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);

    if (!data.user) {
        alert("حدث خطأ أثناء إنشاء الحساب.");
        return;
    }

    // استخدام upsert بدل insert لمنع خطأ التكرار نهائياً
    const { error: dbError } = await supabase
        .from('users')
        .upsert([{
            id: data.user.id,        // الـ ID بتاع الـ Auth
            nickname: nickname,      // اسم المستخدم
            role: role,              // التخصص
            phone: phone             // رقم الهاتف
        }]);

    if (dbError) {
        console.error("تفاصيل الخطأ من Supabase:", dbError);
        alert("الخطأ اللي ظهر هو: " + dbError.message + " - نوع الخطأ: " + dbError.code);
    } else {
        alert("تم التسجيل!");
        window.location.href = "me.html";
    }
};

window.showRegister = () => {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("registerSection").style.display = "block";
};

const registerLink = document.getElementById("showRegister");
if (registerLink) {
    registerLink.addEventListener("click", window.showRegister);
}

function changeColor() {
    const box = document.getElementById("signupBox");
    const role = document.getElementById("roleSelect").value;

    const colors = {
        actor: "#ff0000cc",
        director: "#ffcc00d0",
        decor: "#f18d01e8",
        music: "#1045a7cd",
        light: "#feeebad3",
        dance: "#06f2e2ce"
    };

    if (box) {
        box.style.background = colors[role];
        box.style.transition = "background 0.5s ease";
    }
}
// التأكد من وجود رابط "سجل في البروفا" داخل القائمة الجانبية تلقائياً
window.addEventListener('DOMContentLoaded', () => {
    const sideMenuUl = document.querySelector('.side-menu ul');
    if (sideMenuUl) {
        // نتحقق إذا كان الرابط مش موجود، نضيفه فوراً في أول القائمة
        if (!sideMenuUl.innerHTML.includes('logn.html')) {
            const loginLi = document.createElement('li');
            loginLi.innerHTML = `<a href="logn.html" class="menu-link" style="color: #ff4757; font-weight: bold;">سجل في البروفا 🌟</a>`;
            sideMenuUl.prepend(loginLi); // بيحطه في أول القائمة فوق خالص
        }
    }
});
async function handleMobileLogin() {
    const email = document.getElementById('mobileEmail').value.trim();
    const password = document.getElementById('mobilePassword').value.trim();

    if (!email || !password) {
        alert("يرجى إدخال البريد الإلكتروني وكلمة المرور!");
        return;
    }

    if (typeof supabase === 'undefined') {
        alert("خطأ في الاتصال بقاعدة البيانات!");
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("خطأ في تسجيل الدخول: " + error.message);
    } else {
        alert("تم تسجيل الدخول بنجاح! 🎭");
        window.location.href = "next.html"; // توجيه للرئيسية بعد الدخول
    }
}
window.handleMobileLogin = handleMobileLogin;
