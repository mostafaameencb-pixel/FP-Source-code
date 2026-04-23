// js/admin_users.js
import { checkAdmin, loadAdminSidebar } from './admin_common.js';
import { db, collection, getDocs, doc, updateDoc } from './firebase-config.js';

// Initialize
checkAdmin();
loadAdminSidebar('users');

$(document).ready(async function () {
    const usersList = $('#usersList');
    let usersData = [];

    // Load Users
    try {
        const querySnapshot = await getDocs(collection(db, "users"));

        if (querySnapshot.empty) {
            usersList.html('<tr><td colspan="5" class="text-center text-muted">لا يوجد مستخدمين مسجلين.</td></tr>');
            return;
        }

        renderUsers(querySnapshot);

    } catch (error) {
        console.error("Error loading users:", error);
        usersList.html('<tr><td colspan="5" class="text-center text-danger">حدث خطأ أثناء تحميل البيانات.</td></tr>');
    }

    function renderUsers(snapshot) {
        usersList.empty();
        snapshot.forEach(docSnap => {
            const user = docSnap.data();
            const uid = docSnap.id;

            // Status Logic: 1 = Active, 0 = Blocked
            const isActive = user.status !== 0;
            const statusLabel = isActive ? 'نشط' : 'محظور';
            const statusClass = isActive ? 'badge-status-1' : 'badge-status-0';

            // Action Button: Logic to toggle
            const btnClass = isActive ? 'btn-outline-danger' : 'btn-outline-success';
            const btnIcon = isActive ? 'fa-ban' : 'fa-check';
            const btnText = isActive ? 'حظر' : 'تفعيل';
            const newStatus = isActive ? 0 : 1;

            const tr = `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white me-2" style="width:35px; height:35px; font-size:0.8rem;">
                                ${user.fullName ? user.fullName.charAt(0) : 'U'}
                            </div>
                            <span class="fw-bold">${user.fullName || 'بدون اسم'}</span>
                        </div>
                    </td>
                    <td class="text-muted small">${user.email || '-'}</td>
                    <td><span class="badge bg-light text-dark border">${user.type || 'user'}</span></td>
                    <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                    <td>
                        ${user.type === 'admin' ? '<span class="text-muted small">لا يمكن تعديله</span>' : `
                        <button class="btn btn-sm ${btnClass} btn-action" 
                                data-uid="${uid}" 
                                data-new-status="${newStatus}">
                            <i class="fas ${btnIcon} me-1"></i> ${btnText}
                        </button>
                        `}
                    </td>
                </tr>
            `;
            usersList.append(tr);
        });
    }

    // Toggle Action
    $(document).on('click', '.btn-action', async function () {
        const uid = $(this).data('uid');
        const newStatus = $(this).data('new-status');
        const btn = $(this);

        if (!confirm('هل أنت متأكد من تغيير حالة هذا المستخدم؟')) return;

        // Optimistic UI update or Wait? Let's wait
        btn.prop('disabled', true);

        try {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, { status: newStatus });

            // Reload page or just swap UI (Reload is safer for simple implementation to re-render all states)
            // But let's try to just reload to keep it simple and correct
            location.reload();

        } catch (err) {
            console.error("Update failed", err);
            alert("فشلت العملية: " + err.message);
            btn.prop('disabled', false);
        }
    });

});
