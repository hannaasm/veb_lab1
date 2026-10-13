let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

const notePattern = [
    { name: 'C', isBlack: false },
    { name: 'C#', isBlack: true },
    { name: 'D', isBlack: false },
    { name: 'D#', isBlack: true },
    { name: 'E', isBlack: false },
    { name: 'F', isBlack: false },
    { name: 'F#', isBlack: true },
    { name: 'G', isBlack: false },
    { name: 'G#', isBlack: true },
    { name: 'A', isBlack: false },
    { name: 'A#', isBlack: true },
    { name: 'B', isBlack: false }
];

const startOctave = 3;
const endOctave = 5;
const pianoContainer = document.getElementById('interactivePiano');

function getFrequency(noteIndexInOctave, octave) { // частота звука
    const midiNumber = (octave + 1) * 12 + noteIndexInOctave;
    return 440 * Math.pow(2, (midiNumber - 69) / 12); // 69-A(440). 
}

function playNote(frequency) {  // Web Audio API
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 2.2);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 1.2);
}

if (pianoContainer) { //  Генерация интерфейса клавиш (DOM). Цикл проходится по октавам и массиву нот, создавая элементы div для каждой клавиши
    for (let octave = startOctave; octave <= endOctave; octave++) {
        notePattern.forEach((note, index) => {
            const key = document.createElement('div');
            key.className = 'key' + (note.isBlack ? ' black' : '');
            const frequency = getFrequency(index, octave);

            key.addEventListener('mousedown', () => playNote(frequency));
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                playNote(frequency);
            });

            pianoContainer.appendChild(key);
        });
    }
}

// Основная
const canvas = document.getElementById('coordinateCanvas');
const ctx = canvas.getContext('2d');
const form = document.getElementById('checkForm');
const xSelect = document.getElementById('field_x');
const yInput = document.getElementById('field_y');
const rSelect = document.getElementById('field_r');
const yError = document.getElementById('y-error');
const tableBody = document.getElementById('resultTableBody');
const clearBtn = document.getElementById('clearBtn');

let results = [];

try {
    const saved = localStorage.getItem('lab1_results_22707');
    if (saved) {
        results = JSON.parse(saved);
    }
} catch (e) {
    console.error("Ошибка при чтении из LocalStorage", e);
}

function checkHit(x, y, r) {
    //if R < 0 => неккоректно т.к. x**2 + y**2 <= r**2

    // 1. Первая четверть
    //  сектор круга (x >= 0, y >= 0)
    if (x >= 0 && y >= 0 && (x * x + y * y <= r * r)) {
        return true;
    }
    // 2. Вторая четверть
    //  прямоугольник (-R/2 <= x <= 0, 0 <= y <= R)
    if (x <= 0 && y >= 0 && (x >= -r / 2) && (y <= r)) {
        return true;
    }
    // 3. Третья четверть
    //  треугольник (x <= 0, y <= 0)
    if (x <= 0 && y <= 0 && (x >= -r / 2) && (y >= -r) && (y >= -2 * x - r)) {
        return true;
    }
    return false;
}

function drawCanvas() {
    // Получаем цвета из CSS :root
    const rootStyles = getComputedStyle(document.documentElement);
    const figureFill = rootStyles.getPropertyValue('--canvas-figure-fill').trim();
    const figureStroke = rootStyles.getPropertyValue('--canvas-figure-stroke').trim();
    const axisColor = rootStyles.getPropertyValue('--canvas-axis').trim();
    const hitColor = rootStyles.getPropertyValue('--canvas-hit').trim();
    const missColor = rootStyles.getPropertyValue('--canvas-miss').trim();

    const r = parseFloat(rSelect.value) || 2;
                                    // масштаб:
    const width = canvas.width;     // Физическая ширина canvas в пикселях
    const height = canvas.height;
    const cx = width / 2;           //  Центр canvas по оси X
    const cy = height / 2;          // Центр canvas по оси Y
    const scale = (cx * 0.72) / r;  // Масштабный коэффициент

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = figureFill;
    ctx.strokeStyle = figureStroke;
    ctx.lineWidth = 1.5;

    // 1-я четверть
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r * scale, -Math.PI / 2, 0, false);
    ctx.closePath();
    ctx.fill();

    // 2-я четверть
    ctx.beginPath();
    ctx.rect(cx - (r / 2) * scale, cy - r * scale, (r / 2) * scale, r * scale);
    ctx.fill();

    // 3-я четверть
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - (r / 2) * scale, cy);
    ctx.lineTo(cx, cy + r * scale);
    ctx.closePath();
    ctx.fill();

    // Оси координат
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.8;

    // Ось X
    ctx.beginPath();
    ctx.moveTo(15, cy);
    ctx.lineTo(width - 15, cy);
    ctx.stroke();

    // Стрелка X
    ctx.beginPath();
    ctx.moveTo(width - 25, cy - 5);
    ctx.lineTo(width - 15, cy);
    ctx.lineTo(width - 25, cy + 5);
    ctx.stroke();

    // Ось Y
    ctx.beginPath();
    ctx.moveTo(cx, height - 15);
    ctx.lineTo(cx, 15);
    ctx.stroke();

    // Стрелка Y
    ctx.beginPath();
    ctx.moveTo(cx - 5, 25);
    ctx.lineTo(cx, 15);
    ctx.lineTo(cx + 5, 25);
    ctx.stroke();

    // Подписи осей
    ctx.fillStyle = axisColor;
    ctx.font = "14px 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("x", width - 20, cy - 14);
    ctx.fillText("y", cx + 16, 20);

    // Засечки и метки
    ctx.font = "12px 'Times New Roman', serif";
    const ticks = [
        // { val: r, label: "R" },
        // { val: r / 2, label: "R/2" },
        // { val: -r / 2, label: "-R/2" },
        // { val: -r, label: "-R" }
        { val: r, label: r.toString() },
        { val: r / 2, label: (r / 2).toString() },
        { val: -r / 2, label: (-r / 2).toString() },
        { val: -r, label: (-r).toString() }
    ];

    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.2;
// массив ticks
// переменная scale влияет на позиционирование текста меток R, -R относительно центра canvas:
// переменная scale задает масштабный коэффициент перевода абстрактных единиц радиуса R в пиксели экрана относительно центра (cx, cy). Чем больше scale, тем дальше от центра canvas располагаются метки 'R' и '-R'
    ticks.forEach(t => {
        const posX = cx + t.val * scale;
        ctx.beginPath();
        ctx.moveTo(posX, cy - 4);
        ctx.lineTo(posX, cy + 4);
        ctx.stroke();
        ctx.fillText(t.label, posX, cy + 16);

        const posY = cy - t.val * scale;
        ctx.beginPath();
        ctx.moveTo(cx - 4, posY);
        ctx.lineTo(cx + 4, posY);
        ctx.stroke();
        ctx.save();
        ctx.textAlign = "left";
        ctx.fillText(t.label, cx + 8, posY);
        ctx.restore();
    });

    ctx.fillText("0", cx - 12, cy + 14);

    // Точки
    results.forEach(pt => {
        const isHitCurrent = checkHit(pt.x, pt.y, r);
        ctx.fillStyle = isHitCurrent ? hitColor : missColor;
        ctx.beginPath();
        ctx.arc(cx + pt.x * scale, cy - pt.y * scale, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.stroke();
    });
}

function formatDateTimeRu(timestamp) {

    // метод toLocaleString
    // Время изменится, так как объект Date в JavaScript всегда хранит время в UTC, а toLocaleString автоматически конвертирует его в локальное время системы.
    // Метод Date.now() (и создание объекта new Date(timestamp)) сохраняет абсолютную временную метку (количество миллисекунд, прошедших с эпохи Unix в UTC). Метод toLocaleString('ru-RU', ...) берёт эту универсальную временную точку и отображает её с учётом текущей системной временной зоны устройства пользователя, поэтому при изменении часового пояса на устройстве отображаемое время сдвинется.
    if (!timestamp) return "—";
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return String(timestamp);
    return d.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function renderTable() {
    tableBody.innerHTML = '';
    results.forEach(res => {
        const tr = document.createElement('tr');
        const hitClass = res.hit ? 'hit-yes' : 'hit-no';
        const hitText = res.hit ? 'Попадание :(' : 'Промах :)';
        const displayTime = formatDateTimeRu(res.timestamp || res.time);

        tr.innerHTML = `
            <td>${res.x}</td>
            <td>${res.y}</td>
            <td>${res.r}</td>
            <td><span class="${hitClass}">${hitText}</span></td>
            <td>${displayTime}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function validateY(showError = true) {
    const raw = yInput.value.trim().replace(',', '.');

    if (raw === '') {
        if (showError) {
            yError.textContent = 'Поле Y не может быть пустым!';
            yError.style.display = 'block';
        }
        return null;
    }

    if (!/^-?\d+(\.\d+)?$/.test(raw)) {
        if (showError) {
            yError.textContent = 'Значение Y должно быть числом!';
            yError.style.display = 'block';
        }
        return null;
    }

    const num = Number(raw);

    if (isNaN(num)) {
        if (showError) {
            yError.textContent = 'Некорректный числовой формат!';
            yError.style.display = 'block';
        }
        return null;
    }

    if (num <= -5 || num >= 5) {
        if (showError) {
            yError.textContent = 'Значение Y должно быть в диапазоне (-5 ... 5)!';
            yError.style.display = 'block';
        }
        return null;
    }

    yError.style.display = 'none';
    return num;
}

yInput.addEventListener('input', () => {
    validateY(false);
});

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const startTime = performance.now();
    const y = validateY(true);
    if (y === null) {
        yInput.focus();
        return;
    }

    const x = parseFloat(xSelect.value);
    const r = parseFloat(rSelect.value);

    if (isNaN(x) || isNaN(r)) {
        alert('Ошибка выбора X или R');
        return;
    }

    const hit = checkHit(x, y, r);
    const timestamp = Date.now();

    results.unshift({
        x: Number(x.toFixed(3)),
        y: Number(y.toFixed(3)),
        r: Number(r.toFixed(3)),
        hit,
        timestamp
    });

    try {
        localStorage.setItem('lab1_results_22707', JSON.stringify(results));
    } catch (err) {
        console.error("Ошибка записи в LocalStorage", err);
    }

    renderTable();
    drawCanvas();
});

clearBtn.addEventListener('click', () => {
    if (confirm('Хотите очистить всю историю проверок?')) {
        results = [];
        try {
            localStorage.removeItem('lab1_results_22707');
        } catch (err) {
            console.error("Ошибка очистки LocalStorage", err);
        }
        renderTable();
        drawCanvas();
    }
});

rSelect.addEventListener('change', () => {
    drawCanvas();
});

renderTable();
drawCanvas();