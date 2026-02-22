import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from './firebase-config.js';

import { PageLoader } from './shemmer.js';

/**
 * Loads the navbar and footer into the placeholders.
 * Assumes the HTML has #navbar-placeholder and #footer-placeholder.
 * Assumes the page is in a subdirectory one level deep (e.g. page/home/index.html),
 * so partials are at ../partials/
 */
export function loadPartials() {
    $("#navbar-placeholder").load("../partials/nav.html", function (response, status, xhr) {
        if (status == "error") {
            console.error("Failed to load navbar: " + xhr.status + " " + xhr.statusText);
        } else {
            // Highlight active link
            const currentUrl = window.location.href.split('?')[0]; // Ignore query params
            $('.nav-link').each(function () {
                // Check if this link's href matches current URL
                if (this.href === currentUrl) {
                    $(this).addClass('active');
                } else {
                    $(this).removeClass('active');
                }
            });
        }
    });
    $("#footer-placeholder").load("../partials/footer.html");
}

/**
 * Checks authentication state.
 * @param {Function} onAuthorized - Callback function called when user is authenticated. Receives (user, userData).
 * @param {boolean} redirectIfUnauth - Whether to redirect to login if not authenticated. Default true.
 */
export function checkAuth(onAuthorized, redirectIfUnauth = true) {
    PageLoader.show();
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                let userData = null;
                if (userDoc.exists()) {
                    userData = userDoc.data();
                    // Update user name in navbar if it exists
                    $('#userName').text(userData.fullName);
                }
                if (onAuthorized) onAuthorized(user, userData);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        } else {
            if (redirectIfUnauth) {
                window.location.href = '../auth/login.html';
            }
        }

        PageLoader.hide();

    });
}

/**
 * Handles logout functionality.
 * Attaches click event to #btnLogout.
 */
export function setupLogout() {
    $(document).on('click', '#btnLogout', function () {
        signOut(auth).then(() => {
            window.location.href = '../auth/login.html';
        });
    });
}

// Initialize common components
$(document).ready(function () {
    setupLogout();
});
