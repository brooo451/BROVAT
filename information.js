function openInfoModal() {
    document.getElementById("infoModal").style.display = "block";
}

function closeInfoModal() {
    document.getElementById("infoModal").style.display = "none";
}

// لإغلاق النافذة إذا ضغط المستخدم في أي مكان خارجها
window.onclick = function (event) {
    let modal = document.getElementById("infoModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}