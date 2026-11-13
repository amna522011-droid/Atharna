
/* ==========================================
   ATHAR - CLIMATE AWARENESS PLATFORM
   Dark Eco-Tech Edition
   Pure JavaScript - No External Libraries
========================================== */


/* ==========================================
   1. GOVERNORATES DATA
========================================== */

const governorates = {

    Cairo: {
        name: "القاهرة",
        latitude: 30.0444,
        longitude: 31.2357
    },

    Alexandria: {
        name: "الإسكندرية",
        latitude: 31.2001,
        longitude: 29.9187
    },

    Aswan: {
        name: "أسوان",
        latitude: 24.0889,
        longitude: 32.8998
    },

    Luxor: {
        name: "الأقصر",
        latitude: 25.6872,
        longitude: 32.6396
    },

    Giza: {
        name: "الجيزة",
        latitude: 30.0131,
        longitude: 31.2089
    },

    Minya: {
        name: "المنيا",
        latitude: 28.1099,
        longitude: 30.7503
    }

};


/* ==========================================
   2. HELPER FUNCTIONS
========================================== */

function getElement(id) {
    return document.getElementById(id);
}


function showNumber(value, digits = 1) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {
        return "--";
    }

    return Number(value).toFixed(digits);

}


function formatDate(date) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function safeSave(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

    } catch (error) {

        console.warn("Unable to save data:", key);

    }

}


function safeLoad(key, fallback) {

    try {

        const value = localStorage.getItem(key);

        return value ? JSON.parse(value) : fallback;

    } catch (error) {

        return fallback;

    }

}


/* ==========================================
   3. NOTIFICATION SYSTEM
========================================== */

function showToast(message) {

    let toast = getElement("atharToast");

    if (!toast) {

        toast = document.createElement("div");

        toast.id = "atharToast";

        toast.style.cssText = `
            position: fixed;
            bottom: 25px;
            right: 50%;
            transform: translateX(50%) translateY(20px);
            background: #142219;
            color: #39FF88;
            border: 1px solid rgba(57,255,136,0.35);
            padding: 14px 24px;
            border-radius: 14px;
            font-family: Cairo, sans-serif;
            font-size: 14px;
            font-weight: 700;
            z-index: 99999;
            opacity: 0;
            transition: all 0.3s ease;
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
            max-width: 90%;
            text-align: center;
        `;

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.style.opacity = "1";

    toast.style.transform =
        "translateX(50%) translateY(0)";

    clearTimeout(window.atharToastTimer);

    window.atharToastTimer = setTimeout(() => {

        toast.style.opacity = "0";

        toast.style.transform =
            "translateX(50%) translateY(20px)";

    }, 2800);

}


/* ==========================================
   4. CLIMATE DASHBOARD
   Real Weather Data - Open Meteo API
========================================== */

const governorateSelect = getElement("governorate");

const loadClimateButton = getElement("loadClimate");

const temperatureElement = getElement("temperature");

const humidityElement = getElement("humidity");

const windElement = getElement("wind");

const chartStatus = getElement("chartStatus");


async function loadClimateData() {

    if (
        !governorateSelect ||
        !temperatureElement ||
        !humidityElement ||
        !windElement
    ) {
        console.warn("Climate dashboard elements are missing.");
        return;
    }

    const selectedGovernorate =
        governorateSelect.value;

    const location =
        governorates[selectedGovernorate];

    if (!location) {

        if (chartStatus) {
            chartStatus.textContent =
                "اختاري محافظة صحيحة.";
        }

        return;

    }

    if (loadClimateButton) {

        loadClimateButton.disabled = true;

        loadClimateButton.textContent =
            "جاري تحميل البيانات...";

    }

    temperatureElement.textContent = "--";

    humidityElement.textContent = "--";

    windElement.textContent = "--";

    if (chartStatus) {

        chartStatus.textContent =
            "جاري تحميل البيانات المناخية...";

    }

    try {

        const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${location.latitude}` +
            `&longitude=${location.longitude}` +
            `&current=temperature_2m,relative_humidity_2m,wind_speed_10m` +
            `&timezone=Africa%2FCairo`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Weather API Error");
        }

        const data = await response.json();

        const current = data.current;

        if (!current) {
            throw new Error("Current weather data is unavailable.");
        }

        temperatureElement.textContent =
            showNumber(current.temperature_2m);

        humidityElement.textContent =
            showNumber(current.relative_humidity_2m, 0);

        windElement.textContent =
            showNumber(current.wind_speed_10m);

        await loadHistoricalData(location);

        console.log(
            "Climate data loaded successfully:",
            location.name
        );

    }

    catch (error) {

        console.error(error);

        if (chartStatus) {

            chartStatus.textContent =
                "تعذر تحميل البيانات. تأكدي من اتصال الإنترنت وحاولي مرة أخرى.";

        }

    }

    finally {

        if (loadClimateButton) {

            loadClimateButton.disabled = false;

            loadClimateButton.textContent =
                "عرض البيانات";

        }

    }

}


if (loadClimateButton) {

    loadClimateButton.addEventListener(
        "click",
        loadClimateData
    );

}


/* ==========================================
   5. HISTORICAL CLIMATE DATA
========================================== */

async function loadHistoricalData(location) {

    try {

        const endDate = new Date();

        // نستخدم الأيام السابقة لتجنب
        // عدم اكتمال بيانات اليوم الحالي.

        endDate.setDate(
            endDate.getDate() - 2
        );

        const startDate = new Date(endDate);

        startDate.setDate(
            startDate.getDate() - 13
        );

        const start = formatDate(startDate);

        const end = formatDate(endDate);

        const url =
            `https://archive-api.open-meteo.com/v1/archive` +
            `?latitude=${location.latitude}` +
            `&longitude=${location.longitude}` +
            `&start_date=${start}` +
            `&end_date=${end}` +
            `&daily=temperature_2m_mean` +
            `&timezone=Africa%2FCairo`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Historical API Error");
        }

        const data = await response.json();

        const dates = data.daily.time;

        const temperatures =
            data.daily.temperature_2m_mean;

        // حفظ البيانات لإعادة رسم الرسم البياني.

        window.lastClimateLabels = dates;

        window.lastClimateValues = temperatures;

        drawClimateChart(
            dates,
            temperatures
        );

        if (chartStatus) {

            chartStatus.textContent =
                `متوسط درجات الحرارة اليومية خلال الفترة من ${start} إلى ${end} - ${location.name}`;

        }

    }

    catch (error) {

        console.error(error);

        if (chartStatus) {

            chartStatus.textContent =
                "تعذر تحميل البيانات التاريخية حاليًا.";

        }

    }

}


/* ==========================================
   6. DRAW CLIMATE CHART
   Canvas - Dark Eco-Tech Theme
========================================== */

function drawClimateChart(labels, values) {

    const canvas = getElement("climateChart");

    if (!canvas) return;

    if (!Array.isArray(labels) || !Array.isArray(values)) {
        return;
    }

    const context = canvas.getContext("2d");

    if (!context) return;

    const width = canvas.clientWidth;

    if (width <= 0) return;

    const height = 300;

    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;

    canvas.height = height * ratio;

    canvas.style.height = height + "px";

    context.setTransform(
        ratio, 0, 0, ratio, 0, 0
    );

    context.clearRect(
        0, 0, width, height
    );

    const validValues = values.filter(
        value => Number.isFinite(Number(value))
    );

    if (validValues.length < 2) {

        context.fillStyle = "#9AAFA2";

        context.font = "14px Cairo, Arial";

        context.textAlign = "center";

        context.fillText(
            "لا توجد بيانات كافية للرسم",
            width / 2,
            height / 2
        );

        return;

    }

    const padding = {
        top: 25,
        bottom: 45,
        left: 45,
        right: 20
    };

    const chartWidth =
        width - padding.left - padding.right;

    const chartHeight =
        height - padding.top - padding.bottom;

    const minValue =
        Math.floor(Math.min(...validValues) - 2);

    const maxValue =
        Math.ceil(Math.max(...validValues) + 2);

    const range = Math.max(
        1,
        maxValue - minValue
    );


    // Grid lines

    context.strokeStyle =
        "rgba(255,255,255,0.09)";

    context.lineWidth = 1;

    context.font = "11px Arial";

    context.fillStyle = "#9AAFA2";

    context.textAlign = "right";

    for (let i = 0; i <= 4; i++) {

        const y =
            padding.top + (chartHeight / 4) * i;

        context.beginPath();

        context.moveTo(
            padding.left,
            y
        );

        context.lineTo(
            width - padding.right,
            y
        );

        context.stroke();

        const value =
            maxValue - (range / 4) * i;

        context.fillText(
            value.toFixed(0) + "°",
            padding.left - 8,
            y + 4
        );

    }


    // Calculate points

    const points = values.map((value, index) => {

        const x =
            padding.left +
            (index / (values.length - 1)) * chartWidth;

        const y = Number.isFinite(Number(value))
            ? padding.top +
                ((maxValue - Number(value)) / range) * chartHeight
            : null;

        return {
            x,
            y,
            value: Number(value)
        };

    });


    // Gradient area

    const gradient = context.createLinearGradient(
        0,
        padding.top,
        0,
        height - padding.bottom
    );

    gradient.addColorStop(
        0,
        "rgba(57,255,136,0.25)"
    );

    gradient.addColorStop(
        1,
        "rgba(57,255,136,0.01)"
    );


    // Draw filled area

    const validPoints = points.filter(
        point => point.y !== null
    );

    context.beginPath();

    context.moveTo(
        validPoints[0].x,
        height - padding.bottom
    );

    validPoints.forEach(point => {

        context.lineTo(
            point.x,
            point.y
        );

    });

    context.lineTo(
        validPoints[validPoints.length - 1].x,
        height - padding.bottom
    );

    context.closePath();

    context.fillStyle = gradient;

    context.fill();


    // Draw line

    context.beginPath();

    let firstPoint = true;

    points.forEach(point => {

        if (point.y === null) {
            firstPoint = true;
            return;
        }

        if (firstPoint) {

            context.moveTo(
                point.x,
                point.y
            );

            firstPoint = false;

        } else {

            context.lineTo(
                point.x,
                point.y
            );

        }

    });

    context.strokeStyle = "#39FF88";

    context.lineWidth = 3;

    context.lineJoin = "round";

    context.lineCap = "round";

    context.stroke();


    // Draw points

    points.forEach(point => {

        if (point.y === null) return;

        context.beginPath();

        context.arc(
            point.x,
            point.y,
            3.5,
            0,
            Math.PI * 2
        );

        context.fillStyle = "#39FF88";

        context.fill();

    });


    // Date labels

    context.fillStyle = "#9AAFA2";

    context.font = "10px Arial";

    context.textAlign = "center";

    const step = Math.max(
        1,
        Math.ceil(labels.length / 7)
    );

    labels.forEach((date, index) => {

        if (
            index % step !== 0 &&
            index !== labels.length - 1
        ) {
            return;
        }

        const x = points[index].x;

        context.fillText(
            date.slice(5),
            x,
            height - 15
        );

    });

}


// Redraw chart on resize

window.addEventListener("resize", () => {

    if (
        window.lastClimateLabels &&
        window.lastClimateValues
    ) {

        drawClimateChart(
            window.lastClimateLabels,
            window.lastClimateValues
        );

    }

});


function initializeClimateChart() {

    if (
        governorateSelect &&
        governorateSelect.value
    ) {

        loadClimateData();

    }

}


/* ==========================================
   7. CARBON FOOTPRINT CALCULATOR
========================================== */

const carbonForm = getElement("carbonForm");

const carbonResult = getElement("carbonResult");


if (carbonForm && carbonResult) {

    carbonForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            const electricityInput =
                getElement("electricity");

            const transportInput =
                getElement("transport");

            const plasticInput =
                getElement("plastic");

            if (
                !electricityInput ||
                !transportInput ||
                !plasticInput
            ) {
                return;
            }

            const electricity =
                Number(electricityInput.value);

            const transport =
                Number(transportInput.value);

            const plastic =
                Number(plasticInput.value);


            if (
                electricityInput.value.trim() === "" ||
                transportInput.value.trim() === "" ||
                plasticInput.value.trim() === "" ||
                !Number.isFinite(electricity) ||
                !Number.isFinite(transport) ||
                !Number.isFinite(plastic) ||
                electricity < 0 ||
                transport < 0 ||
                plastic < 0
            ) {

                carbonResult.innerHTML = `
                    <span>⚠️</span>
                    <h3>بيانات غير صحيحة</h3>
                    <p>أدخلي أرقامًا صحيحة وغير سالبة.</p>
                `;

                return;

            }


            /*
              Educational illustrative assumptions:

              Electricity: 0.45 kg CO2 / kWh
              Car:         0.21 kg CO2 / km
              Plastic:     0.08 kg CO2 / bottle

              These are demonstration factors, not official
              Egyptian national emission factors.
            */

            const electricityEmission =
                electricity * 0.45;

            const transportEmission =
                transport * 30 * 0.21;

            const plasticEmission =
                plastic * 4.33 * 0.08;


            const totalEmission =
                electricityEmission +
                transportEmission +
                plasticEmission;


            carbonResult.innerHTML = `

                <span>🌍</span>

                <h3>تقدير بصمتك الكربونية</h3>

                <strong style="
                    color:#39FF88;
                    font-size:38px;
                    font-weight:900;
                ">

                    ${showNumber(totalEmission, 2)}

                </strong>

                <p>
                    كيلوجرام CO₂ تقديري شهريًا
                </p>

                <div style="
                    margin-top:20px;
                    text-align:right;
                    width:100%;
                    font-size:13px;
                    color:#9AAFA2;
                ">

                    <p>
                        الكهرباء:
                        ${showNumber(electricityEmission, 2)} كجم
                    </p>

                    <p>
                        المواصلات:
                        ${showNumber(transportEmission, 2)} كجم
                    </p>

                    <p>
                        الزجاجات البلاستيكية:
                        ${showNumber(plasticEmission, 2)} كجم
                    </p>

                </div>

                <p style="
                    margin-top:15px;
                    font-size:11px;
                    color:#9AAFA2;
                ">

                    النتيجة تقديرية وفق معاملات تعليمية افتراضية،
                    وليست قياسًا رسميًا لانبعاثاتك.

                </p>

            `;

        }
    );

}


/* ==========================================
   8. FUTURE CITY SIMULATOR
========================================== */

const greenSpaces = getElement("greenSpaces");

const solarEnergy = getElement("solarEnergy");

const publicTransport = getElement("publicTransport");

const greenValue = getElement("greenValue");

const solarValue = getElement("solarValue");

const transportValue = getElement("transportValue");


function updateSimulatorValues() {

    if (greenSpaces && greenValue) {

        greenValue.textContent =
            greenSpaces.value + "%";

    }

    if (solarEnergy && solarValue) {

        solarValue.textContent =
            solarEnergy.value + "%";

    }

    if (publicTransport && transportValue) {

        transportValue.textContent =
            publicTransport.value + "%";

    }

}


if (greenSpaces) {

    greenSpaces.addEventListener(
        "input",
        updateSimulatorValues
    );

}

if (solarEnergy) {

    solarEnergy.addEventListener(
        "input",
        updateSimulatorValues
    );

}

if (publicTransport) {

    publicTransport.addEventListener(
        "input",
        updateSimulatorValues
    );

}

updateSimulatorValues();


const simulateButton = getElement("simulateButton");


if (simulateButton) {

    simulateButton.addEventListener(
        "click",
        function() {

            if (
                !greenSpaces ||
                !solarEnergy ||
                !publicTransport
            ) {
                return;
            }

            const green = Number(greenSpaces.value);

            const solar = Number(solarEnergy.value);

            const transport =
                Number(publicTransport.value);


            /*
              Simplified educational sustainability model.

              Green spaces: 35%
              Solar energy: 35%
              Public transport: 30%

              This is a hypothetical index,
              not a real environmental measurement.
            */

            const score = Math.round(
                green * 0.35 +
                solar * 0.35 +
                transport * 0.30
            );


            const result =
                getElement("sustainabilityScore");

            const resultBox =
                getElement("simulationResult");

            if (!result || !resultBox) return;

            result.textContent =
                score + "/100";


            let message = "";

            if (score < 35) {

                message =
                    "المدينة تحتاج إلى تحسين قراراتها البيئية.";

            }

            else if (score < 70) {

                message =
                    "المدينة تحرز تقدمًا جيدًا نحو الاستدامة.";

            }

            else {

                message =
                    "سيناريو المدينة يحقق مستوى مرتفعًا من الاستدامة.";

            }


            const messageElement =
                resultBox.querySelector("p");

            if (messageElement) {

                messageElement.textContent =
                    message;

            }


            let details =
                getElement("scenarioDetails");

            if (!details) {

                details =
                    document.createElement("div");

                details.id = "scenarioDetails";

                details.style.marginTop = "20px";

                details.style.fontSize = "13px";

                details.style.color = "#9AAFA2";

                resultBox.appendChild(details);

            }


            details.innerHTML = `

                <p>المساحات الخضراء: ${green}%</p>

                <p>الطاقة الشمسية: ${solar}%</p>

                <p>المواصلات العامة: ${transport}%</p>

                <p style="margin-top:10px;">
                    المؤشر ناتج عن نموذج تعليمي مبسط.
                </p>

            `;

        }
    );

}


/* ==========================================
   9. ECO CHALLENGES
   Save Progress Using LocalStorage
========================================== */

const challengeButtons = document.querySelectorAll(
    ".challenge-button"
);

const completedChallengesElement =
    getElement("completedChallenges");


let completedChallenges = safeLoad(
    "atharChallenges",
    []
);


if (!Array.isArray(completedChallenges)) {
    completedChallenges = [];
}


function updateChallengeDisplay() {

    challengeButtons.forEach(button => {

        const challengeId =
            button.dataset.challenge;

        if (!challengeId) return;

        if (
            completedChallenges.includes(challengeId)
        ) {

            button.classList.add("completed");

            button.textContent =
                "✓ تم إنجاز التحدي";

            button.disabled = true;

        } else {

            button.classList.remove("completed");

            button.textContent =
                "أنجزت التحدي";

            button.disabled = false;

        }

    });


    if (completedChallengesElement) {

        completedChallengesElement.textContent =
            completedChallenges.length;

    }


    safeSave(
        "atharChallenges",
        completedChallenges
    );

}


challengeButtons.forEach(button => {

    button.addEventListener(
        "click",
        function() {

            const challengeId =
                this.dataset.challenge;

            if (
                !challengeId ||
                completedChallenges.includes(challengeId)
            ) {
                return;
            }

            completedChallenges.push(challengeId);

            updateChallengeDisplay();

            showToast(
                "أحسنتِ! تم تسجيل إنجازك البيئي."
            );

        }
    );

});


updateChallengeDisplay();


/* ==========================================
   10. CLIMATE QUIZ
   15 Questions + XP + Levels + Streak
========================================== */

const quizQuestions = [

    {
        question:
            "ما السبب الرئيسي لزيادة الاحتباس الحراري الناتج عن الأنشطة البشرية؟",

        options: [
            "زيادة الأنشطة البركانية فقط",
            "زيادة غازات الدفيئة الناتجة عن الأنشطة البشرية",
            "دوران الأرض حول الشمس"
        ],

        correct: 1,

        explanation:
            "زيادة غازات الدفيئة مثل ثاني أكسيد الكربون والميثان تعزز تأثير الاحتباس الحراري."
    },

    {
        question:
            "أي من المصادر التالية يُعد مصدرًا للطاقة المتجددة؟",

        options: [
            "الفحم",
            "البترول",
            "الطاقة الشمسية"
        ],

        correct: 2,

        explanation:
            "الطاقة الشمسية مصدر متجدد لأنها تعتمد على أشعة الشمس."
    },

    {
        question:
            "ما المقصود بالبصمة الكربونية؟",

        options: [
            "إجمالي انبعاثات غازات الدفيئة المرتبطة بنشاط معين",
            "كمية المياه في البحار",
            "عدد الأشجار في الغابة"
        ],

        correct: 0,

        explanation:
            "البصمة الكربونية تقيس الانبعاثات المرتبطة بالأفراد أو المنتجات أو الأنشطة."
    },

    {
        question:
            "أي سلوك يساعد في ترشيد استهلاك الطاقة؟",

        options: [
            "ترك الأجهزة تعمل دون استخدام",
            "إطفاء الأنوار غير الضرورية",
            "زيادة استهلاك الكهرباء"
        ],

        correct: 1,

        explanation:
            "ترشيد استهلاك الكهرباء يقلل الطاقة المستخدمة وقد يساعد في تقليل الانبعاثات."
    },

    {
        question:
            "لماذا تعتبر المساحات الخضراء مهمة للمدن؟",

        options: [
            "لأنها تزيد التلوث",
            "لأنها تمنع سقوط الأمطار",
            "لأنها توفر الظل وتحسن البيئة الحضرية"
        ],

        correct: 2,

        explanation:
            "المساحات الخضراء توفر الظل وتساعد في تحسين البيئة والتنوع البيولوجي."
    },

    {
        question:
            "ما الغاز الأكثر ارتباطًا بانبعاثات حرق الوقود الأحفوري؟",

        options: [
            "ثاني أكسيد الكربون",
            "الأكسجين",
            "الهيليوم"
        ],

        correct: 0,

        explanation:
            "حرق الفحم والنفط والغاز الطبيعي ينتج كميات كبيرة من ثاني أكسيد الكربون."
    },

    {
        question:
            "أي تصرف يساعد في تقليل النفايات البلاستيكية؟",

        options: [
            "استخدام الأكياس البلاستيكية مرة واحدة",
            "استخدام زجاجة وشنطة قابلة لإعادة الاستخدام",
            "حرق البلاستيك"
        ],

        correct: 1,

        explanation:
            "إعادة استخدام المنتجات تقلل الحاجة إلى تصنيع واستهلاك منتجات جديدة."
    },

    {
        question:
            "ما المقصود بالتنوع البيولوجي؟",

        options: [
            "عدد المباني في المدينة",
            "كمية الأمطار فقط",
            "تنوع الكائنات الحية والأنظمة البيئية"
        ],

        correct: 2,

        explanation:
            "التنوع البيولوجي يشمل تنوع النباتات والحيوانات والكائنات الحية والأنظمة البيئية."
    },

    {
        question:
            "أي وسيلة نقل يمكن أن تساعد في تقليل الانبعاثات للفرد؟",

        options: [
            "استخدام المواصلات العامة",
            "استخدام سيارة خاصة لكل شخص",
            "ترك السيارة تعمل أثناء الانتظار"
        ],

        correct: 0,

        explanation:
            "المواصلات العامة تنقل عددًا أكبر من الأشخاص، وقد تقلل الانبعاثات لكل راكب."
    },

    {
        question:
            "ما فائدة إعادة تدوير الورق؟",

        options: [
            "زيادة استهلاك الموارد",
            "تقليل الحاجة إلى مواد خام جديدة",
            "زيادة النفايات"
        ],

        correct: 1,

        explanation:
            "إعادة تدوير الورق تساعد في تقليل استهلاك المواد الخام والطاقة."
    },

    {
        question:
            "أي من هذه الممارسات يحافظ على المياه؟",

        options: [
            "ترك الصنبور مفتوحًا",
            "غسل السيارات بالمياه الجارية لفترات طويلة",
            "إصلاح تسربات المياه"
        ],

        correct: 2,

        explanation:
            "إصلاح التسربات يمنع إهدار كميات كبيرة من المياه."
    },

    {
        question:
            "ما المقصود بالتكيف مع تغير المناخ؟",

        options: [
            "اتخاذ إجراءات تقلل الأضرار الناتجة عن آثاره",
            "زيادة الانبعاثات",
            "تجاهل الظواهر الجوية"
        ],

        correct: 0,

        explanation:
            "التكيف يشمل الاستعداد للآثار المناخية وتقليل الأضرار المحتملة."
    },

    {
        question:
            "أي نشاط يمكن أن يساعد في مواجهة التصحر؟",

        options: [
            "إزالة الغطاء النباتي",
            "زراعة النباتات المناسبة وحماية التربة",
            "زيادة الرعي الجائر"
        ],

        correct: 1,

        explanation:
            "حماية الغطاء النباتي وإدارة التربة بشكل مستدام يساعدان في الحد من تدهور الأراضي."
    },

    {
        question:
            "ما المقصود بالاقتصاد الدائري؟",

        options: [
            "استهلاك المنتجات ثم التخلص منها",
            "زيادة النفايات",
            "إعادة الاستخدام والإصلاح والتدوير وتقليل الهدر"
        ],

        correct: 2,

        explanation:
            "الاقتصاد الدائري يهدف إلى إبقاء المواد والمنتجات قيد الاستخدام لأطول فترة ممكنة."
    },

    {
        question:
            "ما أحد آثار ارتفاع درجات الحرارة على المدن؟",

        options: [
            "زيادة موجات الحر والإجهاد الحراري",
            "اختفاء الحاجة للمياه",
            "انخفاض درجات الحرارة دائمًا"
        ],

        correct: 0,

        explanation:
            "ارتفاع درجات الحرارة قد يزيد شدة موجات الحر ومخاطر الإجهاد الحراري."
    }

];


let currentQuestion = 0;

let correctAnswers = 0;

let quizScore = 0;

let questionAnswered = false;

let currentStreak = 0;

let bestStreak = 0;


// Persistent XP

let atharXP = Number(
    safeLoad("atharXP", 0)
);

if (!Number.isFinite(atharXP) || atharXP < 0) {
    atharXP = 0;
}


let atharBestScore = Number(
    safeLoad("atharBestScore", 0)
);

if (
    !Number.isFinite(atharBestScore) ||
    atharBestScore < 0
) {
    atharBestScore = 0;
}


let sessionXP = 0;


const questionElement = getElement("question");

const quizOptions =
    document.querySelector(".quiz-options");

const quizFeedback =
    getElement("quizFeedback");

const quizScoreElement =
    getElement("quizScore");

const quizBox =
    document.querySelector(".quiz-box");


let xpPanel = null;

let quizActions = null;


/* ==========================================
   11. PLAYER LEVEL SYSTEM
========================================== */

function getPlayerLevel(xp) {

    if (xp >= 1000) {

        return {
            name: "Climate Legend",
            next: 1500
        };

    }

    if (xp >= 500) {

        return {
            name: "Climate Expert",
            next: 1000
        };

    }

    if (xp >= 250) {

        return {
            name: "Eco Explorer",
            next: 500
        };

    }

    if (xp >= 100) {

        return {
            name: "Green Warrior",
            next: 250
        };

    }

    return {
        name: "Eco Rookie",
        next: 100
    };

}


/* ==========================================
   12. XP PANEL
========================================== */

function createXPPanel() {

    if (!quizBox) return;

    xpPanel = getElement("atharXPPanel");

    if (!xpPanel) {

        xpPanel = document.createElement("div");

        xpPanel.id = "atharXPPanel";

        xpPanel.className = "xp-panel";

        quizBox.insertBefore(
            xpPanel,
            quizBox.firstChild
        );

    }

    updateXPPanel();

}


function updateXPPanel() {

    if (!xpPanel) return;

    const level = getPlayerLevel(atharXP);

    const previousThreshold =
        level.next === 100 ? 0 :
        level.next === 250 ? 100 :
        level.next === 500 ? 250 :
        level.next === 1000 ? 500 :
        1000;

    const progress =
        level.next === 1500
            ? Math.min(100, (atharXP / 1500) * 100)
            : Math.min(
                100,
                ((atharXP - previousThreshold) /
                (level.next - previousThreshold)) * 100
            );

    xpPanel.innerHTML = `

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            flex-wrap:wrap;
            gap:10px;
        ">

            <div>

                <h3 style="
                    color:#39FF88;
                    font-size:16px;
                    margin:0;
                ">
                    🌱 ${level.name}
                </h3>

                <p style="
                    color:#9AAFA2;
                    font-size:12px;
                    margin-top:4px;
                ">
                    مستواك البيئي
                </p>

            </div>

            <div style="text-align:left">

                <strong style="
                    color:#39FF88;
                    font-size:25px;
                ">
                    ${atharXP}
                </strong>

                <span style="
                    color:#9AAFA2;
                    font-size:12px;
                ">
                    XP
                </span>

            </div>

        </div>

        <div class="xp-progress">

            <div
                class="xp-progress-bar"
                style="width:${progress}%"
            ></div>

        </div>

        <p style="
            color:#9AAFA2;
            font-size:11px;
            margin-top:8px;
        ">

            ${
                level.next === 1500
                ? "أنتِ وصلتِ لأعلى مستوى!"
                : `المستوى التالي عند ${level.next} XP`
            }

        </p>

        <p style="
            color:#9AAFA2;
            font-size:11px;
            margin-top:5px;
        ">

            أفضل نتيجة: ${atharBestScore} من ${quizQuestions.length}

        </p>

    `;

}


function addXP(amount) {

    atharXP += amount;

    sessionXP += amount;

    safeSave(
        "atharXP",
        atharXP
    );

    updateXPPanel();

}


/* ==========================================
   13. QUIZ ACTION BUTTON
========================================== */

function createQuizActions() {

    if (!quizBox) return;

    quizActions = getElement("quizActions");

    if (!quizActions) {

        quizActions = document.createElement("div");

        quizActions.id = "quizActions";

        quizActions.style.marginTop = "20px";

        quizBox.appendChild(quizActions);

    }

}


function clearQuizActions() {

    if (quizActions) {
        quizActions.innerHTML = "";
    }

}


function createActionButton(text, callback) {

    if (!quizActions) return;

    const button =
        document.createElement("button");

    button.className = "primary-button";

    button.type = "button";

    button.textContent = text;

    button.style.marginTop = "10px";

    button.addEventListener(
        "click",
        callback
    );

    quizActions.appendChild(button);

}


/* ==========================================
   14. DISPLAY QUESTION
========================================== */

function displayQuestion() {

    if (
        !questionElement ||
        !quizOptions ||
        currentQuestion >= quizQuestions.length
    ) {
        return;
    }

    const question =
        quizQuestions[currentQuestion];

    questionAnswered = false;

    questionElement.textContent =
        `السؤال ${currentQuestion + 1} من ${quizQuestions.length}: ${question.question}`;


    if (quizFeedback) {

        quizFeedback.textContent = "";

        quizFeedback.style.color = "#9AAFA2";

    }

    quizOptions.innerHTML = "";

    clearQuizActions();


    question.options.forEach((option, index) => {

        const button =
            document.createElement("button");

        button.className = "quiz-option";

        button.type = "button";

        button.textContent = option;

        button.dataset.index = index;


        button.addEventListener(
            "click",
            () => checkAnswer(index, button)
        );


        quizOptions.appendChild(button);

    });


    if (quizScoreElement) {

        quizScoreElement.textContent =
            correctAnswers;

    }

}


/* ==========================================
   15. CHECK ANSWER
========================================== */

function checkAnswer(selectedIndex, selectedButton) {

    if (questionAnswered) return;

    questionAnswered = true;

    const question =
        quizQuestions[currentQuestion];

    const allOptions =
        quizOptions.querySelectorAll(".quiz-option");


    allOptions.forEach(button => {

        button.disabled = true;

        const index =
            Number(button.dataset.index);

        if (index === question.correct) {

            button.classList.add("correct");

        }

    });


    if (selectedIndex === question.correct) {

        correctAnswers++;

        currentStreak++;

        bestStreak = Math.max(
            bestStreak,
            currentStreak
        );

        let earnedXP = 20;

        let feedback =
            "✓ إجابة صحيحة! +20 XP. " +
            question.explanation;


        if (currentStreak >= 3) {

            earnedXP += 5;

            feedback =
                "🔥 سلسلة إجابات رائعة! +25 XP. " +
                question.explanation;

        }

        addXP(earnedXP);

        quizFeedback.textContent = feedback;

        quizFeedback.style.color = "#39FF88";

    } else {

        selectedButton.classList.add("wrong");

        currentStreak = 0;

        quizFeedback.textContent =
            "✗ إجابة غير صحيحة. " +
            question.explanation;

        quizFeedback.style.color = "#FF8585";

    }


    if (quizScoreElement) {

        quizScoreElement.textContent =
            correctAnswers;

    }


    if (
        currentQuestion <
        quizQuestions.length - 1
    ) {

        createActionButton(
            "السؤال التالي ←",
            nextQuestion
        );

    } else {

        createActionButton(
            "عرض النتيجة",
            nextQuestion
        );

    }

}


/* ==========================================
   16. NEXT QUESTION
========================================== */

function nextQuestion() {

    currentQuestion++;

    if (
        currentQuestion <
        quizQuestions.length
    ) {

        displayQuestion();

    } else {

        showQuizResult();

    }

}


/* ==========================================
   17. QUIZ RESULT
========================================== */

function showQuizResult() {

    const percentage = Math.round(
        (correctAnswers / quizQuestions.length) * 100
    );

    let message = "";

    let resultTitle = "";


    if (percentage === 100) {

        resultTitle = "Climate Legend!";

        message =
            "ممتاز! كل إجاباتك صحيحة. أنتِ خبيرة مناخية فعلًا!";

    }

    else if (percentage >= 80) {

        resultTitle = "Eco Champion!";

        message =
            "أداء رائع! معلوماتك البيئية قوية جدًا.";

    }

    else if (percentage >= 60) {

        resultTitle = "Green Warrior!";

        message =
            "أداء جيد جدًا! استمري في التعلم.";

    }

    else {

        resultTitle = "Eco Rookie!";

        message =
            "بداية جيدة! كل محاولة بتزود معرفتك.";

    }


    const isNewRecord =
        correctAnswers > atharBestScore;

    if (isNewRecord) {

        atharBestScore = correctAnswers;

        safeSave(
            "atharBestScore",
            atharBestScore
        );

    }


    questionElement.textContent =
        "انتهى الاختبار!";


    quizOptions.innerHTML = `

        <div style="
            text-align:center;
            padding:30px 20px;
            background:rgba(57,255,136,0.07);
            border:1px solid rgba(57,255,136,0.2);
            border-radius:18px;
        ">

            <div style="
                font-size:48px;
                margin-bottom:10px;
            ">
                🌍
            </div>

            <h2 style="
                color:#39FF88;
                font-size:25px;
                margin-bottom:10px;
            ">
                ${resultTitle}
            </h2>

            <h3 style="
                color:#FFFFFF;
                font-size:35px;
                margin:10px 0;
            ">
                ${correctAnswers}/${quizQuestions.length}
            </h3>

            <p style="
                color:#39FF88;
                font-weight:800;
            ">
                ${percentage}% إجابات صحيحة
            </p>

            <p style="
                color:#9AAFA2;
                margin-top:15px;
            ">
                ${message}
            </p>

            <div style="
                margin-top:20px;
                padding:15px;
                background:rgba(255,255,255,0.04);
                border-radius:12px;
            ">

                <p style="color:#9AAFA2;font-size:13px;">
                    نقاط XP المكتسبة في الاختبار
                </p>

                <strong style="
                    color:#39FF88;
                    font-size:28px;
                ">
                    +${sessionXP} XP
                </strong>

                <p style="
                    color:#9AAFA2;
                    font-size:12px;
                    margin-top:8px;
                ">
                    أفضل سلسلة إجابات: ${bestStreak}
                </p>

            </div>

            ${
                isNewRecord
                ? `<p style="
                    color:#B58AFF;
                    margin-top:15px;
                    font-weight:800;
                ">🏆 رقم قياسي جديد!</p>`
                : ""
            }

        </div>

    `;


    if (quizFeedback) {

        quizFeedback.textContent =
            "نتيجتك محفوظة على هذا الجهاز.";

        quizFeedback.style.color =
            "#39FF88";

    }


    updateXPPanel();

    clearQuizActions();

    createActionButton(
        "↻ إعادة الاختبار",
        restartQuiz
    );

    showToast(
        `انتهى الاختبار! حصلتِ على ${sessionXP} XP`
    );

}


/* ==========================================
   18. RESTART QUIZ
========================================== */

function restartQuiz() {

    currentQuestion = 0;

    correctAnswers = 0;

    quizScore = 0;

    currentStreak = 0;

    bestStreak = 0;

    sessionXP = 0;

    questionAnswered = false;

    if (quizScoreElement) {

        quizScoreElement.textContent = "0";

    }

    displayQuestion();

    showToast("بدأ اختبار جديد! بالتوفيق.");

}


/* ==========================================
   19. INITIALIZE QUIZ
========================================== */

function initializeQuiz() {

    if (
        !quizBox ||
        !questionElement ||
        !quizOptions
    ) {

        console.warn(
            "Quiz elements are missing. Quiz was not initialized."
        );

        return;

    }

    createXPPanel();

    createQuizActions();

    displayQuestion();

}


/* ==========================================
   20. SMOOTH NAVIGATION
========================================== */

document.querySelectorAll(
    'a[href^="#"]'
).forEach(link => {

    link.addEventListener(
        "click",
        function(event) {

            const targetId =
                this.getAttribute("href");

            if (
                !targetId ||
                targetId === "#"
            ) {
                return;
            }

            const target =
                document.querySelector(targetId);

            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        }
    );

});


/* ==========================================
   21. INITIALIZE APPLICATION
========================================== */

function initializeAthar() {

    initializeQuiz();

    initializeClimateChart();

    updateChallengeDisplay();

    updateSimulatorValues();

    console.log(
        "ATHAR Dark Eco-Tech Platform Initialized Successfully!"
    );

}


if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAthar
    );

} else {

    initializeAthar();

}


/* ==========================================
   END OF ATHAR JAVASCRIPT
========================================== */
