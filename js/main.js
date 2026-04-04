import { loadPartials, checkAuth } from './common.js';
import { db, doc, setDoc, addDoc, collection, serverTimestamp } from './firebase-config.js';

loadPartials();


$(document).ready(function () {
    const GEMINI_API_KEY = "AIzaSyBfYGLYfPMonzK9xP84q895pC99TojbRu8";
    const SPOONACULAR_API_KEY = "84077c45edea47c1b2a9472c95a178fb"; // ضع مفتاحك هنا
    let currentUserData = null;
    let currentUid = null;
    let suggesttRef = null;

    checkAuth((user, userData) => {
        currentUserData = userData;
        currentUid = user.uid;
    });


    $('#btnSend').on('click', async function () {
        const userText = $('#userInput').val().trim();
        const selectedMoodValue = $('input[name="userMood"]:checked').val();

        if (!selectedMoodValue) {
            alert("يرجى اختيار حالتك المزاجية من الأيقونات أولاً");
            return;
        }
        // if (!userText) {
        //     alert("يرجى كتابة وصف بسيط لما تشعر به");
        //     return;
        // }
        if (!currentUserData) {
            alert("جاري تحميل بياناتك، يرجى المحاولة بعد لحظات");
            return;
        }

        $('#loader').fadeIn();
        $('#responseArea').fadeOut();
        $(this).prop('disabled', true);

        // Prompt الجديد لـ findByNutrients
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
    "diet": "high-protein | vegetarian | keto | balanced",
  }
]

بيانات المستخدم:
الاسم: ${currentUserData.fullName || 'مستخدم'}
العمر: ${currentUserData.age || '25'}
الوزن: ${currentUserData.weight || '65'}
الجنس: ${currentUserData.gender || 'ذكر'}
المزاج الحالي: ${selectedMoodValue}, وصف المستخدم: "${userText}"
أعد 3 إلى 5 اقتراحات فقط.

ابدأ الآن.
`;

        console.log(finalPrompt);

        const MODEL_NAME = "gemini-2.5-flash";

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "contents": [{ "parts": [{ "text": finalPrompt }] }]
                })
            });

            let meals = [];

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            if (data.candidates && data.candidates[0].content) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                $('#aiContent').text(aiResponse);
                $('#responseArea').fadeIn();


                // === تحويل النص الناتج إلى طلبات Spoonacular findByNutrients ===
                const cleanedJson = aiResponse
                    .replace(/^```json\s*/i, '')
                    .replace(/```$/i, '')
                    .trim();

                meals = JSON.parse(cleanedJson);

                if (!Array.isArray(meals)) {
                    throw new Error("Parsed AI response is not an array");
                }

                console.log("Parsed meals:", meals);
                let allRecipes = [];

                // تنفيذ كل طلب لكل وجبة
                for (let meal of meals) {
                    const queryParams = new URLSearchParams({
                        query: meal.query,
                        type: meal.type,
                        diet: meal.diet,
                        // maxCalories: meal.maxCalories,
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
                    $(this).prop('disabled', false);
                    $('#loader').fadeOut();
                    return;
                }


                // إزالة التكرار بناءً على ID
                const uniqueRecipes = Array.from(new Map(allRecipes.map(item => [item.id, item])).values());
                const foodIds = [];

                // 1. تخزين بيانات الاطعام في collection foods بدون تكرار
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


                // 2. تخزين بيانات عملية المستخدم في collection Suggest
                if (currentUid) {
                   suggesttRef= await addDoc(collection(db, "Suggest"), {
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

                // حفظ النتائج في SessionStorage
                sessionStorage.setItem('recipeResults', JSON.stringify(uniqueRecipes));
                sessionStorage.setItem('suggesttUid', suggesttRef.id);

                // التوجيه لصفحة النتائج
                window.location.href = 'result.html';

            }

        } catch (error) {
            console.error("Gemini Error:", error);
            alert("حدث خطأ أثناء التواصل مع الذكاء الاصطناعي: " + error.message);
        } finally {
            $('#loader').hide();
            $(this).prop('disabled', false);
        }
    });
});




