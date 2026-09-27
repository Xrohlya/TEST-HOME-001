const topics = [
  {
    id: 1,
    type: "deep",
    title: "Иллюзия прозрачности",
    hint: "Почему кажется, что все видят, как вы волнуетесь на выступлении",
  },
  {
    id: 2,
    type: "deep",
    title: "Эффект дверного проёма",
    hint: "Почему, войдя в комнату, забываешь, зачем пришёл",
  },
  {
    id: 3,
    type: "deep",
    title: "Тёмные паттерны",
    hint: "Как интерфейсы незаметно подталкивают к нужному действию",
  },
  {
    id: 4,
    type: "quick",
    title: "Свобода или стабильность",
    hint: "Что важнее в работе и почему",
  },
  {
    id: 5,
    type: "quick",
    title: "Город будущего",
    hint: "Опишите город, в котором хочется жить",
  },
];

const state = {
  tab: "today",
  mode: "quick",
  topic: null,
  streak: 1,
  free: 2,
  purchased: 0,
  subscription: "нет",
  progress: [
    { title: "Иллюзия прозрачности", date: "27 сентября", status: "тренировка без разбора" },
  ],
  timer: null,
};

const screen = document.querySelector("#screen");
const tabs = [...document.querySelectorAll(".tab")];

function setTab(tab) {
  state.tab = tab;
  tabs.forEach((button) => button.classList.toggle("is-active", button.dataset.tab === tab));
  render();
}

function setMode(mode) {
  state.mode = mode;
  state.topic = null;
  renderToday();
}

function pickTopic() {
  const pool = topics.filter((topic) => topic.type === state.mode);
  const currentId = state.topic?.id;
  const nextPool = pool.length > 1 ? pool.filter((topic) => topic.id !== currentId) : pool;
  state.topic = nextPool[Math.floor(Math.random() * nextPool.length)];
  renderToday();
}

function render() {
  if (state.tab === "progress") renderProgress();
  else if (state.tab === "profile") renderProfile();
  else renderToday();
}

function renderToday() {
  const topic = state.topic;
  screen.innerHTML = `
    <section>
      <div class="logo-mark">Голос</div>
      <div class="challenge">
        <div>
          <div class="dots">
            ${Array.from({ length: 14 }, (_, index) => `<span class="dot ${index === 0 ? "done" : ""}"></span>`).join("")}
          </div>
          <p class="hint" style="margin-top:10px">Челлендж 14 дней · сегодня отмечен · 1 из 14</p>
        </div>
        <span class="streak-chip">◌ ${state.streak} день</span>
      </div>
    </section>

    <section class="control-row">
      <button class="select-pill" data-action="language">◎ Русский</button>
      <button class="select-pill" data-action="themes">✦ Все темы</button>
    </section>

    <section class="mode-toggle" aria-label="Режим">
      <button class="${state.mode === "quick" ? "is-active" : ""}" data-mode="quick">С ходу <small>30 сек</small></button>
      <button class="${state.mode === "deep" ? "is-active" : ""}" data-mode="deep">Глубоко <small>10 мин</small></button>
    </section>

    <section class="hero">
      <div class="label">${topic ? "Ваша тема" : "Готовы?"}</div>
      <h1 class="topic ${topic ? "" : "is-placeholder"}">${topic ? topic.title : state.mode === "deep" ? "Крутите — выпадет понятие" : "Крутите — тема выпадет сама"}</h1>
      <p class="hint">${topic ? topic.hint : state.mode === "deep" ? "10 минут разобраться, 2 минуты объяснить" : "30 секунд подумать, минута говорить вслух"}</p>
      <div class="control-row">
        ${
          topic
            ? `<button class="primary-pill" data-action="start">✦ Начать</button><button class="ghost-pill" data-action="reroll">⇄ Другая</button>`
            : `<button class="primary-pill" data-action="spin">⇄ Крутить</button>`
        }
      </div>
      <div class="quota">Бесплатных разборов: ${state.free} из 3</div>
    </section>
  `;
}

function renderPrep() {
  const total = state.mode === "deep" ? 600 : 30;
  renderTimer({
    phase: state.mode === "deep" ? "Разбирайтесь" : "Подышите и подумайте",
    total,
    left: total,
    note: state.mode === "deep" ? "Что это → как работает → пример из жизни" : "Мысль → причина → пример → вывод",
    primary: state.mode === "deep" ? "Я готова, говорю" : "Говорить сейчас",
    action: "record",
    secondary: "Закрыть",
  });
}

function renderRecord() {
  renderTimer({
    phase: "Идёт запись",
    total: state.mode === "deep" ? 120 : 60,
    left: state.mode === "deep" ? 120 : 60,
    note: "Для разбора нужно хотя бы 20 секунд",
    primary: "Закончить",
    action: "done",
    secondary: "Отменить",
  });
}

function renderTimer({ phase, total, left, note, primary, action, secondary }) {
  clearInterval(state.timer);
  let remaining = left;
  const topic = state.topic;

  const draw = () => {
    const minutes = String(Math.floor(remaining / 60));
    const seconds = String(remaining % 60).padStart(2, "0");
    const progress = `${Math.round(((total - remaining) / total) * 360)}deg`;
    screen.innerHTML = `
      <section class="timer-card">
        <div class="label">${topic.title}</div>
        <p class="hint">${topic.hint}</p>
        <div class="label">${phase}</div>
        <div class="timer-ring" style="--progress:${progress}">
          <div class="time">${minutes}:${seconds}</div>
        </div>
        <p class="hint">${note}</p>
        <div class="control-row">
          <button class="primary-pill ${action === "done" ? "lime" : ""}" data-action="${action}">${primary}</button>
          <button class="ghost-pill" data-action="close">${secondary}</button>
        </div>
      </section>
    `;
  };

  draw();
  state.timer = setInterval(() => {
    remaining = Math.max(0, remaining - 1);
    if (action === "done" && remaining < total - 20) note = "Отлично, продолжайте";
    draw();
    if (remaining === 0) clearInterval(state.timer);
  }, 1000);
}

function renderDone() {
  clearInterval(state.timer);
  state.streak = Math.max(state.streak, 1);
  if (!state.progress.some((item) => item.title === state.topic.title)) {
    state.progress.unshift({ title: state.topic.title, date: "сегодня", status: "в обработке" });
  }
  screen.innerHTML = `
    <section class="timer-card">
      <div class="label">Готово</div>
      <h1 class="topic">${state.mode === "deep" ? "Две минуты без остановки" : "Минута без остановки"}</h1>
      <p class="hint">Тренировка засчитана в серию: ${state.streak} день подряд</p>
      <button class="primary-pill" data-action="home">На главную</button>
      <button class="ghost-pill" data-action="paywall">Получить разбор</button>
    </section>
  `;
}

function renderProgress() {
  screen.innerHTML = `
    <section class="panel" style="text-align:center">
      <div class="big-number">${state.streak}</div>
      <strong>день подряд</strong>
    </section>
    <section class="calendar">
      ${Array.from({ length: 14 }, (_, index) => `<span class="day ${index === 0 ? "done" : index === 1 ? "today" : ""}">${index + 1}</span>`).join("")}
    </section>
    <section class="list">
      ${state.progress.map((item) => `
        <div class="list-row">
          <span><b>${item.title}</b><small>${item.date} · ${item.status}</small></span>
          <span>›</span>
        </div>
      `).join("")}
    </section>
  `;
}

function renderProfile() {
  screen.innerHTML = `
    <section class="panel" style="text-align:center">
      <div class="label">Профиль</div>
      <h1 class="topic" style="font-size:34px">Alexsei</h1>
    </section>
    <section class="list">
      <div class="list-row"><span><b>Бесплатные разборы</b><small>3 за 48 часов</small></span><span class="big-number">${state.free}</span></div>
      <div class="list-row"><span><b>Купленные разборы</b></span><span class="big-number">${state.purchased}</span></div>
      <div class="list-row"><span><b>Подписка</b><small>${state.subscription}</small></span></div>
      <div class="list-row"><span><b>Напоминание</b><small>Бот напомнит, если вы ещё не тренировались</small></span><input type="time" value="12:30"></div>
    </section>
    <button class="primary-pill" data-action="paywall">Купить разборы</button>
    <button class="ghost-pill" data-action="delete">Удалить аккаунт и записи</button>
  `;
}

function renderPaywall() {
  screen.innerHTML = `
    <section class="panel" style="text-align:center">
      <div class="label">Разборы</div>
      <h1 class="topic" style="font-size:34px">Нужно больше разборов?</h1>
      <p class="hint" style="margin:auto">Бесплатно: ${state.free} из 3 за 48 часов.</p>
    </section>
    <section class="pay-grid">
      <button class="product"><span><b>1 разбор</b><small>Один разбор</small></span><span class="stars">5 ⭐</span></button>
      <button class="product is-best"><span><b>10 разборов</b><small>3,5 ⭐ за разбор</small></span><span class="stars">35 ⭐</span></button>
      <button class="product"><span><b>30 разборов</b><small>3,0 ⭐ за разбор</small></span><span class="stars">89 ⭐</span></button>
      <button class="product"><span><b>Подписка на 30 дней</b><small>до 10 разборов в день</small></span><span class="stars">149 ⭐</span></button>
    </section>
    <button class="ghost-pill" data-action="practice">Тренироваться без разбора</button>
    <button class="ghost-pill" data-action="home">Закрыть</button>
  `;
}

function renderThemeSheet() {
  const sheet = document.createElement("section");
  sheet.className = "sheet";
  sheet.innerHTML = `
    <div class="grab"></div>
    <h2>Откуда брать темы</h2>
    <p class="hint">Все обычные списки · 389 тем</p>
    ${["Мнение", "О себе", "Истории", "Одно слово", "Объяснить", "Работа", "Учёба"].map((name, index) => `
      <button class="topic-option" data-action="close-sheet">
        <b>${name}</b>
        <span>${[60, 37, 35, 50, 20, 30, 18][index]}</span>
      </button>
    `).join("")}
    <button class="primary-pill" data-action="close-sheet" style="width:100%;margin-top:14px">Готово · 389 тем</button>
  `;
  document.body.appendChild(sheet);
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  const tab = target.dataset.tab;
  const action = target.dataset.action;
  const mode = target.dataset.mode;

  if (tab) setTab(tab);
  if (mode) setMode(mode);
  if (action === "spin" || action === "reroll") pickTopic();
  if (action === "themes") renderThemeSheet();
  if (action === "close-sheet") target.closest(".sheet")?.remove();
  if (action === "start") renderPrep();
  if (action === "record") renderRecord();
  if (action === "done") renderDone();
  if (action === "home" || action === "close") setTab("today");
  if (action === "paywall") renderPaywall();
  if (action === "practice") {
    state.mode = state.mode || "deep";
    if (!state.topic) state.topic = topics.find((topic) => topic.type === state.mode);
    renderTimer({
      phase: "Говорите вслух",
      total: state.mode === "deep" ? 120 : 60,
      left: state.mode === "deep" ? 120 : 60,
      note: "Без записи — только таймер",
      primary: "Закончить",
      action: "done",
      secondary: "Закрыть",
    });
  }
  if (action === "delete") alert("Макет: здесь будет подтверждение удаления.");
});

render();
