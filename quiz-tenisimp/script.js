const CHECKOUT_URL = "https://pay.cakto.com.br/9rshhnt_926524";


// pauses[questionIndex](answer) → { msg, img? } | null
const pauses = {
  1: () => ({ msg: "Um Nike Dunk custa <span style='color:#d12d35'>R$899</span> na loja oficial. O mesmo tênis, mesmos materiais, mesma qualidade, sai por <span style='color:#f4c95d'>R$130</span> do jeito que o <span style='color:#f4c95d'>Mapa Secreto dos Tênis Importados</span> ensina.", img: "../assets/dunkcacaowow.webp" }),
  2: () => ({ msg: "Cada tênis tem fornecedores diferentes. Por isso o Mapa é separado por tipos de fornecedores." }),
  3: (answer) => answer === "Nunca"
    ? { msg: "A maioria das pessoas nem sabe que dá pra comprar direto, e continua pagando caro sem precisar." }
    : { msg: "Então você já sabe como é difícil achar um fornecedor de qualidade no meio de tantas opções." },
  4: () => ({ msg: "Esses são exatamente os critérios que usamos pra filtrar e validar cada fornecedor do Mapa." }),
  5: (answer) => (answer === "Revenda" || answer === "Uso próprio e revenda")
    ? { msg: "Usuários que revendem relatam margens entre <span style='color:#f4c95d'>200% e 500%</span> nos modelos mais procurados.", msgAbove: true, img: "../assets/depoimento-pausatec.webp", imgStyle: "aspect-ratio:9/16;object-fit:cover;max-height:75vh;" }
    : null,
  6: () => ({ msg: "Nossa equipe levou 6 meses testando e validando cada contato antes de adicionar ao Mapa." }),
};

const questions = [
  {
    eyebrow: "Análise de perfil",
    title: "Qual seu principal objetivo?",
    subtitle: "Pra gente descobrir qual rota do Mapa Secreto combina mais com você.",
    options: ["Economizar na compra de tênis", "Encontrar modelos raros ou difíceis de achar", "Montar uma coleção", "Revender e ganhar dinheiro"]
  },
  {
    eyebrow: "Preço atual",
    title: "Quanto você costuma pagar num tênis?",
    subtitle: "Essa resposta mostra o quanto você pode estar deixando de economizar com acesso direto aos fornecedores.",
    options: ["Até R$200", "R$200–500", "R$500–1.000", "Mais de R$1.000"],
  },
  {
    eyebrow: "Tipo de tênis",
    title: "Qual modelo de tênis você procura?",
    subtitle: "",
    options: ["Nike", "Adidas", "Puma", "Louis Vuitton", "Todos"],
  },
  {
    eyebrow: "Experiência",
    title: "Já comprou tênis importados antes?",
    subtitle: "",
    options: ["Nunca", "1 a 3 vezes", "Mais de 3 vezes"],
  },
  {
    eyebrow: "Risco principal",
    title: "Qual seu maior medo ao comprar importado?",
    subtitle: "Esse é o filtro mais importante pra encontrar os fornecedores mais confiáveis do Mapa.",
    options: ["Qualidade ruim", "Ser enganado ou cair em golpe", "Demorar demais pra chegar", "Receber tamanho errado"],
    multi: true,
  },
  {
    eyebrow: "Uso",
    title: "Você pretende comprar para:",
    subtitle: "Algumas rotas fazem mais sentido pra uso próprio. Outras foram feitas pra quem quer lucro.",
    options: ["Uso próprio", "Revenda", "Uso próprio e revenda"],
  },
  {
    eyebrow: "Tempo economizado",
    title: "Quanto tempo você gastaria procurando fornecedores sozinho?",
    subtitle: "A parte difícil não é comprar. É saber quais contatos valem a pena antes de arriscar dinheiro.",
    options: ["Mais de 1 dia", "Mais de 1 semana", "Mais de 1 mês"],
  },
  {
    eyebrow: "Prioridade",
    title: "O que seria mais importante pra você?",
    subtitle: "Vamos ajustar seu resultado de acordo com o que você mais valoriza.",
    options: ["Melhor preço", "Melhor qualidade", "Maior variedade de modelos", "Fornecedores confiáveis"],
    multi: true,
    ctaLabel: "Ver fornecedores do meu perfil →",
  },
];

const state = { step: 0, answers: [], pause: null };
const screen = document.getElementById("screen");
const backBtn = document.getElementById("backBtn");
const resetBtn = document.getElementById("resetBtn");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");

let _navDir = 1;


function saveState() { // localStorage removido
}

function transition(renderFn) {
  const wrap = screen.parentElement;

  const ghost = document.createElement('div');
  ghost.className = 'screen screen-ghost';
  ghost.innerHTML = screen.innerHTML;
  ghost.style.cssText = `
    position:absolute;top:0;left:0;right:0;z-index:5;padding:26px 22px 30px;
    pointer-events:none;overflow:hidden;
    animation: ${_navDir > 0 ? 'tx-out-left' : 'tx-out-right'} .28s ease forwards;
  `;
  wrap.appendChild(ghost);

  renderFn();
  wrap.style.overflow = '';

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
      ${state.step === 0 ? `<img class="hero-image" src="./assets/produto-tenis.webp" alt="Mapa Secreto dos Tênis Importados" onerror="this.style.display='none'">` : ""}
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
      ${question.multi ? `<button class="cta multi-continue" type="button" id="multiContinueBtn" disabled>${question.ctaLabel || "Continuar →"}</button>` : ""}
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
      const pauseObj = pauseFn ? pauseFn(chosen[0]) : null;
      if (pauseObj) {
        state.pause = pauseObj;
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
        const pauseObj = pauseFn ? pauseFn(chosen) : null;
        if (pauseObj) {
          state.pause = pauseObj;
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

function renderPause(pause) {
  const { msg, img, carousel } = typeof pause === 'string' ? { msg: pause } : pause;
  const convImages = ['../assets/feed1.webp','../assets/feed2.webp','../assets/feed3.webp','../assets/feed4.webp'];
  transition(() => {
    if (carousel) {
      screen.innerHTML = `
        <div class="carousel-conv" id="pauseConvCarousel">
          <div class="carousel-track" id="pauseConvTrack">
            ${convImages.map(src => `<div class="carousel-slide-conv"><img src="${src}" alt="Depoimento" /></div>`).join('')}
          </div>
          <button class="carousel-btn carousel-prev" id="pauseConvPrev">&#8592;</button>
          <button class="carousel-btn carousel-next" id="pauseConvNext">&#8594;</button>
        </div>
        <div style="display:flex;justify-content:center;gap:6px;margin:8px 0 4px;" id="pauseConvDots">
          ${convImages.map((_, i) => `<span class="carousel-dot${i === 0 ? ' active' : ''}" data-i="${i}"></span>`).join('')}
        </div>
        <div class="pause-box" style="padding-top:16px;">
          <p class="pause-message">${msg}</p>
          <button class="cta pause-cta" type="button" id="pauseContinueBtn">Continuar →</button>
        </div>
      `;
    } else {
      const imgHtml = img
        ? `<img class="pause-img" src="${img}" alt="" onerror="this.style.display='none'" ${pause.imgStyle ? `style="${pause.imgStyle}"` : ''}/>`
        : `<div class="pause-icon">💡</div>`;
      const msgHtml = msg ? `<p class="pause-message">${msg}</p>` : '';
      const topHtml = pause.msgAbove ? `${msgHtml}${imgHtml}` : `${imgHtml}${msgHtml}`;
      screen.innerHTML = `
        <div class="pause-box">
          ${topHtml}
          <button class="cta pause-cta" type="button" id="pauseContinueBtn">Continuar →</button>
        </div>
      `;
    }
  });

  if (carousel) {
    const track = document.getElementById('pauseConvTrack');
    const dots = [...document.querySelectorAll('#pauseConvDots .carousel-dot')];
    const total = convImages.length;
    let current = 0;
    const goTo = i => {
      current = (i + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, j) => d.classList.toggle('active', j === current));
    };
    document.getElementById('pauseConvPrev').addEventListener('click', () => goTo(current - 1));
    document.getElementById('pauseConvNext').addEventListener('click', () => goTo(current + 1));
    dots.forEach(d => d.addEventListener('click', () => goTo(Number(d.dataset.i))));
    const autoplay = setInterval(() => goTo(current + 1), 3000);
    document.getElementById('pauseContinueBtn').addEventListener('click', () => {
      clearInterval(autoplay);
      state.step += 1;
      state.pause = null;
      saveState();
      render(1);
    });
    return;
  }

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
        <p class="subtitle">Estamos cruzando suas respostas com as rotas do Mapa Secreto dos Tênis.</p>
        <div class="loading-list" id="loadingList"></div>
      </div>
    `;
  });

  const items = [
    "✓ Verificando tipo de tênis ideal",
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
  "../assets/dunkcacaowow.webp",
  "../assets/adidascampus.webp",
  "../assets/jordanlowconcord.webp",
  "../assets/jordanlowtravis.webp",
  "../assets/badbunny.webp",
  "../assets/yeezy350.webp",
  "../assets/lvskate.webp",
  "../assets/nb9060.webp",
  "../assets/corrida.webp",
];

function renderResult() {
  const goal = state.answers[0]?.answer || "economizar em tênis de qualidade";
  const type = state.answers[2]?.answer || "tênis premium";
  const fearRaw = state.answers[4]?.answer;
  const fear = Array.isArray(fearRaw) ? fearRaw.join(", ") : (fearRaw || "fornecedores problemáticos");

  transition(() => {
    screen.innerHTML = `
      <div class="eyebrow">Resultado da sua análise</div>
      <h1>Encontramos sua <span class="title-gold">rota ideal</span></h1>
      <p class="subtitle">Com base nas suas respostas, seu perfil combina com fornecedores focados em <strong>tênis de alta qualidade e preço baixo</strong>, principalmente para quem quer <strong>${goal.toLowerCase()}</strong>.</p>

      <div class="carousel-wrap">
        <div class="carousel-track" id="carouselTrack">
          ${carouselImages.map((src, i) => `
            <div class="carousel-slide">
              <img src="${src}" alt="Tênis ${i + 1}" loading="lazy" />
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
          <li>Você busca tênis de qualidade idêntica aos originais sem pagar preço absurdo.</li>
          <li>Seu perfil é compatível com fornecedores premium verificados.</li>
          <li>Você demonstrou preocupação com ${fear.toLowerCase()}.</li>
          <li>Encontramos fornecedores compatíveis com seu perfil.</li>
        </ul>
      </div>

      <h2>Quanto <span class="title-gold">você economiza</span> na prática</h2>
      <img class="comparacao-img" src="../assets/comparacaotenis.webp" alt="Comparação de preços antes e depois do Mapa Secreto" onerror="this.style.display='none'" />
      <button class="cta cta-pulse cta-anchor" type="button" id="ctaAnchorBtn">💰 Quero economizar também</button>

      <div class="testimonials-section">
        <h2><span class="title-gold">O que dizem</span> quem já tem o Mapa</h2>
        <div class="carousel-wrap carousel-conv">
          <div class="carousel-track" id="convTrack">
            ${["feed1.webp","feed2.webp","feed3.webp","feed4.webp"].map((src, i) => `
              <div class="carousel-slide carousel-slide-conv">
                <img src="../assets/${src}" alt="Depoimento ${i + 1}" loading="lazy" />
              </div>
            `).join("")}
          </div>
          <button class="carousel-btn carousel-prev" id="convPrev" aria-label="Anterior">‹</button>
          <button class="carousel-btn carousel-next" id="convNext" aria-label="Próxima">›</button>
          <div class="carousel-dots" id="convDots">
            ${["","","",""].map((_, i) => `<span class="carousel-dot${i === 0 ? " active" : ""}" data-i="${i}"></span>`).join("")}
          </div>
        </div>
      </div>

      <h2>O que você vai receber</h2>
      <div class="deliverables">
        <div class="deliverable">
          <span class="deliverable-icon">📋</span>
          <div>
            <div class="deliverable-name">Fornecedores verificados</div>
            <div class="deliverable-desc">Contatos ativos e testados pela nossa equipe, com preço de importação direto. Sem atravessador, sem risco de golpe.</div>
          </div>
        </div>
        <div class="deliverable">
          <span class="deliverable-icon">🏃</span>
          <div>
            <div class="deliverable-name">Rota de corrida & esportivos</div>
            <div class="deliverable-desc">Fornecedores especializados nos maiores lançamentos de tênis esportivos, com qualidade idêntica aos originais.</div>
          </div>
        </div>
        <div class="deliverable">
          <span class="deliverable-icon">🔥</span>
          <div>
            <div class="deliverable-name">Rota streetwear & casual</div>
            <div class="deliverable-desc">Contatos com acesso a modelos hype e casuais do momento, incluindo versões que esgotam em minutos nas lojas.</div>
          </div>
        </div>
        <div class="deliverable">
          <span class="deliverable-icon">📏</span>
          <div>
            <div class="deliverable-name">Guia de tamanhos infalível</div>
            <div class="deliverable-desc">Tabela completa para converter tamanhos chineses em brasileiros com precisão e nunca mais errar o número.</div>
          </div>
        </div>
        <div class="deliverable">
          <span class="deliverable-icon">🛡️</span>
          <div>
            <div class="deliverable-name">Guia anti-golpe</div>
            <div class="deliverable-desc">Aprenda a identificar fornecedor falso, tênis de qualidade inferior e nunca mais perca dinheiro comprando errado.</div>
          </div>
        </div>
        <div class="deliverable">
          <span class="deliverable-icon">♾️</span>
          <div>
            <div class="deliverable-name">Acesso vitalício + atualizações</div>
            <div class="deliverable-desc">Pague uma vez e acesse para sempre. Toda vez que novos contatos forem validados, o Mapa é atualizado automaticamente.</div>
          </div>
        </div>
      </div>

      <div class="guarantee-section">
        <div class="guarantee-badge">🛡️</div>
        <h2>Risco zero. <span class="title-gold">Literalmente.</span></h2>
        <p class="guarantee-text">Você tem <strong>7 dias de garantia incondicional</strong>. Se por qualquer motivo não gostar, é só pedir o reembolso direto na plataforma. O dinheiro volta na hora, sem burocracia, sem perguntas.</p>
        <img class="guarantee-img" src="../assets/depoimentoreembolso.webp" alt="Depoimento de reembolso" onerror="this.style.display='none'" />
        <p class="guarantee-sub">Esse é o nível de confiança que temos no Mapa Secreto.</p>
      </div>

      <h2><span class="title-gold">Garanta</span> seu acesso agora</h2>
      <p class="subtitle">Pare de pagar caro sem precisar. Acesse o Mapa Secreto dos Tênis Importados™ e veja a rota completa dos melhores fornecedores da China.</p>

      <div class="price-box">
        <div class="price-label">Acesso completo ao Mapa Secreto dos Tênis</div>
        <div class="price-from">de <span style="color:#d12d35;text-decoration:line-through">R$297</span></div>
        <div class="price-main">R$<span class="price-value">67</span><span class="price-cents">,00</span></div>
        <div class="price-installments">ou 12x de <strong>R$9,72</strong></div>
        <a class="cta cta-pulse" href="${CHECKOUT_URL}" data-checkout-link>LIBERAR MEU ACESSO AGORA</a>
        <div class="price-desc">Pagamento único • Acesso vitalício • Entrega imediata</div>
      </div>

      <div class="faq-section">
        <h2>Perguntas frequentes</h2>
        <div class="faq-list" id="faqList">
          ${[
            {
              q: "A qualidade é realmente idêntica aos originais?",
              a: "Sim. Os fornecedores do Mapa foram selecionados exatamente pela qualidade do produto. Falamos de tênis com o mesmo tecido, solado, costuras e acabamento, o mesmo que é revendido aqui no Brasil por R$500, R$800 ou mais. A diferença está no preço: você acessa o valor de origem, sem o atravessador."
            },
            {
              q: "Serei taxado na alfândega?",
              a: "Pode acontecer, mas no Mapa Secreto ensinamos as estratégias que os compradores experientes usam para minimizar, ou até zerar, as taxas. São técnicas simples de declaração e fracionamento de compras que fazem toda a diferença. Muita gente compra sem pagar um centavo de taxa."
            },
            {
              q: "Como acerto o tamanho sem experimentar?",
              a: "O Mapa inclui um guia de tamanhos detalhado com a tabela de conversão do padrão chinês para o brasileiro. É só seguir o guia antes de pedir."
            },
            {
              q: "Preciso saber inglês ou chinês?",
              a: "Não. Você pode usar o Google Tradutor para se comunicar com os fornecedores em inglês, e muitos deles já entendem bem. Alguns até respondem automaticamente. No Mapa você também recebe modelos de mensagem prontos para usar sem complicação."
            },
            {
              q: "Posso revender os tênis que comprar?",
              a: "Totalmente. Muitos usuários do Mapa começaram comprando para uso próprio e perceberam que as margens eram tão boas que valiam a pena revender. Com o preço de importação, a margem fica entre 200% e 500% nos modelos mais procurados. O Mapa inclui uma rota específica para quem quer comprar em volume."
            },
            {
              q: "E se eu não gostar do Mapa Secreto?",
              a: "Sem problema. Você tem 7 dias de garantia total. Se por qualquer motivo não ficar satisfeito, basta enviar uma mensagem e devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia, na hora."
            }
          ].map((item, i) => `
            <div class="faq-item" data-faq="${i}">
              <button class="faq-q" type="button">
                <span>${item.q}</span>
                <span class="faq-icon">+</span>
              </button>
              <div class="faq-a">${item.a}</div>
            </div>
          `).join("")}
        </div>
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

  document.querySelectorAll(".faq-q").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(el => el.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    });
  });

  document.getElementById("ctaAnchorBtn").addEventListener("click", () => {
    document.querySelector(".price-box").scrollIntoView({ behavior: "smooth", block: "start" });
  });
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

  document.getElementById("carouselPrev").addEventListener("click", () => { goTo(current - 1); startAuto(); });
  document.getElementById("carouselNext").addEventListener("click", () => { goTo(current + 1); startAuto(); });
  dots.forEach(d => d.addEventListener("click", () => { goTo(Number(d.dataset.i)); startAuto(); }));

  let startX = 0;
  track.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener("touchend", e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { goTo(diff > 0 ? current + 1 : current - 1); startAuto(); }
  }, { passive: true });

  startAuto();
}

function initConvCarousel() {
  const track = document.getElementById("convTrack");
  const dots = [...document.querySelectorAll("#convDots .carousel-dot")];
  const total = track.querySelectorAll('.carousel-slide-conv').length;
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
  state.step = 0;
  state.answers = [];
  state.pause = null;
  render(1);
});

render(1);
