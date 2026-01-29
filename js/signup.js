import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

$(document).ready(function() {

    $('#signupForm').on('submit', async function(e) {
        e.preventDefault();

        //نشل الباينات من الفورم عبر الحقول 
        const fullName = $('#fullName').val();
        const age = $('#age').val();
        const gender = $('#gender').val();
        const email = $('#email').val();
        const password = $('#password').val();
        
        const btn = $('#btnSignup');
        const btnText = $('#btnText');
        const btnLoader = $('#btnLoader');
        const statusMsg = $('#statusMessage');

        // هنا بنعمل تعطيل للزر عشان ماحدن يقدر يضغط عليه مره تانية
        btn.prop('disabled', true);
        btnText.addClass('d-none');
        btnLoader.removeClass('d-none');
        statusMsg.addClass('d-none').removeClass('alert-danger alert-success');

        try {
            // 1. إنشاء الحساب في فايربيس اوث
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. تخزين بيانات المستخدم  في قاعدة بيانات فايربيس
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                fullName: fullName,
                age: parseInt(age),
                gender: gender,
                email: email,
                createdAt: serverTimestamp()
            });

            // نجاح العملية
            statusMsg.removeClass('d-none').addClass('alert-success').text('تم إنشاء الحساب بنجاح! جاري التحويل...');
            
            // الان نحول المستخدم الى الصفحة الرئيسية ,, بس عادها مش موجودة 
            // setTimeout(() => {
            //     window.location.href = 'index.html';
            // }, 1500);

        } catch (error) {
            // لو حصل خطاء في الكاتش , نفعل رسالة للمستخدم 
            statusMsg.removeClass('d-none').addClass('alert-danger');
            
            if (error.code === 'auth/email-already-in-use') {
                statusMsg.text('هذا البريد الإلكتروني مسجل بالفعل.');
            } else {
                statusMsg.text('حدث خطأ: ' + error.message);
            }

            // إعادة تفعيل الزر بعد ماكملنا كل شي 
            btn.prop('disabled', false);
            btnText.removeClass('d-none');
            btnLoader.addClass('d-none');
        }
    });
});