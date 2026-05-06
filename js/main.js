import { loadPartials, checkAuth } from './common.js';
import { db, doc, setDoc, addDoc, collection, serverTimestamp } from './firebase-config.js';

loadPartials();

$(document).ready(function () {
    const GEMINI_API_KEY = "AIzaSyCdX5MmIB4d9WDC-Mn-grTWxYo3HS3soUc";
    const SPOONACULAR_API_KEY = "84077c45edea47c1b2a9472c95a178fb"; // ضع مفتاحك هنا
    const MODEL_NAME = "gemini-2.5-flash";
    const mealTypeMap = {
        easy: "وجبة سهلة",
        medium: "وجبة متوسطة التحضير",
        hearty: "وجبة دسمة"
    };

    let currentUserData = null;
    let currentUid = null;
    let suggesttRef = null;

    const mealTypeModalElement = document.getElementById('mealTypeModal');
    const mealTypeModal = mealTypeModalElement ? new bootstrap.Modal(mealTypeModalElement) : null;

    checkAuth((user, userData) => {
        currentUserData = userData;
        currentUid = user.uid;
    });

    function resetMealTypeSelection() {
        $('input[name="mealType"]').prop('checked', false);
    }

    function validateBeforeMealTypeStep() {
        const userText = $('#userInput').val().trim();
        const selectedMoodValue = $('input[name="userMood"]:checked').val();

        if (!selectedMoodValue) {
            alert("يرجى اختيار حالتك المزاجية من الأيقونات أولاً");
            return null;
        }

        // if (!userText) {
        //     alert("يرجى كتابة وصف بسيط لما تشعر به");
        //     return null;
        // }

        if (!currentUserData) {
            alert("جاري تحميل بياناتك، يرجى المحاولة بعد لحظات");
            return null;
        }

        return { userText, selectedMoodValue };
    }

    async function submitSuggestion({ userText, selectedMoodValue, selectedMealType }) {
        $('#loader').fadeIn();
        $('#responseArea').fadeOut();
        $('#btnSend').prop('disabled', true);
        $('#btnConfirmMealType').prop('disabled', true);

        const finalPrompt = `
أنت مساعد تغذية ذكي، ومهمتك توليد اقتراحات أطعمة يمكن استخدامها مباشرة لتكوين request مناسب لـ Spoonacular API (complexSearch).

سيتم تزويدك ببيانات مستخدم (قد تكون ناقصة).

مهمتك:
اقتراح وجبات صحية ومحسّنة للمزاج، مع مراعاة التوازن الغذائي، بحيث يكون كل اقتراح قابلًا للتحويل إلى parameters لـ complexSearch.

⚠️ تعليمات صارمة للإجابة:
- الإجابة مختصرة جدًا
- لا تكتب أي مقدمات أو شروحات عامة
- لا تذكر نصائح طبية
- لا تستخدم قيم غير مدعومة في Spoonacular

🔹 صيغة الإخراج (إلزامي):
[
  {
    "query": "meal name maximum 2 words in English",
    "type": "breakfast | lunch | dinner | snack",
    "diet": "high-protein | vegetarian | keto | balanced"
  }
]

بيانات المستخدم:
الاسم: ${currentUserData.fullName || 'مستخدم'}
العمر: ${currentUserData.age || '25'}
الوزن: ${currentUserData.weight || '65'}
الجنس: ${currentUserData.gender || 'ذكر'}
نوع الوجبة المطلوب: ${selectedMealType}
المزاج الحالي: ${selectedMoodValue}، وصف المستخدم: "${userText}"
أعد 3 إلى 5 اقتراحات فقط.

ابدأ الآن.
`;

        console.log(finalPrompt);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: finalPrompt }] }]
                })
            });

            let meals = [];

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            if (data.candidates && data.candidates[0].content) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                // $('#aiContent').text(aiResponse);
                // $('#responseArea').fadeIn();

                const cleanedJson = aiResponse
                    .replace(/^```json\s*/i, '')
                    .replace(/```$/i, '')
                    .trim();

                meals = JSON.parse(cleanedJson);

                if (!Array.isArray(meals)) {
                    throw new Error("Parsed AI response is not an array");
                }

                console.log("Parsed meals:", meals);
                const allRecipes = [];

                for (const meal of meals) {
                    const queryParams = new URLSearchParams({
                        query: meal.query,
                        type: meal.type,
                        diet: meal.diet,
                        addRecipeNutrition: "true",
                        number: "2",
                        apiKey: SPOONACULAR_API_KEY
                    });

                    try {
                        const spoonResponse = await fetch(
                            `https://api.spoonacular.com/recipes/complexSearch?${queryParams.toString()}`
                        );

                        const spoonData = await spoonResponse.json();

                        if (spoonData.results && spoonData.results.length > 0) {
                            allRecipes.push(...spoonData.results);
                        }
                    } catch (e) {
                        console.error("Error fetching recipes for meal:", meal, e);
                    }
                }

                if (allRecipes.length === 0) {
                    alert("لم نتمكن من العثور على نتائج مناسبة حاليًا. حاول تغيير الوصف أو المزاج.");
                    $('#loader').fadeOut();
                    return;
                }

                const uniqueRecipes = Array.from(new Map(allRecipes.map(item => [item.id, item])).values());
                const foodIds = [];

                const foodPromises = uniqueRecipes.map(async (recipe) => {
                    const nutrients = recipe.nutrition?.nutrients || [];

                    const getNutrient = (name) =>
                        nutrients.find(n => n.name === name)?.amount ?? null;

                    const calories = getNutrient("Calories");
                    const protein = getNutrient("Protein");
                    const fat = getNutrient("Fat");
                    const carbs = getNutrient("Carbohydrates");

                    foodIds.push(recipe.id);

                    const foodRef = doc(db, "foods", String(recipe.id));
                    await setDoc(
                        foodRef,
                        {
                            id: recipe.id,
                            title: recipe.title,
                            image: recipe.image,
                            nutrition: {
                                calories: calories,
                                protein: protein,
                                fat: fat,
                                carbs: carbs
                            }
                        },
                        { merge: true }
                    );
                });

                await Promise.all(foodPromises);

                if (currentUid) {
                    suggesttRef = await addDoc(collection(db, "Suggest"), {
                        uid: currentUid,
                        userParams: {
                            mood: selectedMoodValue,
                            description: userText,
                            age: currentUserData.age,
                            weight: currentUserData.weight,
                            gender: currentUserData.gender
                        },
                        aiResponse: aiResponse,
                        foodIds: foodIds,
                        createdAt: serverTimestamp()
                    });
                }

                sessionStorage.setItem('recipeResults', JSON.stringify(uniqueRecipes));
                sessionStorage.setItem('suggesttUid', suggesttRef.id);

                window.location.href = 'result.html';
            }
        } catch (error) {
            console.error("Gemini Error:", error);
            alert("حدث خطأ أثناء التواصل مع الذكاء الاصطناعي: " + error.message);
        } finally {
            $('#loader').hide();
            $('#btnSend').prop('disabled', false);
            $('#btnConfirmMealType').prop('disabled', false);
            resetMealTypeSelection();
        }
    }

    $('#btnSend').on('click', function () {
        const formState = validateBeforeMealTypeStep();
        if (!formState || !mealTypeModal) {
            return;
        }

        mealTypeModal.show();
    });

    $('#btnConfirmMealType').on('click', async function () {
        const formState = validateBeforeMealTypeStep();
        if (!formState) {
            if (mealTypeModal) {
                mealTypeModal.hide();
            }
            return;
        }

        const mealTypeValue = $('input[name="mealType"]:checked').val();
        if (!mealTypeValue || !mealTypeMap[mealTypeValue]) {
            alert("يرجى اختيار نوع الوجبة قبل المتابعة.");
            return;
        }

        if (mealTypeModal) {
            mealTypeModal.hide();
        }

        await submitSuggestion({
            ...formState,
            selectedMealType: mealTypeMap[mealTypeValue]
        });
    });

    if (mealTypeModalElement) {
        mealTypeModalElement.addEventListener('hidden.bs.modal', resetMealTypeSelection);
    }
});
