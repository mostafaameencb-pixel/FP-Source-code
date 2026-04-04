import { auth, db, onAuthStateChanged, doc, getDoc, signOut } from './firebase-config.js';

export function checkAdmin() {

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '../../page/auth/login.html';
            return;
        }

        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.type !== 'admin') {
                    // Not an admin
                    alert("عذراً، لا تملك صلاحية الدخول لهذه الصفحة.");
                    window.location.href = '../../page/home/index.html';
                }
                else {
                    // Is Admin - Allow
                    // Update Sidebar Name if element exists
                    $('#adminName').text(userData.fullName);

                    // Setup Logout
                    setupAdminLogout();
                }
            } else {
                console.error("No such user document!");
                window.location.href = '../../page/auth/login.html';
            }
        } catch (error) {
            console.error("Error checking privileges:", error);
            window.location.href = '../../page/home/index.html';
        }
    });
}



// Function to render sidebar
export function loadAdminSidebar(activePage) {
    // Inject mobile toggle first
    $('body').prepend(`
        <button class="mobile-toggle" id="sidebarToggle">
            <i class="fas fa-bars"></i>
        </button>
        <div class="sidebar-overlay" id="sidebarOverlay"></div> 
    `);

    // Add overlay CSS dynamic if needed or just use JS
    $('#sidebarOverlay').css({
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: '999', display: 'none'
    });

    const sidebarHtml = `
        <div class="sidebar-container bg-white h-100">
            <a href="#" class="sidebar-logo text-decoration-none">
                <span class="brand-dot me-2"></span>
                M-PATH Admin
            </a>
            
            <ul class="nav flex-column mb-auto">
                <li class="nav-item">
                    <a href="index.html" class="nav-link ${activePage === 'index' ? 'active' : ''}">
                        <i class="fas fa-chart-pie"></i>
                        الإحصائيات
                    </a>
                </li>
                <li class="nav-item">
                    <a href="users.html" class="nav-link ${activePage === 'users' ? 'active' : ''}">
                        <i class="fas fa-users"></i>
                        المستخدمين
                    </a>
                </li>
                <li class="nav-item">
                    <a href="posts.html" class="nav-link ${activePage === 'posts' ? 'active' : ''}">
                        <i class="fas fa-comments"></i>
                        المنشورات
                    </a>
                </li>
            </ul>
            
            <div class="mt-auto pt-4 border-top">
                <div class="d-flex align-items-center mb-3 px-2">
                    <div class="rounded-circle ms-2 bg-gradient-primary d-flex justify-content-center align-items-center text-white" style="width:40px; height:40px; background: var(--primary-color);">A</div>
                    <div>
                        <strong class="d-block text-dark" id="adminName">Admin</strong>
                        <small class="text-muted">مُشرف النظام</small>
                    </div>
                </div>
                <a class="nav-link text-danger" href="#" id="btnAdminLogout">
                    <i class="fas fa-sign-out-alt"></i>
                    تسجيل الخروج
                </a>
            </div>
        </div>
    `;

    $('#sidebar-placeholder').html(sidebarHtml);
    setupAdminLogout();

    // Mobile Toggle Logic
    $('#sidebarToggle, #sidebarOverlay').on('click', function () {
        $('#sidebar-placeholder').toggleClass('show');
        if ($('#sidebar-placeholder').hasClass('show')) {
            $('#sidebarOverlay').fadeIn();
        } else {
            $('#sidebarOverlay').fadeOut();
        }
    });
}


function setupAdminLogout() {
    $('#btnAdminLogout').click(() => {
        signOut(auth).then(() => {
            window.location.href = '../../page/auth/login.html';
        });
    });
}