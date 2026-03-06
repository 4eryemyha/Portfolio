function clamp01(x){ return Math.max(0, Math.min(1, x)); }
function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

/* ===== HERO letters prep ===== */
function wrapLetters(el) {
  const text = el.getAttribute("data-type") ?? el.textContent ?? "";
  el.textContent = "";

  [...text].forEach((ch, i) => {
    const span = document.createElement("span");
    span.className = "type-char";
    span.textContent = ch === " " ? "\u00A0" : ch;
    span.style.setProperty("--i", i);
    el.appendChild(span);
  });
}

function setupRolePreparedOnce() {
  const lines = Array.from(document.querySelectorAll(".hero__role--type"));
  if (!lines.length) return;

  lines.forEach((el) => {
    if (el.dataset.prepared === "1") return;
    wrapLetters(el);
    el.dataset.prepared = "1";
  });

  document.body.classList.add("role-prepared");
}

/* ===== HERO replay on scroll ===== */
function setupHeroReplay() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  let typingTimer = null;

  const startHero = () => {
    document.body.classList.remove("is-ready");
    document.body.classList.remove("role-typing");
    if (typingTimer) window.clearTimeout(typingTimer);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add("is-ready");
        const startAt = 1850;
        typingTimer = window.setTimeout(() => {
          document.body.classList.add("role-typing");
        }, startAt);
      });
    });
  };

  const stopHero = () => {
    document.body.classList.remove("is-ready");
    document.body.classList.remove("role-typing");
    if (typingTimer) window.clearTimeout(typingTimer);
    typingTimer = null;
  };

  const io = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (e.isIntersecting) startHero();
      else stopHero();
    },
    { threshold: 0.35 }
  );

  io.observe(hero);
}

/* ===== ABOUT chill reveal ===== */
function setupAboutChill() {
  const sec = document.querySelector(".about3[data-about]");
  if (!sec) return;

  const line = sec.querySelector(".about3__railLine");
  const revealables = [
    sec.querySelector(".about3__centerWord"),
    sec.querySelector(".about3__centerLead"),
    sec.querySelector(".about3__left .about3__colTitle"),
    ...Array.from(sec.querySelectorAll(".about3__left [data-row]")),
    sec.querySelector(".about3__side .about3__colTitle"),
    ...Array.from(sec.querySelectorAll(".about3__side [data-row]")),
  ].filter(Boolean);

  let raf = null;

  function reset(){
    sec.classList.remove("is-on");
    revealables.forEach(el => el.classList.remove("is-revealed"));
    if (line) line.style.height = "0px";
  }

  function computeMaxLine(){
    const bottoms = revealables.map(el => el.getBoundingClientRect().bottom);
    const maxBottom = bottoms.length ? Math.max(...bottoms) : 0;
    const lineTop = line.getBoundingClientRect().top;
    return Math.max(280, Math.round(maxBottom - lineTop + 20));
  }

  function start(){
    reset();
    sec.classList.add("is-on");

    const startDelay = 700;
    const duration = 1850;
    const t0 = performance.now();

    const sorted = [...revealables].sort((a,b) =>
      a.getBoundingClientRect().top - b.getBoundingClientRect().top
    );

    const maxLine = computeMaxLine();
    const fired = new Set();

    const tick = (now) => {
      const t = now - t0;
      const p = clamp01((t - startDelay) / duration);
      const pe = easeOutCubic(p);

      if (line) line.style.height = `${Math.round(maxLine * pe)}px`;
      const currentY = line.getBoundingClientRect().top + (maxLine * pe);

      sorted.forEach((el, i) => {
        if (fired.has(i)) return;
        const y = el.getBoundingClientRect().top + 10;
        if (currentY >= y) {
          fired.add(i);
          el.classList.add("is-revealed");
        }
      });

      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
  }

  function stop(){
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    reset();
  }

  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) start();
    else stop();
  }, { threshold: 0.35 });

  io.observe(sec);

  window.addEventListener("resize", () => {
  // Если анимация уже запущена или завершена, просто обновляем высоту линии
  if (sec.classList.contains("is-on")) {
    const maxLine = computeMaxLine();
    if (line) line.style.height = `${maxLine}px`;
  }
}, { passive: true });
}

/* ===== Counter animation ===== */
function animateCounter(el, finalValue, duration = 1200) {
  const plusEl = el.querySelector('.skills3__expPlus');
  if (!el.childNodes[0] || el.childNodes[0].nodeType !== 3) return;
  
  return new Promise(resolve => {
    const startValue = 0;
    const startTime = performance.now();
    
    function tick(now) {
      const elapsed = now - startTime;
      const progress = clamp01(elapsed / duration);
      const easedProgress = easeOutCubic(progress);
      const currentValue = Math.round(startValue + (finalValue - startValue) * easedProgress);

      el.childNodes[0].nodeValue = currentValue;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.childNodes[0].nodeValue = finalValue;
        if (plusEl) {
          plusEl.classList.add('is-visible');
        }
        resolve();
      }
    }
    requestAnimationFrame(tick);
  });
}

/* ===== SKILLS3 reveal ===== */
function setupSkillsChill() {
  const sec = document.querySelector(".skills3[data-skills]");
  if (!sec) return;

  const line = sec.querySelector(".skills3__railLine");
  const expLineEl = sec.querySelector(".skills3__expLine");
  const revealables = [
    sec.querySelector(".skills3__title"),
    sec.querySelector(".skills3__lead"),
    expLineEl,
    ...Array.from(sec.querySelectorAll(".skills3 [data-row]")),
  ].filter(Boolean);

  let raf = null;

  function reset(){
    sec.classList.remove("is-on");
    revealables.forEach(el => el.classList.remove("is-revealed"));
    if (line) line.style.height = "0px";
    
    if (expLineEl) {
      expLineEl.classList.remove("is-glowing");
      expLineEl.dataset.counted = "";
      const numEl = expLineEl.querySelector('.skills3__expNum');
      const plusEl = expLineEl.querySelector('.skills3__expPlus');
      const textEl = expLineEl.querySelector('.skills3__expText');
      if (numEl && numEl.childNodes[0]) numEl.childNodes[0].nodeValue = "0";
      if (plusEl) plusEl.classList.remove('is-visible');
      if (textEl) textEl.classList.remove('is-visible');
    }
  }

  function computeMaxLine(){
    const bottoms = revealables.map(el => el.getBoundingClientRect().bottom);
    const maxBottom = bottoms.length ? Math.max(...bottoms) : 0;
    const lineTop = line.getBoundingClientRect().top;
    return Math.max(320, Math.round(maxBottom - lineTop + 20));
  }

  function start(){
    reset();
    sec.classList.add("is-on");

    const startDelay = 720;
    const duration = 2050;
    const t0 = performance.now();

    const sorted = [...revealables].sort((a,b) =>
      a.getBoundingClientRect().top - b.getBoundingClientRect().top
    );

    const maxLine = computeMaxLine();
    const fired = new Set();

    const tick = (now) => {
      const t = now - t0;
      const p = clamp01((t - startDelay) / duration);
      const pe = easeOutCubic(p);

      if (line) line.style.height = `${Math.round(maxLine * pe)}px`;
      const currentY = line.getBoundingClientRect().top + (maxLine * pe);

      sorted.forEach((el, i) => {
        if (fired.has(i)) return;
        const y = el.getBoundingClientRect().top + 10;
        if (currentY >= y) {
          fired.add(i);
          
          if (el === expLineEl && !el.dataset.counted) {
            el.dataset.counted = "true";
            el.classList.add("is-revealed");
            el.classList.add("is-glowing");
            const numEl = el.querySelector('.skills3__expNum');
            if (numEl) {
                animateCounter(numEl, 3, 1200).then(() => {
                    const textEl = el.querySelector('.skills3__expText');
                    if (textEl) textEl.classList.add('is-visible');
                });
            }
          } else {
            el.classList.add("is-revealed");
          }
        }
      });

      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
  }

  function stop(){
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    reset();
  }

  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) start();
    else stop();
  }, { threshold: 0.35 });

  io.observe(sec);

  window.addEventListener("resize", () => {
  // Если анимация уже запущена или завершена, просто обновляем высоту линии
  if (sec.classList.contains("is-on")) {
    const maxLine = computeMaxLine();
    if (line) line.style.height = `${maxLine}px`;
  }
}, { passive: true });
}

/* ===== skills3 typing + accordion + pool ===== */
function typeText(el, text, speed = 12) {
  el.textContent = "";
  let i = 0;
  const token = Symbol("typing");
  el.__typingToken = token;

  return new Promise((resolve) => {
    const tick = () => {
      if (el.__typingToken !== token) return resolve(false);
      el.textContent = text.slice(0, i);
      i += 1;
      if (i <= text.length) window.setTimeout(tick, speed);
      else resolve(true);
    };
    tick();
  });
}

function computeFinalInlineHeight(inlineEl, noteWrap, linkEl, note, url) {
  const textEl = noteWrap.querySelector("[data-inline-note-text]");
  const prev = {
    text: textEl ? textEl.textContent : "", textVis: textEl ? textEl.style.visibility : "",
    linkDisplay: linkEl.style.display, linkVis: linkEl.style.visibility, linkClass: linkEl.className,
    inlineHeight: inlineEl.style.height, open: inlineEl.classList.contains("is-open"), aria: inlineEl.getAttribute("aria-hidden")
  };
  inlineEl.classList.add("is-open");
  inlineEl.setAttribute("aria-hidden", "false");
  if (textEl) { textEl.style.visibility = "hidden"; textEl.textContent = note || ""; }
  linkEl.style.display = (!url || url === "#") ? "none" : "inline-flex";
  if (linkEl.style.display !== "none") { linkEl.classList.add("is-visible"); linkEl.style.visibility = "hidden"; }
  inlineEl.style.height = "auto";
  const h = inlineEl.scrollHeight;
  if (textEl) { textEl.textContent = prev.text; textEl.style.visibility = prev.textVis; }
  linkEl.style.display = prev.linkDisplay;
  linkEl.style.visibility = prev.linkVis;
  linkEl.className = prev.linkClass;
  inlineEl.style.height = prev.inlineHeight;
  inlineEl.setAttribute("aria-hidden", prev.aria);
  if (!prev.open) inlineEl.classList.remove("is-open");
  return h;
}

function openInline(inlineEl, note, url) {
  const noteWrap = inlineEl.querySelector("[data-inline-note]");
  const textEl = inlineEl.querySelector("[data-inline-note-text]");
  const linkEl = inlineEl.querySelector("[data-inline-link]");
  if (!noteWrap || !textEl || !linkEl) return;
  textEl.__typingToken = Symbol("cancel");
  linkEl.href = url || "#";
  linkEl.classList.remove("is-visible");
  linkEl.style.display = (!url || url === "#") ? "none" : "inline-flex";
  inlineEl.setAttribute("aria-hidden", "false");
  inlineEl.classList.add("is-open");
  const targetH = computeFinalInlineHeight(inlineEl, noteWrap, linkEl, note, url);
  inlineEl.style.height = "0px";
  inlineEl.getBoundingClientRect();
  inlineEl.style.height = `${targetH}px`;
  textEl.textContent = "";
  typeText(textEl, note || "", 12).then((finished) => {
    if (!finished || !inlineEl.classList.contains("is-open") || linkEl.style.display === "none") return;
    linkEl.classList.add("is-visible");
  });
}

function closeInline(inlineEl) {
  const textEl = inlineEl.querySelector("[data-inline-note-text]");
  const linkEl = inlineEl.querySelector("[data-inline-link]");
  if (textEl) textEl.__typingToken = Symbol("cancel");
  if (linkEl) linkEl.classList.remove("is-visible");
  inlineEl.setAttribute("aria-hidden", "true");
  inlineEl.classList.remove("is-open");
  const h = inlineEl.getBoundingClientRect().height;
  inlineEl.style.height = `${h}px`;
  inlineEl.getBoundingClientRect();
  inlineEl.style.height = "0px";
}

function ensureInlinePool(INLINE_POOL_SIZE = 4) {
  const sec = document.querySelector(".skills3[data-skills]");
  if (!sec) return;
  sec.querySelectorAll(".skillCard").forEach((card) => {
    const inlines = Array.from(card.querySelectorAll("[data-inline]"));
    if (inlines.length !== 1) return;
    const tpl = inlines[0];
    tpl.classList.remove("is-open"); tpl.style.height = "0px"; tpl.setAttribute("aria-hidden", "true");
    for (let i = 1; i < INLINE_POOL_SIZE; i++) {
      const clone = tpl.cloneNode(true);
      clone.classList.remove("is-open"); clone.style.height = "0px"; clone.setAttribute("aria-hidden", "true");
      tpl.insertAdjacentElement("afterend", clone);
    }
  });
}

function setupSkillInlineAccordion() {
  const sec = document.querySelector(".skills3[data-skills]");
  if (!sec) return;

  const INLINE_POOL_SIZE = 4;
  const poolByCard = new Map();
  let globalActive = null;

  function getCard(btn){ return btn.closest(".skillCard"); }
  function getPool(card){
    if (poolByCard.has(card)) return poolByCard.get(card);
    const inlines = Array.from(card.querySelectorAll("[data-inline]")).slice(0, INLINE_POOL_SIZE);
    poolByCard.set(card, { inlines, i: 0 });
    return poolByCard.get(card);
  }
  function nextInline(card){
    const pool = getPool(card);
    for (let k = 0; k < pool.inlines.length; k++) {
      const idx = (pool.i + k) % pool.inlines.length;
      const el = pool.inlines[idx];
      if (!el.classList.contains("is-open")) {
        pool.i = (idx + 1) % pool.inlines.length; return el;
      }
    }
    const el = pool.inlines[pool.i];
    pool.i = (pool.i + 1) % pool.inlines.length;
    return el;
  }
  function closeGlobal(){
    if (!globalActive) return;
    globalActive.btn.classList.remove("is-active");
    closeInline(globalActive.inline);
    globalActive = null;
  }
  sec.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-accordion]");
    if (!btn) return;
    e.stopPropagation();
    const card = getCard(btn);
    if (!card) return;
    if (globalActive && globalActive.btn === btn) { closeGlobal(); return; }
    closeGlobal();
    const inlineEl = nextInline(card);
    btn.insertAdjacentElement("afterend", inlineEl);
    btn.classList.add("is-active");
    openInline(inlineEl, btn.dataset.note, btn.dataset.url);
    globalActive = { btn, inline: inlineEl, card };
  });
  document.addEventListener("click", () => closeGlobal());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeGlobal(); });
}

/* =============================================================== */
/* ==================== MORPHING SIDE NAV LOGIC ================== */
/* =============================================================== */
// Утилита для анимации печати текста (стереть -> написать)
function typeTextEffect(element, newText, speed = 30) {
  const currentText = element.textContent;
  let i = currentText.length;
  
  // 1. Стираем текущий текст
  function erase() {
    if (i > 0) {
      element.textContent = currentText.substring(0, i - 1);
      i--;
      setTimeout(erase, speed);
    } else {
      // 2. Печатаем новый
      setTimeout(() => type(0), speed);
    }
  }

  function type(j) {
    if (j <= newText.length) {
      element.textContent = newText.substring(0, j);
      j++;
      setTimeout(() => type(j), speed);
    }
  }
  erase();
}


/* =============================================================== */
/* ==================== PROJECT NAV LOGIC (SIMPLE) =============== */
/* =============================================================== */

// ВХОД В РЕЖИМ ПРОЕКТА
function enterDetailNav(targetDetailId) {
  const sideNav = document.querySelector('.side-nav');
  const worksLink = document.getElementById('nav-works');
  
  if (sideNav) {
    // 1. Включаем спец-режим для CSS
    sideNav.classList.add('is-project-mode');
    // 2. Делаем панель видимой (если она была скрыта другими скриптами)
    sideNav.classList.add('is-revealed');
    sideNav.classList.remove('is-hidden-during-transition');
  }

  // Если нужно отключить клик по ссылке, чтобы не перезагружало:
  if (worksLink) {
    worksLink.style.pointerEvents = 'none'; // Временно отключаем клик
  }
}

// ВЫХОД ИЗ РЕЖИМА ПРОЕКТА
function exitDetailNav() {
  const sideNav = document.querySelector('.side-nav');
  const worksLink = document.getElementById('nav-works');

  if (sideNav) {
    sideNav.classList.remove('is-project-mode');
  }
  
  if (worksLink) {
    worksLink.style.pointerEvents = 'auto'; // Возвращаем клик
  }
}


// SCROLL SPY (Следит за скроллом внутри проекта)
function initProjectScrollSpy(detailId, links) {
  const wrapper = document.getElementById('detail-page-wrapper');
  const section = document.getElementById(detailId);
  if (!wrapper || !section) return;

  if (projectScrollObserver) projectScrollObserver.disconnect(); // Сброс старого

  // Функция проверки
  const checkScroll = () => {
    const scrollPos = wrapper.scrollTop + window.innerHeight * 0.3; // 30% экрана

    // Сброс активного класса
    links.forEach(l => l.el.classList.remove('is-active'));

    let activeLink = null;
    
    // Ищем, какую секцию мы сейчас видим
    for (let i = 0; i < links.length; i++) {
        const targetEl = section.querySelector(links[i].selector);
        if (targetEl && scrollPos >= targetEl.offsetTop) {
            activeLink = links[i].el;
        }
    }

    // Если ничего не нашли (самый верх), берем первую точку
    if (!activeLink && links.length > 0 && wrapper.scrollTop < 200) {
        activeLink = links[0].el;
    }

    if (activeLink) activeLink.classList.add('is-active');
  };

  // Вешаем на скролл
  wrapper.onscroll = checkScroll;
  // И вызываем один раз сразу
  checkScroll();
}



/* ===== PROJECTS SECTION REVEAL & PAGE TRANSITIONS ===== */
function setupProjectsAndTransitions() {
  const mainContentWrapper = document.querySelector('.main-content-wrapper');
  const detailPageWrapper = document.getElementById('detail-page-wrapper');
  const allProjectDetailSections = document.querySelectorAll('.project-detail-content');
  const projectActionLinks = document.querySelectorAll('.project-card .project-card__action');
  const backButtons = document.querySelectorAll('.back-button[data-nav-to="main-content"]');
  const projectSection = document.getElementById('projects');
  
  // Футер обзервер (для появления контента футера)
  const detailFooterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show-footer'); 
      }
    });
  }, { 
    root: detailPageWrapper, 
    threshold: 0.2
  });
  document.querySelectorAll('.page-footer').forEach(footer => {
    detailFooterObserver.observe(footer);
  });

  // Анимация списка проектов на главной
  if (projectSection) {
    const projectRevealItems = projectSection.querySelectorAll('[data-reveal-list]');
    projectRevealItems.forEach((item, index) => {
      item.style.setProperty('--i', index);
    });
    const projectObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          projectSection.classList.add('is-revealed');
        }
      });
    }, { threshold: 0.2 });
    projectObserver.observe(projectSection);
  }

  function showDetailPage(targetDetailId) {
    mainContentWrapper.classList.add('is-exiting');

    const sideNav = document.querySelector('.side-nav');
    if(sideNav) sideNav.classList.add('nav-hidden');
    // 🔥 ЗАПУСК МОРФИНГА НАВИГАЦИИ
    enterDetailNav(targetDetailId);

    setTimeout(() => {
      mainContentWrapper.style.display = 'none';
      detailPageWrapper.style.display = 'grid'; 
      detailPageWrapper.offsetHeight; 
      detailPageWrapper.classList.add('is-visible'); 

      // Скрываем все секции
      allProjectDetailSections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('is-visible'); 
        section.scrollTop = 0;
        const f = section.querySelector('.page-footer');
        if (f) f.classList.remove('show-footer'); // Сброс футера
      });
      
      const targetDetailSection = document.getElementById(targetDetailId);
      if (targetDetailSection) {
        targetDetailSection.style.display = 'grid'; 
        targetDetailSection.scrollTop = 0; 
        requestAnimationFrame(() => {
          targetDetailSection.classList.add('is-visible'); 
        });
      }

      updateCustomScrollbar(); 
    }, 600);
  }

function showMainContent() {
    exitDetailNav();

    detailPageWrapper.classList.remove('is-visible'); 
    detailPageWrapper.classList.add('is-exiting');

    setTimeout(() => {
      detailPageWrapper.style.display = 'none';
      detailPageWrapper.classList.remove('is-exiting');

      const sideNav = document.querySelector('.side-nav');
      if(sideNav) sideNav.classList.remove('nav-hidden');
      
      allProjectDetailSections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('is-visible');
        section.scrollTop = 0;
      });
      
      mainContentWrapper.style.display = 'block';
      mainContentWrapper.classList.remove('is-exiting'); 
      mainContentWrapper.classList.add('is-returning');

      // ✅ ФИКС СКРОЛЛА:
      // 1. Отключаем плавность у всей страницы
      document.documentElement.classList.add('no-smooth-scroll');
      
      if (projectSection) {
        // 2. Мгновенно прыгаем к секции проектов
        projectSection.scrollIntoView(); 
      }
      
      // 3. Возвращаем плавность обратно через мгновение
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-smooth-scroll');
        mainContentWrapper.classList.remove('is-returning');
      });

      initializeSideNavigationActiveState(); 
    }, 500);
  }
    // Находим все карточки проектов
  const projectCards = document.querySelectorAll('.project-card');
  
  // Вешаем обработчик клика на каждую карточку
  projectCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Ищем кнопку "Открыть проект" внутри этой карточки
      const actionButton = card.querySelector('.project-card__action');
      
      // Если кнопка есть И клик был НЕ по самой кнопке (чтобы не сломать кнопку)
      if (actionButton && !e.target.closest('.project-card__action')) {
        e.preventDefault();
        const targetId = actionButton.dataset.navTo;
        if (targetId && targetId.startsWith('project-detail-')) {
          showDetailPage(targetId);
        }
      }
    });
    
    // Меняем курсор на "руку" при наведении, чтобы было понятно что это ссылка
    card.style.cursor = 'pointer';
  });
  
  // Оставляем обработчик для самой кнопки (чтобы она тоже работала)
  projectActionLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.stopPropagation(); // Чтобы клик по кнопке не вызвал ещё и клик по карточке
      const targetId = e.currentTarget.dataset.navTo;
      if (targetId && targetId.startsWith('project-detail-')) {
        showDetailPage(targetId);
      }
    });
  });

  backButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      showMainContent();
    });
  });
}


/* ===== CONTACT SECTION ===== */
function setupContactSection() {
    const section = document.getElementById('contact');
    if (!section) return;

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            section.classList.toggle('is-revealed', entry.isIntersecting);
        });
    }, {
        threshold: 0.2
    });
    
    scrollObserver.observe(section);
}


/* ===== SIDE NAVIGATION ENTRY ANIMATION ===== */
function animateSideNavigationEntry() {
  const sideNav = document.querySelector('.side-nav');
  if (!sideNav) return;

  const sideNavLine = sideNav.querySelector('.side-nav__line');
  const navLinks = sideNav.querySelectorAll('.side-nav__link');

  const lineStartDelay = 0;
  const dotInitialDelay = 200;
  const dotSequentialDelay = 150;
  
  sideNavLine.style.setProperty('--line-start-delay', `${lineStartDelay}ms`);

  navLinks.forEach((link, index) => {
    const dotDelay = lineStartDelay + dotInitialDelay + (index * dotSequentialDelay);
    link.style.setProperty('--dot-start-delay', `${dotDelay}ms`);
  });

  sideNav.classList.add('is-revealed');

  const lineAnimationDuration = 1000;
  const dotAnimationDuration = 400;
  const totalAnimationDuration = lineStartDelay + lineAnimationDuration + (navLinks.length - 1) * dotSequentialDelay + dotAnimationDuration;
  
  window.setTimeout(() => {
    if (sideNavLine) sideNavLine.classList.add('animation-finished');
    navLinks.forEach(link => link.classList.add('animation-finished'));
  }, totalAnimationDuration + 50);
}


/* ===== SIDE NAVIGATION ACTIVE STATE (MAIN PAGE) ===== */
function initializeSideNavigationActiveState() {
  const sideNav = document.querySelector('.side-nav');
  // Проверяем, не в режиме ли мы деталей
  if (sideNav && sideNav.classList.contains('is-morphing')) return;

  const navLinks = document.querySelectorAll('.side-nav__link:not(.detail-link)');
  const sections = Array.from(navLinks).map(link => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return null;
    const id = href.replace('#', '');
    return document.getElementById(id);
  }).filter(Boolean);

  function setActiveLink(id) {
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.replace('#', '') === id) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
  }

  function updateActiveSection() {
    if (!sideNav || sideNav.classList.contains('is-morphing')) return;

    if (window.scrollY < 100) {
      setActiveLink('top');
      return;
    }

    const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50;
    if (isAtBottom) {
       const lastSection = sections[sections.length - 1];
       if (lastSection) setActiveLink(lastSection.id);
       return;
    }

    const viewportCenter = window.innerHeight / 2;
    let closestSection = null;
    let minDistance = Infinity;

    sections.forEach(section => {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const sectionCenter = rect.top + (rect.height / 2);
      const distance = Math.abs(viewportCenter - sectionCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestSection = section;
      }
    });

    if (closestSection) {
      setActiveLink(closestSection.id);
    }
  }

  window.addEventListener('scroll', () => {
    requestAnimationFrame(updateActiveSection);
  }, { passive: true });

  updateActiveSection();
}


/* ===== CUSTOM SCROLLBAR (DETAIL) ===== */
function setupCustomScrollbar() {
  const wrapper = document.getElementById('detail-page-wrapper'); 
  const container = document.querySelector('.custom-scroll');
  const thumb = document.querySelector('.custom-scroll__thumb');

  if (!wrapper || !container || !thumb) return;

  let isDragging = false;
  let startY, startScrollTop;

  // 1. Функция обновления позиции ползунка при обычном скролле (колесиком)
  function updateThumb() { 
    if (isDragging) return; // Не обновляем, если тянем мышкой
    const scrollableHeight = wrapper.scrollHeight - wrapper.clientHeight;
    if (scrollableHeight <= 0) {
      container.style.opacity = '0';
      return;
    }
    container.style.opacity = '1'; 

    const progress = wrapper.scrollTop / scrollableHeight;
    const availableSpace = container.clientHeight - thumb.clientHeight;
    thumb.style.transform = `translateY(${progress * availableSpace}px)`;
  }

  // 2. Логика захвата ползунка (Drag)
  thumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.pageY;
    startScrollTop = wrapper.scrollTop;
    document.body.style.userSelect = 'none'; // Отключаем выделение текста при перетаскивании
    thumb.style.cursor = 'grabbing';
  });

  // 3. Логика перемещения мыши по всему экрану
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaY = e.pageY - startY;
    const scrollableHeight = wrapper.scrollHeight - wrapper.clientHeight;
    const availableTrackSpace = container.clientHeight - thumb.clientHeight;
    
    // Вычисляем, на сколько процентов мы сдвинули мышь относительно трека
    const scrollDelta = (deltaY / availableTrackSpace) * scrollableHeight;
    wrapper.scrollTop = startScrollTop + scrollDelta;

    // Сразу двигаем ползунок вручную для плавности
    const progress = wrapper.scrollTop / scrollableHeight;
    const translateY = Math.max(0, Math.min(availableTrackSpace, progress * availableTrackSpace));
    thumb.style.transform = `translateY(${translateY}px)`;
  });

  // 4. Логика отпускания мыши
  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = '';
      thumb.style.cursor = 'grab';
    }
  });

  // 5. Клик по самому треку (прыжок к месту)
  container.addEventListener('mousedown', (e) => {
    if (e.target === thumb) return; // Если кликнули именно по ползунку, ничего не делаем (сработает mousedown на thumb)
    
    const rect = container.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const scrollableHeight = wrapper.scrollHeight - wrapper.clientHeight;
    const availableTrackSpace = container.clientHeight - thumb.clientHeight;
    
    const targetProgress = (clickY - thumb.clientHeight / 2) / availableTrackSpace;
    wrapper.scrollTo({
      top: targetProgress * scrollableHeight,
      behavior: 'smooth'
    });
  });

  // Слушатели
  wrapper.addEventListener('scroll', updateThumb);
  window.addEventListener('resize', updateThumb);
  
  // Экспортируем функцию для внешнего вызова (при открытии проекта)
  window.updateCustomScrollbar = updateThumb;
}


/* ===== START ===== */
window.addEventListener("DOMContentLoaded", () => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  
  setupRolePreparedOnce();
  setupHeroReplay(); 
  setupAboutChill();
  setupSkillsChill();
  ensureInlinePool(4);
  setupSkillInlineAccordion();
  setupProjectsAndTransitions();
  setupContactSection();
  setupCustomScrollbar();
  initializeSideNavigationActiveState();

  const heroAnimationsTotalDuration = 2000;
  
  setTimeout(() => {
    document.body.classList.add("is-ready");
    const heroSection = document.querySelector('.hero');
    if (heroSection && heroSection.getBoundingClientRect().top < 100) {
      setTimeout(() => {
        document.body.classList.add("role-typing");
      }, 1850); 
    }
  }, 50);

  setTimeout(() => {
    animateSideNavigationEntry();
  }, heroAnimationsTotalDuration); 
});

document.addEventListener("DOMContentLoaded", () => {
    const sec = document.querySelector("#about");
    if (!sec) return;

    const line = sec.querySelector(".about3__railLine");
    const label = sec.querySelector(".about3__label");
    const centerWord = sec.querySelector(".about3__centerWord");
    const centerLead = sec.querySelector(".about3__centerLead");
    const counterVal = sec.querySelector(".counter-val");
    const levelUpTarget = sec.querySelector(".level-up-target");
    const photoCol = sec.querySelector(".photo-col");
    const leftItems = sec.querySelectorAll(".left-side .skill-item");
    const rightItems = sec.querySelectorAll(".right-side .skill-item");

    let rafId = null;
    let hasLeveledUp = false;
    let isRunning = false;

    function reset() {
        if (rafId) cancelAnimationFrame(rafId);
        isRunning = false;
        hasLeveledUp = false;
        
        line.style.height = "0px";
        line.style.opacity = "0";
        
        label.classList.remove("is-revealed");
        centerWord.classList.remove("is-revealed");
        centerLead.classList.remove("is-revealed");
        photoCol.classList.remove("is-revealed");
        
        counterVal.innerText = "0";
        counterVal.classList.remove("is-bright", "bump-anim");
        levelUpTarget.innerHTML = "";
        [...leftItems, ...rightItems].forEach(item => item.classList.remove("is-revealed"));
    }

    function getLineHeight() {
        const lastItem = leftItems[leftItems.length - 1];
        if (!lastItem) return 800;
        // Расчет абсолютной дистанции
        const railTop = line.getBoundingClientRect().top + window.scrollY;
        const itemBottom = lastItem.getBoundingClientRect().bottom + window.scrollY;
        return Math.round(itemBottom - railTop + 100); // 340 - твой настраиваемый хвост
    }

    function startSequence() {
        if (isRunning) return;
        isRunning = true;
        reset();
        
        const targetLineH = getLineHeight();
        const startTime = performance.now();
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        const counterEase = (t) => 1 - Math.pow(1 - t, 4);

        function tick(now) {
            const elapsed = now - startTime;
            
            // Включаем видимость сразу
            line.style.opacity = "1";
            label.classList.add("is-revealed");
            centerWord.classList.add("is-revealed");

            const lineDelay = 720;
            const lineDuration = 2200;

            if (elapsed > lineDelay) {
                const p = Math.min((elapsed - lineDelay) / lineDuration, 1);
                const pe = easeOutCubic(p);
                
                line.style.height = `${Math.round(targetLineH * pe)}px`;
                
                if (p > 0.05) centerLead.classList.add("is-revealed");
                if (pe > 0.15) photoCol.classList.add("is-revealed");
                if (pe > 0.30) { leftItems[0].classList.add("is-revealed"); rightItems[0].classList.add("is-revealed"); }
                if (pe > 0.70) { leftItems[1].classList.add("is-revealed"); rightItems[1].classList.add("is-revealed"); }

                if (p <= 0.70) {
                    const pCounter = p / 0.70;
                    const currentAge = Math.floor(counterEase(pCounter) * 20.9);
                    counterVal.innerText = Math.max(0, Math.min(currentAge, 20));
                } else if (!hasLeveledUp) {
                    hasLeveledUp = true;
                    counterVal.innerText = "21";
                    counterVal.classList.add("is-bright", "bump-anim");
                    const p1 = document.createElement("div");
                    p1.className = "plus-pop"; p1.innerText = "+1";
                    levelUpTarget.appendChild(p1);
                }
            }

            if (elapsed < lineDelay + lineDuration + 500) {
                rafId = requestAnimationFrame(tick);
            }
        }
        rafId = requestAnimationFrame(tick);
    }

    // ТРИГГЕР ПО ЗАГОЛОВКУ
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) startSequence();
            else reset();
        });
    }, { threshold: 0.1 }); 

    const trigger = sec.querySelector(".about3") || sec;
    observer.observe(trigger);
});