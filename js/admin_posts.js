// js/admin_posts.js
import { checkAdmin, loadAdminSidebar } from './admin_common.js';
import { db, collection, getDocs, doc, deleteDoc, orderBy, query } from './firebase-config.js';

// Initialize
checkAdmin();
loadAdminSidebar('posts');
moment.locale('ar');

$(document).ready(async function () {
    const postsList = $('#postsList');

    // Load Posts
    try {
        const q = query(collection(db, "Posts"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            postsList.html('<tr><td colspan="4" class="text-center text-muted">لا توجد منشورات.</td></tr>');
            return;
        }

        postsList.empty();
        querySnapshot.forEach(docSnap => {
            const post = docSnap.data();
            const id = docSnap.id;
            const time = post.createdAt ? moment(post.createdAt.toDate()).format('D MMMM YYYY, h:mm a') : '-';

            const tr = `
                <tr>
                    <td class="fw-bold text-primary">${post.username || 'مجهول'}</td>
                    <td>
                        <div class="post-content-preview" title="${post.content}">
                            ${post.content || ''}
                        </div>
                    </td>
                    <td class="text-muted small">${time}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${id}">
                            <i class="fas fa-trash-alt me-1"></i> حذف
                        </button>
                    </td>
                </tr>
            `;
            postsList.append(tr);
        });

    } catch (error) {
        console.error("Error loading posts:", error);
        postsList.html('<tr><td colspan="4" class="text-center text-danger">حدث خطأ أثناء تحميل البيانات.</td></tr>');
    }

    // Delete Action
    $(document).on('click', '.btn-delete', async function () {
        const id = $(this).data('id');
        if (!confirm('هل أنت متأكد من حذف هذا المنشور نهائياً ولا يمكن التراجع؟')) return;

        const btn = $(this);
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i>');

        try {
            await deleteDoc(doc(db, "Posts", id));
            // Remove row from UI
            btn.closest('tr').fadeOut(300, function () { $(this).remove(); });
        } catch (err) {
            console.error("Delete failed", err);
            alert("فشل الحذف: " + err.message);
            btn.prop('disabled', false).html('<i class="fas fa-trash-alt me-1"></i> حذف');
        }
    });

});
