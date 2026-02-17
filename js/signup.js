import { auth, db, createUserWithEmailAndPassword, doc, setDoc, serverTimestamp } from './firebase-config.js';

$(document).ready(function () {

    $('#loginForm').on('submit', async function (e) {
        e.preventDefault();
        loading(0);


        // الحصول على القيم من المدخلات
        const fullName = $('#fullName').val();
        const age = $('#age').val();
        const gender = $('#gender').val();
        const weight = $('#weight').val();
        const height = $('#height').val();
        const chronicConditions = $('#chronicConditions').val();
        const email = $('#email').val();
        const password = $('#password').val();


        const errorDiv = $('#errorMessage');


        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;


            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                fullName: fullName,
                age: parseInt(age),
                gender: gender,
                weight: parseFloat(weight),
                height: parseFloat(height),
                chronicConditions: chronicConditions ? chronicConditions.trim() : "",
                email: email,
                createdAt: serverTimestamp()
            });

            errorDiv.removeClass('d-none').addClass('alert-success').text('تم إنشاء الحساب بنجاح! جاري التحويل...');


            loading(1);


            setTimeout(() => {
                window.location.href = '../home/index.html';
            }, 1500);

        } catch (error) {
            // معالجة الأخطاء
            errorDiv.removeClass('d-none').addClass('alert-danger');

            if (error.code === 'auth/email-already-in-use') {
                errorDiv.text('هذا البريد الإلكتروني مسجل بالفعل.');
            } else {
                errorDiv.text('حدث خطأ: ' + error.message);
            }

            // إعادة تفعيل الزر
            loading(1);
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