
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

$(document).ready(function () {

    // هذم تعليقات عشان لو تحبو تراجعو الكود بعدين
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        const email = $('#email').val();
        const password = $('#password').val();
        const errorDiv = $('#errorMessage');

        // تسجيل الدخول عبر فايربيس
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // نجاح تسجيل الدخول
                window.location.href = '../home/index.html';
            })
            .catch((error) => {
                // فشل تسجيل الدخول
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

