import { db, doc, updateDoc } from './firebase-config.js';

import { loadPartials, checkAuth } from './common.js';
import { PageLoader } from './shemmer.js';

loadPartials();
PageLoader.show();

let currentUid = null;

$(document).ready(function () {
    checkAuth((user, userData) => {
        if (userData) {
            currentUid = user.uid; // Store UID for update

            $('#profileFullName').text(userData.fullName);
            $('#profileEmail').text(userData.email);

            $('#valName').val(userData.fullName);
            $('#valEmail').val(userData.email);
            $('#valGender').val(userData.gender);


            $('#valAge').val(userData.age);
            $('#valWeight').val(userData.weight);
            $('#valHeight').val(userData.height);
            $('#chronicConditions').val(userData.chronicConditions);

            PageLoader.hide();
        }
    });


    // التعامل مع نموذج تعديل البيانات
    $('#updateForm').on('submit', async function (e) {
        e.preventDefault();

        if (!currentUid) {
            $('#errorMessage').removeClass('d-none').addClass('alert-danger').text('حدث خطأ: لم يتم التعرف على المستخدم.');
            return;
        }

        loading(0);
        const errorDiv = $('#errorMessage');

        // الحصول على القيم الجديدة
        const fullName = $('#valName').val();
        const gender = $('#valGender').val();
        const age = $('#valAge').val();
        const weight = $('#valWeight').val();
        const height = $('#valHeight').val();
        const chronicConditions = $('#chronicConditions').val();

        try {
            const userRef = doc(db, "users", currentUid);

            await updateDoc(userRef, {
                fullName: fullName,
                gender: gender,
                age: parseInt(age),
                weight: parseFloat(weight),
                height: parseFloat(height),
                chronicConditions: chronicConditions ? chronicConditions.trim() : ""
            });

            // تحديث العرض في الهيدر إذا تغير الاسم
            $('#profileFullName').text(fullName);
            $('#userName').text(fullName); 

            errorDiv.removeClass('d-none').removeClass('alert-danger').addClass('alert-success').text('تم تحديث البيانات بنجاح!');

            // إخفاء الرسالة بعد فترة
            setTimeout(() => {
                errorDiv.addClass('d-none').removeClass('alert-success');
            }, 3000);

            loading(1);

        } catch (error) {
            console.error("Error updating profile:", error);
            errorDiv.removeClass('d-none').removeClass('alert-success').addClass('alert-danger').text('فشل التحديث: ' + error.message);
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
