import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

$(document).ready(function () {

    // التعامل مع نموذج تسجيل الدخول
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        loading(0);
        const email = $('#email').val();
        const password = $('#password').val();
        const errorDiv = $('#errorMessage');

        // تسجيل الدخول عبر فايربيس
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // نجاح تسجيل الدخول
              
                loading(1);
                window.location.href = '../home/index.html';
            })
            .catch((error) => {
                // فشل تسجيل الدخول
                loading(1);
                errorDiv.removeClass('d-none').text("خطأ: " + error.message);
            });
    });

    // التحقق من حالة المستخدم (هل هو مسجل دخول أم لا؟)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("المستخدم مسجل دخول حالياً:", user.email);

        } else {
            console.log("لا يوجد مستخدم مسجل دخول");
        }
    });


});


function loading(flag) {

    if (flag == 0) {
        $('#errorMessage').addClass('d-none').removeClass('alert-danger alert-success');

        $('#btnText').addClass('d-none');
        $('#btnLoader').removeClass('d-none');
    }
    else {
        $('#btnText').removeClass('d-none');
        $('#btnLoader').addClass('d-none');
    }

}