import { loadPartials, checkAuth } from './common.js';
import { db, collection, query, where, orderBy, getDocs, doc, getDoc } from './firebase-config.js';
import { PageLoader } from './shemmer.js';

loadPartials();
PageLoader.show();

$(document).ready(function () {
    let currentUid = null;
    const historyList = $('#historyList');
    const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));


    checkAuth(async (user) => {
        currentUid = user.uid;
        await fetchHistory(currentUid);
        PageLoader.hide();
    });



    
    async function fetchHistory(uid) {
        try {
            const q = query(
                collection(db, "Suggest"),
                where("uid", "==", uid),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                historyList.html(`
                    <div class="col-12 text-center mt-5">
                        <i class="fas fa-history fa-4x text-muted mb-3 opacity-25"></i>
                        <p class="text-muted lead">لا يوجد سجل نشاطات بعد.</p>
                        <a href="index.html" class="btn btn-primary-custom mt-2">ابدأ الآن</a>
                    </div>
                `);
                return;
            }


            // historyList.empty();

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const card = createHistoryCard(docSnap.id, data);
                historyList.append(card);
            });

        } catch (error) {
            console.error("Error fetching history:", error);
            historyList.html(`<div class="alert alert-danger">حدث خطأ أثناء تحميل السجل.</div>`);
        }
    }

    function createHistoryCard(id, data) {
        const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('ar-EG', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'تاريخ غير معروف';



        // Store data in element for easy access
        const col = $('<div>').addClass('col-md-6 col-lg-4');
        const card = $('<div>').addClass('history-card').attr('data-id', id);

        card.on('click', () => openDetails(data, date));

        card.html(`
            <span class="history-date">${date}</span>
            <div class="history-mood">
                <i class="fas fa-smile me-2 text-warning"></i>
                ${data.userParams.mood || 'مزاج غير محدد'}
            </div>
            <p class="history-desc">${data.userParams.description || 'بدون وصف'}</p>
        `);

        col.append(card);
        return col;
    }

    async function openDetails(data, formattedDate) {
        // Populate Modal Info
        $('#modalMood').text(data.userParams.mood);
        $('#modalDate').text(formattedDate);
        $('#modalDesc').text(data.userParams.description);
        $('#modalAiResponse').text(data.aiResponse);

        const foodsGrid = $('#modalFoodsGrid');
        foodsGrid.empty().append('<div class="text-center w-100 py-3"><div class="spinner-border spinner-border-sm text-primary"></div></div>');

        detailsModal.show();

        // Fetch Foods
        if (data.foodIds && data.foodIds.length > 0) {
            try {
                // Fetch each food document (since 'in' query is limited and we have IDs)
                // Assuming small number of foods per suggestion (average 5)
                const foodPromises = data.foodIds.map(id => getDoc(doc(db, "foods", String(id))));
                const foodSnaps = await Promise.all(foodPromises);

                foodsGrid.empty();

                foodSnaps.forEach(snap => {
                    if (snap.exists()) {
                        const food = snap.data();
                        const foodCard = `
                            <div class="col-6 col-md-4">
                                <div class="mini-food-card">
                                    <img src="${food.image}" class="mini-food-img" alt="${food.title}" onerror="this.src='../../assets/img/default-food.jpg'">
                                    <div class="mini-food-body">
                                        <div class="mini-food-title" title="${food.title}">${food.title}</div>
                                        <div class="mini-nutrition">
                                            <span>🔥 ${food.nutrition.calories}</span>
                                            <span>🥩 ${food.nutrition.protein}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        foodsGrid.append(foodCard);
                    }
                });

                if (foodsGrid.children().length === 0) {
                    foodsGrid.html('<p class="text-muted small text-center w-100">لا توجد تفاصيل للأطعمة متاحة.</p>');
                }

            } catch (err) {
                console.error("Error fetching food details:", err);
                foodsGrid.html('<p class="text-danger small">فشل تحميل تفاصيل الأطعمة.</p>');
            }
        } else {
            foodsGrid.html('<p class="text-muted small w-100">لا توجد أطعمة مقترحة في هذا السجل.</p>');
        }
    }
});
