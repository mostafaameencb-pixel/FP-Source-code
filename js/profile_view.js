import { loadPartials, checkAuth } from './common.js';
import { signOut, auth } from './firebase-config.js';
import { PageLoader } from './shemmer.js';

loadPartials();
PageLoader.show();

$(document).ready(function () {
    // 1. Check Auth & Load Data
    checkAuth((user, userData) => {
        if (userData) {
            $('#viewName').text(userData.fullName || 'مستخدم');
            $('#viewEmail').text(userData.email || user.email);
            PageLoader.hide();
        }
    });

    // 2. Logout
    $('#btnProfileLogout').on('click', function () {
        if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            signOut(auth).then(() => {
                window.location.href = '../auth/login.html';
            }).catch((error) => {
                console.error('Sign Out Error', error);
            });
        }
    });
});
