// نحدد عنصر الباب باستخدام الكلاس الخاص به

const doorElement = document.querySelector('.door');

// نضيف الحدث عند الضغط (click)
doorElement.addEventListener('click', function () {
    // يمكنك تغيير 'home.html' إلى اسم الصفحة التي تريد الانتقال إليها
    window.location.href = 'next.html';

});
