import { loadPartials, checkAuth } from './common.js';
import { db, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from './firebase-config.js';
import { PageLoader } from './shemmer.js';

loadPartials();
// Moment.js setup
moment.locale('ar');

$(document).ready(function () {
    let currentUser = null;
    let currentUserInfo = null;
    const postsFeed = $('#postsFeed');
    const feedLoader = $('#feedLoader');

    // 1. Auth Check
    checkAuth((user, userData) => {
        currentUser = user;
        currentUserInfo = userData;

        // Initialize Feed after Auth
        initFeed();
    });

    // 2. Create Post
    $('#btnPublish').on('click', async function () {
        const content = $('#postContent').val().trim();
        const btn = $(this);
        const btnText = $('#btnText');
        const btnLoader = $('#btnLoader');
        const errorDiv = $('#postError');

        if (!content) {
            errorDiv.removeClass('d-none').text('يرجى كتابة نص للمنشور أولاً.');
            return;
        }

        if (!currentUser) {
            errorDiv.removeClass('d-none').text('يجب عليك تسجيل الدخول أولاً.');
            return;
        }

        // Loading UI
        btn.prop('disabled', true);
        btnText.addClass('d-none');
        btnLoader.removeClass('d-none');
        errorDiv.addClass('d-none');

        try {
            await addDoc(collection(db, "Posts"), {
                uid: currentUser.uid,
                userUid: currentUser.uid, 
                username: currentUserInfo ? currentUserInfo.fullName : 'مستخدم',
                content: content,
                createdAt: serverTimestamp(),
                profileImage: null // Placeholder, can be extended later
            });

            // Reset UI
            $('#postContent').val('');

        } catch (error) {
            console.error("Error creating post:", error);
            errorDiv.removeClass('d-none').text('حدث خطأ أثناء النشر: ' + error.message);
        } finally {
            btn.prop('disabled', false);
            btnText.removeClass('d-none');
            btnLoader.addClass('d-none');
        }
    });


    // 3. List Posts (Real-time)
    function initFeed() {
        const q = query(
            collection(db, "Posts"),
            orderBy("createdAt", "desc")
        );

        onSnapshot(q, (snapshot) => {
            feedLoader.remove(); 


            if (snapshot.empty) {
                postsFeed.html('<div class="text-center text-muted py-5">لا توجد منشورات بعد. كن أول من يشارك!</div>');
                return;
            }

           
            postsFeed.empty();

            snapshot.forEach((doc) => {
                const post = doc.data();
                const card = createPostCard(doc.id, post);
                postsFeed.append(card);
            });
        }, (error) => {
            console.error("Error fetching posts:", error);
            feedLoader.html('<p class="text-danger">فشل تحميل المنشورات.</p>');
        });
    }

    function createPostCard(id, data) {
        const time = data.createdAt ? moment(data.createdAt.toDate()).fromNow() : 'الآن';
        const initial = data.username ? data.username.charAt(0).toUpperCase() : 'U';

        // Avatar: If profileImage exists use it, else use initial letter style
        const avatarHtml = data.profileImage
            ? `<img src="${data.profileImage}" class="post-avatar" style="object-fit:cover;">`
            : `<div class="post-avatar">${initial}</div>`;

        return `
            <div class="post-card" id="${id}">
                <div class="post-header">
                    ${avatarHtml}
                    <div class="post-meta">
                        <span class="post-username">${data.username || 'مستخدم غير معروف'}</span>
                        <span class="post-time"><i class="far fa-clock me-1"></i>${time}</span>
                    </div>
                </div>
                <div class="post-body">
                    ${escapeHtml(data.content)}
                </div>
                <div class="post-footer">
                    <!-- Can add Like/Comment buttons here later -->
                    <div class="d-flex text-muted gap-3 small">
                        <span><i class="far fa-heart me-1"></i> إعجاب</span>
                        <span><i class="far fa-comment me-1"></i> تعليق</span>
                    </div>
                </div>
            </div>
        `;
    }

    function escapeHtml(text) {
        if (!text) return text;
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
