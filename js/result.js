import { loadPartials, checkAuth } from './common.js';
import { PageLoader } from './shemmer.js';
import { db, doc, updateDoc } from './firebase-config.js';

loadPartials();
PageLoader.show();

$(document).ready(function () {

    // التحقق من المصادقة
    checkAuth(() => {
        PageLoader.hide();
    }, false); // false = لا تقم بالطرد إذا لم يكن مسجلاً، يمكن للعامل الزائر رؤية النتائج (حسب الرغبة)

    // جلب البيانات من SessionStorage
    const storedResults = sessionStorage.getItem('recipeResults');
    const suggesttUid = sessionStorage.getItem('suggesttUid');

    const resultsGrid = $('#resultsGrid');

    if (!storedResults) {
        resultsGrid.html(`
            <div class="col-12 text-center">
                <div class="alert alert-warning">
                    لأسف، لا توجد نتائج لعرضها. يرجى العودة للصفحة الرئيسية والمحاولة مرة أخرى.
                </div>
            </div>
        `);
        return;
    }

    const recipes = JSON.parse(storedResults);

    // تفريغ اللودر
    resultsGrid.empty();

    if (recipes.length === 0) {
        resultsGrid.html(`
            <div class="col-12 text-center">
                <p class="text-muted">لم يتم العثور على وصفات تطابق المعايير.</p>
            </div>
        `);
        return;
    }

    // عرض الكروت
    recipes.forEach(recipe => {
        const nutrients = recipe.nutrition?.nutrients || [];

        const getNutrient = (name) =>
            nutrients.find(n => n.name === name)?.amount ?? null;
        const calories = getNutrient("Calories");
        const protein = getNutrient("Protein");
        const fat = getNutrient("Fat");
        const carbs = getNutrient("Carbohydrates");


        const cardHtml = `
            <div class="col-md-6 col-lg-4">
                <div class="recipe-card">
                    <div class="card-img-wrapper">
                        <img src="${recipe.image}" alt="${recipe.title}" onerror="this.src='../../assets/img/default-food.jpg'">
                    </div>
                    <div class="card-body">
                        <h5 class="recipe-title">${recipe.title}</h5>
                        
                        <div class="nutrition-grid">
                            <div class="nutrition-item">
                                <span>${calories}</span>
                                <span class="nutrition-label">سعرة (kcal)</span>
                            </div>
                            <div class="nutrition-item">
                                <span>${protein}</span>
                                <span class="nutrition-label">بروتين</span>
                            </div>
                            <div class="nutrition-item">
                                <span>${fat}</span>
                                <span class="nutrition-label">دهون</span>
                            </div>
                            <div class="nutrition-item">
                                <span>${carbs}</span>
                                <span class="nutrition-label">كاربوهيدرات</span>
                            </div>
                        </div>

                        <!-- يمكن إضافة زر تفاصيل مستقبلاً يذهب لصفحة تفاصيل الوصفة -->
                        <!-- <button class="btn-details">عرض التفاصيل</button> -->
                    </div>
                </div>
            </div>
        `;

        resultsGrid.append(cardHtml);
    });

    // --- Rating Logic ---
    let selectedRating = 0;

    $('#btnRate').on('click', function () {
        if (!suggesttUid) {
            alert("عذراً، لا يمكن تقييم هذه الجلسة لأنها غير مسجلة.");
            return;
        }
        const modal = new bootstrap.Modal(document.getElementById('ratingModal'));
        modal.show();
    });

    // Star Selection
    $('.star-icon').on('click', function () {
        selectedRating = $(this).data('value');
        updateStarsUI(selectedRating);
        $('#ratingError').addClass('d-none');
    });

    function updateStarsUI(rating) {
        $('.star-icon').each(function () {
            const val = $(this).data('value');
            if (val <= rating) {
                $(this).removeClass('far').addClass('fas');
            } else {
                $(this).removeClass('fas').addClass('far');
            }
        });
    }

    // Submit Rating
    $('#btnSubmitRating').on('click', async function () {
        if (selectedRating === 0) {
            $('#ratingError').removeClass('d-none');
            return;
        }

        const comment = $('#ratingComment').val().trim();
        const btn = $(this);
        const txt = $('#txtSubmit');
        const spinner = $('#spinnerSubmit');

        // Loading state
        btn.prop('disabled', true);
        txt.addClass('d-none');
        spinner.removeClass('d-none');

        try {
            const docRef = doc(db, "Suggest", suggesttUid);
            await updateDoc(docRef, {
                userRating: {
                    stars: selectedRating,
                    comment: comment,
                    createdAt: new Date() // Client timestamp fitting for this
                }
            });

            const modalEl = document.getElementById('ratingModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            $('#btnRate').prop('disabled', true).html('<i class="fas fa-check me-2"></i> تم التقييم').removeClass('btn-warning').addClass('btn-success');

            alert("شكراً لك! تم حفظ تقييمك بنجاح.");

        } catch (error) {
            console.error("Error saving rating:", error);
            alert("حدث خطأ أثناء حفظ التقييم. يرجى المحاولة لاحقاً.");
        } finally {
            btn.prop('disabled', false);
            txt.removeClass('d-none');
            spinner.addClass('d-none');
        }
    });

});
