const topics = [
  { id: 1, type: "quick", group: "Голос", title: "Магнетический голос", hint: "За одну минуту объясните, почему тембр влияет на доверие сильнее красивых слов.", image: "voice" },
  { id: 2, type: "quick", group: "Кадр", title: "Речь в камеру", hint: "Представьтесь так, чтобы в первые 10 секунд захотелось слушать дальше.", image: "camera" },
  { id: 3, type: "quick", group: "Дикция", title: "Чистый старт", hint: "Произнесите короткую мысль без слов-паразитов, мягко выделяя опорные слова.", image: "diction" },
  { id: 4, type: "quick", group: "Имидж", title: "Мой речевой образ", hint: "Опишите, каким голосом вы хотите запоминаться после встречи.", image: "portrait" },
  { id: 5, type: "quick", group: "Влияние", title: "Пауза перед главным", hint: "Скажите одну убедительную фразу, используя паузу перед ключевым словом.", image: "pause" },
  { id: 6, type: "quick", group: "Сцена", title: "Без зажима", hint: "Расскажите, что помогает звучать свободно, когда на вас смотрят.", image: "stage" },
  { id: 7, type: "quick", group: "Переговоры", title: "Спокойная уверенность", hint: "Ответьте на неудобный вопрос ровно, ясно и без оправданий.", image: "dialogue" },
  { id: 8, type: "quick", group: "История", title: "Фраза с характером", hint: "Расскажите короткую историю так, чтобы было слышно настроение.", image: "story" },
  { id: 9, type: "deep", group: "Профи", title: "Речевой имидж профессионала", hint: "Разберите, из чего складывается впечатление: голос, темп, паузы, словарь и поза.", image: "pro" },
  { id: 10, type: "deep", group: "Голос", title: "Тембр доверия", hint: "Почему низкая опора, дыхание и спокойный темп делают речь убедительной.", image: "voice" },
  { id: 11, type: "deep", group: "Кадр", title: "Эксперт в эфире", hint: "Как звучать собранно в видео, интервью или публичном разборе.", image: "camera" },
  { id: 12, type: "deep", group: "Дикция", title: "Артикуляционная точность", hint: "Где речь теряет чистоту: окончания, смазанные согласные, слишком быстрый темп.", image: "diction" },
  { id: 13, type: "deep", group: "Влияние", title: "Структура влияния", hint: "Соберите речь по формуле: тезис, причина, пример, мягкий вывод.", image: "influence" },
  { id: 14, type: "deep", group: "Сцена", title: "Свобода самовыражения", hint: "Почему человек говорит ярче, когда перестаёт контролировать каждую секунду.", image: "stage" },
  { id: 15, type: "deep", group: "Практика", title: "Разбор выступления", hint: "Представьте, что вы эксперт: что улучшить в голосе, логике и финальной фразе.", image: "analysis" },
  { id: 16, type: "deep", group: "Образ", title: "Голос как часть стиля", hint: "Как речь поддерживает дорогой визуальный образ, статус и личный бренд.", image: "portrait" },
];

const themeGroups = [
  ["Голос и тембр", 72],
  ["Дикция и артикуляция", 58],
  ["Речь в камеру", 46],
  ["Переговоры", 41],
  ["Публичные выступления", 64],
  ["Речевой имидж", 53],
  ["Истории и самопрезентация", 37],
  ["Экспертные объяснения", 48],
  ["Сложные вопросы", 29],
  ["Свободная речь", 66],
];

const state = {
  tab: "today",
  mode: "quick",
  topic: null,
  spinning: false,
  streak: 5,
  free: 2,
  purchased: 0,
  subscription: "нет",
  progress: [
    { title: "Речь в камеру", date: "сегодня", status: "разбор готов" },
    { title: "Тембр доверия", date: "вчера", status: "тренировка без разбора" },
    { title: "Чистый старт", date: "26 сентября", status: "разбор готов" },
  ],
  timer: null,
};

const screen = document.querySelector("#screen");
const tabs = [...document.querySelectorAll(".tab")];

function setTab(tab) {
  clearInterval(state.timer);
  state.tab = tab;
  tabs.forEach((button) => button.classList.toggle("is-active", button.dataset.tab === tab));
  render();
}

function setMode(mode) {
  if (state.spinning) return;
  state.mode = mode;
  state.topic = null;
  renderToday();
}

function pickTopic() {
  if (state.spinning) return;
  state.spinning = true;
  state.topic = null;
  renderToday();
  window.setTimeout(() => {
    const pool = topics.filter((topic) => topic.type === state.mode);
    state.topic = pool[Math.floor(Math.random() * pool.length)];
    state.spinning = false;
    renderToday();
  }, 780);
}

function render() {
  if (state.tab === "progress") renderProgress();
  else if (state.tab === "profile") renderProfile();
  else renderToday();
}

function topicArt(topic) {
  const name = topic?.image || "idle";
  const label = topic?.group || "Speech Image";
  return `
    <div class="topic-art visual-${name} ${state.spinning ? "is-spinning" : ""}">
      <div class="art-grid"></div>
      <div class="art-signal"></div>
      <div class="ram-spinner" aria-hidden="true"><span class="ram-horns">♈</span></div>
      <span class="art-label">${label}</span>
    </div>
  `;
}

function renderToday() {
  const topic = state.topic;
  const prompt = state.mode === "deep" ? "10 минут подготовки · 2 минуты речи" : "30 секунд подготовки · 1 минута речи";
  screen.innerHTML = `
    <section class="brand-hero">
      <div>
        <p class="eyebrow">Школа речевого имиджа</p>
        <h1>Speech Image Voice</h1>
      </div>
      <div class="mini-score"><b>${state.streak}</b><span>дней</span></div>
    </section>

    <section class="challenge">
      <div>
        <div class="dots">
          ${Array.from({ length: 14 }, (_, index) => `<span class="dot ${index < state.streak ? "done" : index === state.streak ? "today" : ""}"></span>`).join("")}
        </div>
        <p class="hint compact">14 дней речевой свободы · сегодня открыт</p>
      </div>
      <span class="streak-chip">серия</span>
    </section>

    <section class="control-row">
      <button class="select-pill" data-action="language">Русский</button>
      <button class="select-pill" data-action="themes">${themeGroups.length} наборов тем</button>
    </section>

    <section class="mode-toggle" aria-label="Режим">
      <button class="${state.mode === "quick" ? "is-active" : ""}" data-mode="quick">С ходу <small>быстрый голос</small></button>
      <button class="${state.mode === "deep" ? "is-active" : ""}" data-mode="deep">Глубоко <small>экспертно</small></button>
    </section>

    <section class="hero">
      ${topicArt(topic)}
      <div class="topic-copy">
        <div class="label">${state.spinning ? "Выбираем тему" : topic ? topic.group : "Тренажёр речи"}</div>
        <h2 class="topic ${topic ? "" : "is-placeholder"}">${state.spinning ? "Баран крутит колесо" : topic ? topic.title : "Крутите тему под голос"}</h2>
        <p class="hint">${state.spinning ? "Через секунду выпадет карточка с визуалом и заданием." : topic ? topic.hint : prompt}</p>
      </div>
      <div class="control-row">
        ${
          topic
            ? `<button class="primary-pill" data-action="start">Начать практику</button><button class="ghost-pill" data-action="reroll">Другая тема</button>`
            : `<button class="primary-pill" data-action="spin" ${state.spinning ? "disabled" : ""}>Крутить тему</button>`
        }
      </div>
      <div class="quota">Бесплатных AI-разборов: ${state.free} из 3 · можно тренироваться без записи</div>
    </section>
  `;
}

function renderPrep() {
  const total = state.mode === "deep" ? 600 : 30;
  renderTimer({
    phase: state.mode === "deep" ? "Соберите речь" : "Настройте дыхание",
    total,
    left: total,
    note: state.mode === "deep" ? "Тезис -> пример -> интонация -> сильная финальная фраза" : "Одна мысль, ровный темп, пауза перед главным",
    primary: state.mode === "deep" ? "Готов, записываю" : "Говорить сейчас",
    action: "record",
    secondary: "Закрыть",
  });
}

function renderRecord() {
  renderTimer({
    phase: "Идёт запись голоса",
    total: state.mode === "deep" ? 120 : 60,
    left: state.mode === "deep" ? 120 : 60,
    note: "Для красивого разбора нужно хотя бы 20 секунд живой речи.",
    primary: "Закончить",
    action: "done",
    secondary: "Отменить",
  });
}

function renderTimer({ phase, total, left, note, primary, action, secondary }) {
  clearInterval(state.timer);
  let remaining = left;
  const topic = state.topic || topics.find((item) => item.type === state.mode);

  const draw = () => {
    const minutes = String(Math.floor(remaining / 60));
    const seconds = String(remaining % 60).padStart(2, "0");
    const progress = `${Math.round(((total - remaining) / total) * 360)}deg`;
    screen.innerHTML = `
      <section class="timer-card">
        ${topicArt(topic)}
        <div class="label">${phase}</div>
        <h2 class="topic small">${topic.title}</h2>
        <p class="hint">${topic.hint}</p>
        <div class="timer-ring" style="--progress:${progress}"><div class="time">${minutes}:${seconds}</div></div>
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
    if (action === "done" && remaining < total - 20) note = "Хороший отрезок для разбора: держите темп и завершите мысль.";
    draw();
    if (remaining === 0) clearInterval(state.timer);
  }, 1000);
}

function renderDone() {
  clearInterval(state.timer);
  state.streak = Math.max(state.streak, 5);
  if (!state.progress.some((item) => item.title === state.topic.title)) {
    state.progress.unshift({ title: state.topic.title, date: "сегодня", status: "в обработке" });
  }
  screen.innerHTML = `
    <section class="timer-card">
      ${topicArt(state.topic)}
      <div class="label">Запись принята</div>
      <h2 class="topic small">Речь стала материалом для разбора</h2>
      <p class="hint">В демо показываем путь: тренировка, запись, очередь анализа и премиальный пакет разборов.</p>
      <button class="primary-pill" data-action="home">На главную</button>
      <button class="ghost-pill" data-action="paywall">Получить AI-разбор</button>
    </section>
  `;
}

function renderProgress() {
  screen.innerHTML = `
    <section class="panel premium-panel">
      <p class="eyebrow">Динамика</p>
      <div class="big-number">${state.streak}</div>
      <strong>дней подряд звучит практика</strong>
      <p class="hint compact">Фокус недели: темп, пауза, чистая финальная фраза.</p>
    </section>
    <section class="calendar">
      ${Array.from({ length: 14 }, (_, index) => `<span class="day ${index < state.streak ? "done" : index === state.streak ? "today" : ""}">${index + 1}</span>`).join("")}
    </section>
    <section class="list">
      ${state.progress.map((item) => `
        <div class="list-row">
          <span><b>${item.title}</b><small>${item.date} · ${item.status}</small></span>
          <span class="row-arrow">›</span>
        </div>
      `).join("")}
    </section>
  `;
}

function renderProfile() {
  screen.innerHTML = `
    <section class="panel premium-panel">
      <p class="eyebrow">Профиль</p>
      <h2 class="topic small">Alexsei</h2>
      <p class="hint compact">Демо-кабинет клиента: пакет, напоминания, история тренировок.</p>
    </section>
    <section class="list">
      <div class="list-row"><span><b>Бесплатные разборы</b><small>3 за 48 часов</small></span><span class="big-number">${state.free}</span></div>
      <div class="list-row"><span><b>Купленные разборы</b><small>после оплаты звёздами</small></span><span class="big-number">${state.purchased}</span></div>
      <div class="list-row"><span><b>Подписка</b><small>${state.subscription}</small></span></div>
      <div class="list-row"><span><b>Напоминание</b><small>мягкий пинг на ежедневную речь</small></span><input type="time" value="12:30"></div>
    </section>
    <button class="primary-pill" data-action="paywall">Купить разборы</button>
    <button class="ghost-pill" data-action="delete">Удалить аккаунт и записи</button>
  `;
}

function renderPaywall() {
  screen.innerHTML = `
    <section class="panel premium-panel">
      <p class="eyebrow">Speech Image AI</p>
      <h2 class="topic small">Разбор звучания, дикции и образа</h2>
      <p class="hint compact">В демо это витрина монетизации: бесплатный лимит, пакеты и подписка для регулярной практики.</p>
    </section>
    <section class="pay-grid">
      <button class="product"><span><b>1 разбор</b><small>точечно проверить запись</small></span><span class="stars">5 ⭐</span></button>
      <button class="product is-best"><span><b>10 разборов</b><small>лучший старт курса</small></span><span class="stars">35 ⭐</span></button>
      <button class="product"><span><b>30 разборов</b><small>для ежедневной практики</small></span><span class="stars">89 ⭐</span></button>
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
    <h2>Темы Speech Image</h2>
    <p class="hint compact">Наборы для голоса, кадра, дикции и речевого образа · 514 тем</p>
    ${themeGroups.map(([name, count]) => `
      <button class="topic-option" data-action="close-sheet">
        <span><b>${name}</b><small>${count} карточек</small></span>
        <i></i>
      </button>
    `).join("")}
    <button class="primary-pill wide" data-action="close-sheet">Готово · 514 тем</button>
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
      note: "Без записи: только таймер и привычка говорить свободнее.",
      primary: "Закончить",
      action: "done",
      secondary: "Закрыть",
    });
  }
  if (action === "delete") alert("Макет: здесь будет подтверждение удаления.");
});

render();
