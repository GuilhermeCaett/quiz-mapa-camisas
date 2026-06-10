const CHECKOUT_URL = "https://pay.cakto.com.br/st63i4q_921898";
const STORAGE_KEY = "mapa_camisas_quiz_state_v2";

// pauses[questionIndex](answer) → string | null
const pauses = {
  1: () => "Você está pagando em média 180% a 400% acima do custo de importação.",
  2: () => "Nem todos os fornecedores trabalham com esse tipo de camisa. Por isso nosso sistema separa os contatos por categoria.",
  3: (answer) => answer === "Nunca"
    ? "A maioria perde dinheiro comprando dos fornecedores errados."
    : "Então você já sabe como é difícil encontrar fornecedores confiáveis.",
  4: () => "Esses são exatamente os problemas que usamos para filtrar os fornecedores.",
  5: (answer) => (answer === "Revenda" || answer === "Uso próprio e revenda")
    ? "Interessante. Alguns usuários relatam margens entre 100% e 300% revendendo modelos populares."
    : null,
  6: () => "Nossa equipe levou meses para mapear e validar os contatos.",
};

const questions = [
  {
    eyebrow: "Análise de perfil",
    title: "Qual seu principal objetivo?",
    subtitle: "Pra gente descobrir qual rota do Mapa Secreto combina mais com você.",
    options: ["Economizar na compra de camisas", "Encontrar camisas difíceis de achar", "Comprar camisas retrô", "Revender camisas para ganhar dinheiro"]
  },
  {
    eyebrow: "Preço atual",
    title: "Quanto você costuma pagar em uma camisa?",
    subtitle: "Essa resposta ajuda a calcular o tamanho da oportunidade que você pode estar deixando passar.",
    options: ["Até R$100", "R$100–200", "R$200–400", "Mais de R$400"],
  },
  {
    eyebrow: "Tipo de camisa",
    title: "Qual tipo de camisa você procura?",
    subtitle: "Nem todo fornecedor trabalha com todos os modelos. Por isso o mapa é separado por categoria.",
    options: ["Versão Torcedor", "Versão Jogador", "Retrôs", "Seleções", "Todas"],
  },
  {
    eyebrow: "Experiência",
    title: "Já comprou camisas importadas antes?",
    subtitle: "Comprar sem saber onde procurar é onde muita gente se enrola.",
    options: ["Nunca", "1 a 3 vezes", "Mais de 3 vezes"],
  },
  {
    eyebrow: "Risco principal",
    title: "Qual seu maior medo ao comprar?",
    subtitle: "Esse é o filtro mais importante para encontrar contatos mais confiáveis.",
    options: ["Qualidade ruim", "Ser enganado", "Demorar para chegar", "Receber tamanho errado"],
    multi: true,
  },
  {
    eyebrow: "Uso",
    title: "Você pretende comprar para:",
    subtitle: "Algumas rotas fazem mais sentido para uso próprio. Outras servem melhor para volume e variedade.",
    options: ["Uso próprio", "Família", "Presentes", "Revenda", "Uso próprio e revenda"],
  },
  {
    eyebrow: "Tempo economizado",
    title: "Quanto tempo você estaria disposto a gastar procurando fornecedores sozinho?",
    subtitle: "A parte difícil não é comprar. É saber quais contatos valem a pena testar.",
    options: ["Menos de 1 hora", "Algumas horas", "Alguns dias", "Algumas semanas"],
  },
  {
    eyebrow: "Prioridade",
    title: "O que seria mais importante para você?",
    subtitle: "Vamos ajustar seu resultado de acordo com o que você mais valoriza.",
    options: ["Melhor preço", "Melhor qualidade", "Maior variedade", "Fornecedores confiáveis"]
  },
  {
    eyebrow: "Gap de conhecimento",
    title: "Quanto você acredita que um vendedor brasileiro paga numa camisa antes de revendê-la?",
    subtitle: "Essa pergunta separa quem só compra de quem entende a oportunidade por trás do mercado.",
    options: ["R$30–50", "R$50–80", "R$80–120", "Mais de R$120"],
  }
];

const state = loadState();
const screen = document.getElementById("screen");
const backBtn = document.getElementById("backBtn");
const resetBtn = document.getElementById("resetBtn");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");

let _navDir = 1; // 1 = avançar, -1 = voltar

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Number.isInteger(saved.step)) return saved;
  } catch (e) {}
  return { step: 0, answers: [], pause: null };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function transition(renderFn) {
  const wrap = screen.parentElement;
  wrap.style.overflow = 'hidden';

  // Clona o conteúdo atual para animação de saída
  const ghost = document.createElement('div');
  ghost.className = 'screen screen-ghost';
  ghost.innerHTML = screen.innerHTML;
  ghost.style.cssText = `
    position:absolute;inset:0;z-index:5;padding:26px 22px 30px;pointer-events:none;
    animation: ${_navDir > 0 ? 'tx-out-left' : 'tx-out-right'} .28s ease forwards;
  `;
  wrap.appendChild(ghost);

  // Renderiza novo conteúdo
  renderFn();

  // Anima entrada do novo conteúdo
  screen.style.animation = 'none';
  void screen.offsetWidth;
  screen.style.animation = `${_navDir > 0 ? 'tx-in-right' : 'tx-in-left'} .32s ease forwards`;

  ghost.addEventListener('animationend', () => ghost.remove(), { once: true });
}

function render(dir = 1) {
  _navDir = dir;
  backBtn.disabled = state.step === 0 && !state.pause;

  const totalScreens = questions.length + 1;
  const currentDisplay = Math.min(state.step + 1, totalScreens);
  const percent = Math.round((currentDisplay / totalScreens) * 100);
  progressText.textContent = state.step < questions.length ? `Etapa ${currentDisplay} de ${totalScreens}` : "Resultado pronto";
  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;

  const onPitch = !state.pause && state.step >= questions.length;
  const onFirst = !state.pause && state.step === 0;
  resetBtn.style.display = (onPitch || onFirst) ? "none" : "";

  if (state.pause) renderPause(state.pause);
  else if (state.step < questions.length) renderQuestion(questions[state.step]);
  else renderLoadingThenResult();
}

function renderQuestion(question) {
  transition(() => {
    screen.innerHTML = `
      ${state.step === 0 ? `<img class="hero-image" src="./assets/produto-mapa-camisas.png" alt="Mapa Secreto das Camisas de Time">` : ""}
      <div class="eyebrow">${question.eyebrow}</div>
      <h2>${question.title}</h2>
      <p class="subtitle">${question.subtitle}</p>
      <p class="select-hint">${question.multi ? "Selecione quantas quiser" : "Selecione uma opção"}</p>
      <div class="options">
        ${question.options.map((option, index) => `
          <button class="option${question.multi ? " option-multi" : ""}" type="button" data-option="${index}">
            ${question.multi ? `<span class="option-check">✓</span>` : ""}
            <span>${option}</span>
            ${!question.multi ? `<span class="option-icon">›</span>` : ""}
          </button>
        `).join("")}
      </div>
      ${question.multi ? `<button class="cta multi-continue" type="button" id="multiContinueBtn" disabled>Continuar →</button>` : ""}
    `;
  });

  if (question.multi) {
    const continueBtn = document.getElementById("multiContinueBtn");
    document.querySelectorAll(".option-multi").forEach(btn => {
      btn.addEventListener("click", () => {
        btn.classList.toggle("selected");
        const anySelected = document.querySelectorAll(".option-multi.selected").length > 0;
        continueBtn.disabled = !anySelected;
      });
    });
    continueBtn.addEventListener("click", () => {
      const chosen = [...document.querySelectorAll(".option-multi.selected")]
        .map(b => question.options[Number(b.dataset.option)]);
      state.answers[state.step] = { question: question.title, answer: chosen.join(", ") };
      const pauseFn = pauses[state.step];
      const msg = pauseFn ? pauseFn(chosen[0]) : null;
      if (msg) {
        state.pause = msg;
      } else {
        state.step += 1;
        state.pause = null;
      }
      saveState();
      render(1);
    });
  } else {
    document.querySelectorAll(".option").forEach(btn => {
      btn.addEventListener("click", () => {
        const chosen = question.options[Number(btn.dataset.option)];
        state.answers[state.step] = { question: question.title, answer: chosen };
        const pauseFn = pauses[state.step];
        const msg = pauseFn ? pauseFn(chosen) : null;
        if (msg) {
          state.pause = msg;
        } else {
          state.step += 1;
          state.pause = null;
        }
        saveState();
        render(1);
      });
    });
  }
}

function renderPause(message) {
  transition(() => {
    screen.innerHTML = `
      <div class="pause-box">
        <div class="pause-icon">💡</div>
        <p class="pause-message">${message}</p>
        <button class="cta pause-cta" type="button" id="pauseContinueBtn">Continuar →</button>
      </div>
    `;
  });

  document.getElementById("pauseContinueBtn").addEventListener("click", () => {
    state.step += 1;
    state.pause = null;
    saveState();
    render(1);
  });
}

function renderLoadingThenResult() {
  transition(() => {
    screen.innerHTML = `
      <div class="loading-box">
        <div class="loader"></div>
        <h2>Analisando seu perfil...</h2>
        <p class="subtitle">Estamos cruzando suas respostas com as rotas do Mapa Secreto.</p>
        <div class="loading-list" id="loadingList"></div>
      </div>
    `;
  });

  const items = [
    "✓ Verificando tipo de camisa ideal",
    "✓ Filtrando fornecedores por categoria",
    "✓ Calculando rota recomendada",
  ];

  items.forEach((text, i) => {
    setTimeout(() => {
      const list = document.getElementById("loadingList");
      if (!list) return;
      const el = document.createElement("span");
      el.className = "loading-item-in";
      el.textContent = text;
      list.appendChild(el);
    }, 900 + i * 1100);
  });

  setTimeout(renderResult, 900 + items.length * 1100 + 700);
}

const carouselImages = [
  "./assets/br-amarela.png",
  "./assets/flamengo.png",
  "./assets/arg-branca.png",
  "./assets/palmeiras.png",
  "./assets/port-vermelha.png",
  "./assets/corinthians.png",
  "./assets/espanha.png",
  "./assets/vasco.png",
  "./assets/fr-azul.png",
  "./assets/arg-azulescuro.png",
  "./assets/br-azul.png",
  "./assets/port-branca.png",
];

function renderResult() {
  const goal = state.answers[0]?.answer || "comprar camisas com mais inteligência";
  const type = state.answers[2]?.answer || "camisas premium";
  const fear = state.answers[4]?.answer || "fornecedores problemáticos";

  transition(() => {
    screen.innerHTML = `
      <div class="eyebrow">Resultado da sua análise</div>
      <h1>Encontramos sua <span class="title-gold">rota ideal</span></h1>
      <p class="subtitle">Com base nas suas respostas, seu perfil combina com fornecedores focados em <strong>${type}</strong>, principalmente para quem quer <strong>${goal.toLowerCase()}</strong>.</p>

      <div class="carousel-wrap">
        <div class="carousel-track" id="carouselTrack">
          ${carouselImages.map((src, i) => `
            <div class="carousel-slide">
              <img src="${src}" alt="Camisa ${i + 1}" loading="lazy" />
            </div>
          `).join("")}
        </div>
        <button class="carousel-btn carousel-prev" id="carouselPrev" aria-label="Anterior">‹</button>
        <button class="carousel-btn carousel-next" id="carouselNext" aria-label="Próxima">›</button>
        <div class="carousel-dots" id="carouselDots">
          ${carouselImages.map((_, i) => `<span class="carousel-dot${i === 0 ? " active" : ""}" data-i="${i}"></span>`).join("")}
        </div>
      </div>

      <div class="result-card">
        <ul class="check-list">
          <li>Você busca camisas de alta qualidade sem pagar preço absurdo.</li>
          <li>Seu perfil é compatível com fornecedores premium.</li>
          <li>Você demonstrou preocupação com ${fear.toLowerCase()}.</li>
          <li>Encontramos 23 fornecedores compatíveis com seu perfil.</li>
        </ul>
      </div>

      <h2>Quanto você economiza na prática</h2>
      <img class="comparacao-img" src="./assets/comparacao.png" alt="Comparação de preços antes e depois do Mapa Secreto" />

      <h2>O que você vai receber</h2>
      <div class="deliverables">
        <div class="deliverable">
          <span class="deliverable-icon">📋</span>
          <div>
            <div class="deliverable-name">+23 Fornecedores verificados</div>
            <div class="deliverable-desc">Contatos ativos e testados pela nossa equipe, com preço de importação direto — sem atravessador, sem risco de golpe.</div>
          </div>
        </div>
        <div class="deliverable">
          <span class="deliverable-icon">🕰️</span>
          <div>
            <div class="deliverable-name">Rota de camisas retrô</div>
            <div class="deliverable-desc">Fornecedores especializados em edições antigas e raras, que você não encontra em loja nenhuma no Brasil.</div>
          </div>
        </div>
        <div class="deliverable">
          <span class="deliverable-icon">🌍</span>
          <div>
            <div class="deliverable-name">Camisas de seleções</div>
            <div class="deliverable-desc">Contatos com acesso a seleções do mundo todo — incluindo versões que nunca chegam nas lojas brasileiras.</div>
          </div>
        </div>
        <div class="deliverable">
          <span class="deliverable-icon">⚡</span>
          <div>
            <div class="deliverable-name">Player Version</div>
            <div class="deliverable-desc">A mesma camisa que os jogadores usam em campo, com tecido e acabamento profissional, pelo preço de importação.</div>
          </div>
        </div>
        <div class="deliverable">
          <span class="deliverable-icon">🛡️</span>
          <div>
            <div class="deliverable-name">Guia anti-golpe</div>
            <div class="deliverable-desc">Aprenda a identificar fornecedor falso, camisa de qualidade inferior e nunca mais perca dinheiro comprando errado.</div>
          </div>
        </div>
        <div class="deliverable">
          <span class="deliverable-icon">♾️</span>
          <div>
            <div class="deliverable-name">Acesso vitalício + atualizações</div>
            <div class="deliverable-desc">Pague uma vez e acesse para sempre. Toda vez que novos contatos forem validados, o mapa é atualizado automaticamente.</div>
          </div>
        </div>
      </div>

      <div class="testimonials-section">
        <h2>O que dizem quem já tem o Mapa</h2>
        <div class="carousel-wrap carousel-conv">
          <div class="carousel-track" id="convTrack">
            ${["conv.1.png","conv.2.png","conv.3.png","conv.4.png","conv.5.png"].map((src, i) => `
              <div class="carousel-slide carousel-slide-conv">
                <img src="./assets/${src}" alt="Depoimento ${i + 1}" loading="lazy" />
              </div>
            `).join("")}
          </div>
          <button class="carousel-btn carousel-prev" id="convPrev" aria-label="Anterior">‹</button>
          <button class="carousel-btn carousel-next" id="convNext" aria-label="Próxima">›</button>
          <div class="carousel-dots" id="convDots">
            ${["","","","",""].map((_, i) => `<span class="carousel-dot${i === 0 ? " active" : ""}" data-i="${i}"></span>`).join("")}
          </div>
        </div>
      </div>

      <div class="price-box">
        <div class="price-label">Acesso completo ao Mapa Secreto</div>
        <div class="price-from">de <span>R$297</span></div>
        <div class="price-main">R$<span class="price-value">37</span><span class="price-cents">,00</span></div>
        <div class="price-desc">Pagamento único • Acesso vitalício • Entrega imediata</div>
        <a class="cta" href="${CHECKOUT_URL}" data-checkout-link>LIBERAR MEU ACESSO AGORA</a>
      </div>

      <div class="guarantee-box">
        <div class="guarantee-icon">🛡️</div>
        <div>
          <div class="guarantee-title">Garantia de 7 dias</div>
          <p class="guarantee-desc">Se por qualquer motivo você não ficar satisfeito, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia, sem enrolação. Basta enviar uma mensagem e o reembolso é feito na hora.</p>
        </div>
      </div>
    `;
  });

  initCarousel();
  initConvCarousel();
}

function initCarousel() {
  const track = document.getElementById("carouselTrack");
  const dots = [...document.querySelectorAll(".carousel-dot")];
  const total = carouselImages.length;
  let current = 0;
  let autoTimer = null;

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === current));
  }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 3000);
  }

  function resetAuto() {
    startAuto();
  }

  document.getElementById("carouselPrev").addEventListener("click", () => { goTo(current - 1); resetAuto(); });
  document.getElementById("carouselNext").addEventListener("click", () => { goTo(current + 1); resetAuto(); });
  dots.forEach(d => d.addEventListener("click", () => { goTo(Number(d.dataset.i)); resetAuto(); }));

  // Swipe
  let startX = 0;
  track.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(diff > 0 ? current + 1 : current - 1); resetAuto(); }
  }, { passive: true });

  startAuto();
}

function initConvCarousel() {
  const track = document.getElementById("convTrack");
  const dots = [...document.querySelectorAll("#convDots .carousel-dot")];
  const total = 5;
  let current = 0;
  let autoTimer = null;

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === current));
  }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 3500);
  }

  document.getElementById("convPrev").addEventListener("click", () => { goTo(current - 1); startAuto(); });
  document.getElementById("convNext").addEventListener("click", () => { goTo(current + 1); startAuto(); });
  dots.forEach(d => d.addEventListener("click", () => { goTo(Number(d.dataset.i)); startAuto(); }));

  let startX = 0;
  track.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(diff > 0 ? current + 1 : current - 1); startAuto(); }
  }, { passive: true });

  startAuto();
}

backBtn.addEventListener("click", () => {
  if (state.pause) {
    state.pause = null;
  } else if (state.step > 0) {
    state.step -= 1;
  }
  saveState();
  render(-1);
});

resetBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  state.step = 0;
  state.answers = [];
  state.pause = null;
  render(1);
});

render(1);
