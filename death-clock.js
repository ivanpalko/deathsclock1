// Конфигурация
const CONFIG = {
    MIN_DEATH_AGE: 70,    // Минимальный возраст смерти (в годах)
    MAX_DEATH_AGE: 100,   // Максимальный возраст смерти (в годах)
    COOKIE_NAME: 'deathClockData',
    COOKIE_EXPIRE_DAYS: 365
};

// Мотивирующие (и не очень) цитаты
const QUOTES = [
    "Время уходит... как и твои шансы всё успеть!",
    "Каждая секунда приближает тебя к финалу. Весело, правда?",
    "Не откладывай на завтра то, что можно не делать никогда!",
    "Помни о смерти, но живи так, как будто у тебя вечность!",
    "Твои часики тикают... Тик-так, тик-так...",
    "Смерть — это природа способа сказать: 'Ваше время вышло'.",
    "У тебя осталось всего лишь %TIME%! Не трать их впустую!",
    "Жизнь — это то, что происходит, пока ты смотришь на эти часы.",
    "Не бойся смерти — бойся непрожитой жизни!",
    "Смерть ждёт всех нас. Но у тебя есть преимущество — ты знаешь когда! (Ну, почти)",
    "Каждая минута — подарок. Или скорее, кредит под высокий процент.",
    "Помни: статистически, ты уже пережил половину отведённого времени. Утешает?",
    "Не волнуйся, в конце концов все мы станем просто набором воспоминаний.",
    "Смерть — единственное, в чём можно быть уверенным. Ну, кроме налогов.",
    "Ты не вечен. Но твои невыполненные дела — вполне могут быть!"
];

class DeathClock {
    constructor() {
        this.deathDate = null;
        this.isPaused = false;
        this.pausedTime = null;
        this.pauseStart = null;
        
        this.init();
        this.startClock();
    }
    
    init() {
        // Пытаемся загрузить из cookies
        const savedData = this.getCookie(CONFIG.COOKIE_NAME);
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.deathDate = new Date(data.deathDate);
                this.isPaused = data.isPaused || false;
                this.pausedTime = data.pausedTime || null;
                
                if (this.isPaused && this.pausedTime) {
                    const pauseDuration = Date.now() - this.pausedTime;
                    this.deathDate = new Date(this.deathDate.getTime() + pauseDuration);
                }
                
                console.log('Загружена сохранённая дата смерти:', this.deathDate);
            } catch (e) {
                console.log('Ошибка загрузки данных, генерируем новую дату смерти');
                this.generateDeathDate();
            }
        } else {
            this.generateDeathDate();
        }
        
        this.setupEventListeners();
        this.updateDisplay();
        this.updateQuote();
    }
    
    generateDeathDate() {
        // Генерируем случайную дату смерти
        const now = new Date();
        const currentAge = 25; // Предполагаемый текущий возраст
        
        // Случайный возраст смерти
        const deathAge = Math.floor(Math.random() * 
            (CONFIG.MAX_DEATH_AGE - CONFIG.MIN_DEATH_AGE + 1)) + CONFIG.MIN_DEATH_AGE;
        
        // Сколько лет осталось
        const yearsLeft = deathAge - currentAge;
        
        // Добавляем случайность в дни (чтобы не было ровно в день рождения)
        const daysLeft = yearsLeft * 365 + Math.floor(Math.random() * 365);
        const hoursLeft = Math.floor(Math.random() * 24);
        const minutesLeft = Math.floor(Math.random() * 60);
        
        // Создаём дату смерти
        this.deathDate = new Date(now);
        this.deathDate.setDate(now.getDate() + daysLeft);
        this.deathDate.setHours(now.getHours() + hoursLeft);
        this.deathDate.setMinutes(now.getMinutes() + minutesLeft);
        
        // Сохраняем в cookies
        this.saveToCookie();
        
        console.log('Сгенерирована новая дата смерти:', this.deathDate);
        console.log('Предполагаемый возраст смерти:', deathAge);
    }
    
    startClock() {
        // Обновляем каждую секунду
        setInterval(() => {
            if (!this.isPaused) {
                this.updateDisplay();
            }
        }, 1000);
    }
    
    updateDisplay() {
        if (!this.deathDate) return;
        
        const now = new Date();
        const totalMs = this.deathDate.getTime() - now.getTime();
        
        if (totalMs <= 0) {
            // Время вышло!
            this.showDeathScreen();
            return;
        }
        
        // Рассчитываем время
        const totalSeconds = Math.floor(totalMs / 1000);
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        // Обновляем часы
        document.getElementById('deathClock').textContent = 
            `${this.formatTime(days)}:${this.formatTime(hours)}:${this.formatTime(minutes)}:${this.formatTime(seconds)}`;
        
        // Обновляем дату смерти
        document.getElementById('deathDate').textContent = 
            `Предполагаемая дата смерти: ${this.deathDate.toLocaleDateString('ru-RU')} в ${this.deathDate.toLocaleTimeString('ru-RU')}`;
        
        // Обновляем статистику
        document.getElementById('statDays').textContent = days;
        document.getElementById('statHours').textContent = hours;
        document.getElementById('statMinutes').textContent = minutes;
        
        // Обновляем прогресс-бар (предполагаемая продолжительность жизни: 80 лет)
        const totalLifeMs = 80 * 365 * 24 * 60 * 60 * 1000;
        const livedMs = totalLifeMs - totalMs;
        const lifePercent = Math.min(100, Math.max(0, (livedMs / totalLifeMs) * 100));
        
        document.getElementById('lifeProgress').style.width = `${lifePercent}%`;
        document.getElementById('statPercent').textContent = `${Math.floor(lifePercent)}%`;
        
        // Обновляем цитату каждые 30 секунд
        if (Math.random() < 0.033) { // Примерно раз в 30 секунд
            this.updateQuote();
        }
    }
    
    showDeathScreen() {
        document.getElementById('deathClock').textContent = "00:00:00:00";
        document.getElementById('deathClock').style.color = "#ff4757";
        document.getElementById('deathClock').style.animation = "blink 0.5s infinite";
        document.getElementById('deathDate').innerHTML = 
            "<span style='color:#ff4757; font-size:1.2em;'>⏰ ВРЕМЯ ВЫШЛО! 💀</span>";
        document.getElementById('lifeProgress').style.width = "100%";
        
        // Меняем все цитаты на мрачные
        const deathQuotes = [
            "Ну вот и всё. Надеюсь, ты всё успел(а).",
            "Поздравляем! Вы успешно завершили игру под названием 'Жизнь'.",
            "Время кончилось. Как и твоё существование.",
            "Конец. Можно выдохнуть. Или уже нет?",
            "Game Over. Вставить монетку для продолжения?",
            "Спасибо за участие! Надеемся, вам понравилось."
        ];
        
        document.getElementById('randomQuote').textContent = 
            deathQuotes[Math.floor(Math.random() * deathQuotes.length)];
    }
    
    updateQuote() {
        const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        const now = new Date();
        const totalMs = this.deathDate.getTime() - now.getTime();
        const days = Math.floor(totalMs / (1000 * 3600 * 24));
        
        // Заменяем плейсхолдеры
        let quote = randomQuote.replace('%TIME%', `${days} дней`);
        
        document.getElementById('randomQuote').textContent = quote;
    }
    
    formatTime(num) {
        return num < 10 ? `0${num}` : num;
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pauseStart = Date.now();
            document.getElementById('pauseBtn').textContent = '▶️ Продолжить';
        } else {
            if (this.pauseStart) {
                const pauseDuration = Date.now() - this.pauseStart;
                this.deathDate = new Date(this.deathDate.getTime() + pauseDuration);
                this.pauseStart = null;
                this.saveToCookie();
            }
            document.getElementById('pauseBtn').textContent = '⏸️ Пауза';
        }
        
        this.saveToCookie();
        this.updateDisplay();
    }
    
    resetDeathDate() {
        if (confirm("Точно хотите переродиться? Это сгенерирует новую дату смерти!")) {
            this.generateDeathDate();
            this.isPaused = false;
            this.pauseStart = null;
            document.getElementById('pauseBtn').textContent = '⏸️ Пауза';
            this.updateDisplay();
            this.updateQuote();
            
            // Анимация сброса
            document.getElementById('deathClock').style.transform = 'scale(1.1)';
            setTimeout(() => {
                document.getElementById('deathClock').style.transform = 'scale(1)';
            }, 300);
        }
    }
    
    saveToCookie() {
        const data = {
            deathDate: this.deathDate.toISOString(),
            isPaused: this.isPaused,
            pausedTime: this.isPaused ? Date.now() : null
        };
        
        this.setCookie(CONFIG.COOKIE_NAME, JSON.stringify(data), CONFIG.COOKIE_EXPIRE_DAYS);
    }
    
    setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
    }
    
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
        }
        return null;
    }
    
    setupEventListeners() {
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetDeathDate();
        });
    }
}

// Запускаем часы смерти при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new DeathClock();
});
