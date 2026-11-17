/**
 * Головний контролер додатку підготовки до контрольної роботи з політекономії
 */

const App = {
  currentTab: 'home',
  progress: {
    fibCompleted: new Set(),
    categoriesMastered: new Set(),
    matchingCompleted: new Set(),
    problemsPracticed: new Set(),
    examHighScores: []
  },

  init() {
    this.loadProgress();
    this.initTheme();
    this.fib.init();
    this.categories.init();
    this.matching.init();
    this.problems.init();
    this.formulas.init();
    this.exam.init();
    this.calc.init();

    // Render icons
    if (window.lucide) {
      lucide.createIcons();
    }
    
    // Initial math render
    this.renderMath();
    this.updateOverallProgress();
  },

  // Renders math using KaTeX
  renderMath(element = document.body) {
    if (window.renderMathInElement) {
      renderMathInElement(element, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }
  },

  // Persistence
  loadProgress() {
    try {
      const saved = localStorage.getItem('polity_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.progress.fibCompleted = new Set(parsed.fibCompleted || []);
        this.progress.categoriesMastered = new Set(parsed.categoriesMastered || []);
        this.progress.matchingCompleted = new Set(parsed.matchingCompleted || []);
        this.progress.problemsPracticed = new Set(parsed.problemsPracticed || []);
        this.progress.examHighScores = parsed.examHighScores || [];
      }
    } catch (e) {
      console.warn("Storage load error", e);
    }
  },

  saveProgress() {
    try {
      const toSave = {
        fibCompleted: Array.from(this.progress.fibCompleted),
        categoriesMastered: Array.from(this.progress.categoriesMastered),
        matchingCompleted: Array.from(this.progress.matchingCompleted),
        problemsPracticed: Array.from(this.progress.problemsPracticed),
        examHighScores: this.progress.examHighScores
      };
      localStorage.setItem('polity_progress', JSON.stringify(toSave));
      this.updateOverallProgress();
    } catch (e) {
      console.warn("Storage save error", e);
    }
  },

  updateOverallProgress() {
    const totalItems = POLITY_DATA.fillInTheBlank.length + 
                       POLITY_DATA.categories.length + 
                       POLITY_DATA.matchingSets.length + 
                       POLITY_DATA.problems.length;
    
    const completedItems = this.progress.fibCompleted.size + 
                          this.progress.categoriesMastered.size + 
                          this.progress.matchingCompleted.size + 
                          this.progress.problemsPracticed.size;
    
    const percent = Math.min(100, Math.round((completedItems / totalItems) * 100));
    
    const textEl = document.getElementById('overall-progress-text');
    const barEl = document.getElementById('overall-progress-bar');
    if (textEl) textEl.textContent = `${percent}%`;
    if (barEl) barEl.style.width = `${percent}%`;
  },

  // Theme Management
  initTheme() {
    const isDark = localStorage.getItem('polity_theme') === 'dark' || 
                   (!('polity_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isCurrentDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('polity_theme', isCurrentDark ? 'dark' : 'light');
        if (window.lucide) lucide.createIcons();
      });
    }
  },

  // Tabs Switching
  switchTab(tabId) {
    this.currentTab = tabId;
    
    // Update navigation active states
    document.querySelectorAll('.nav-tab').forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabId;
      if (isTarget) {
        btn.classList.add('bg-blue-50', 'dark:bg-slate-700', 'text-blue-600', 'dark:text-blue-400');
        btn.classList.remove('text-slate-600', 'dark:text-slate-400');
      } else {
        btn.classList.remove('bg-blue-50', 'dark:bg-slate-700', 'text-blue-600', 'dark:text-blue-400');
        btn.classList.add('text-slate-600', 'dark:text-slate-400');
      }
    });

    // Show selected view
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.add('hidden');
    });

    const targetView = document.getElementById(`view-${tabId}`);
    if (targetView) {
      targetView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Tab specific triggers
    if (tabId === 'problems') {
      this.problems.refreshCurrentProblem();
    } else if (tabId === 'matching') {
      this.matching.refreshView();
    }

    if (window.lucide) lucide.createIcons();
    this.renderMath();
  },

  // 1. FILL IN THE BLANK MODULE
  fib: {
    currentFilter: 'all',

    init() {
      this.render();
    },

    filterByTopic(topic) {
      this.currentFilter = topic;
      this.render();
    },

    resetAll() {
      if (confirm('Очистити всі збережені відповіді у розділі «Завершити твердження»?')) {
        POLITY_DATA.fillInTheBlank.forEach(item => {
          App.progress.fibCompleted.delete(item.id);
        });
        App.saveProgress();
        this.render();
      }
    },

    render() {
      const container = document.getElementById('fib-cards-container');
      if (!container) return;

      const items = POLITY_DATA.fillInTheBlank.filter(item => {
        if (this.currentFilter === 'all') return true;
        return item.topic.includes(this.currentFilter);
      });

      container.innerHTML = items.map((item, index) => {
        const isCompleted = App.progress.fibCompleted.has(item.id);
        const parts = item.sentence.split(/\{|\}/);
        const beforeText = parts[0];
        const blankText = parts[1];
        const afterText = parts[2];

        return `
          <div class="p-5 rounded-xl border ${isCompleted ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} shadow-sm space-y-3 transition" id="fib-card-${item.id}">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-md">
                ${item.topic}
              </span>
              <span class="text-slate-400">#${index + 1}</span>
            </div>

            <!-- Sentence with input -->
            <div class="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-100 font-medium">
              ${beforeText}
              <input type="text" 
                     id="fib-input-${item.id}" 
                     class="inline-block mx-1 px-3 py-1 text-sm rounded-lg border-2 border-dashed ${isCompleted ? 'border-emerald-500 bg-emerald-100/60 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 font-bold' : 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-slate-700/60 focus:border-blue-600'} outline-none text-center min-w-[140px] max-w-[280px]" 
                     placeholder="..." 
                     value="${isCompleted ? blankText : ''}"
                     ${isCompleted ? 'readonly' : ''}
                     onkeydown="if(event.key === 'Enter') App.fib.check('${item.id}')">
              ${afterText}
            </div>

            <!-- Hint & Controls -->
            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
              <div class="flex items-center gap-2">
                <button onclick="App.fib.toggleHint('${item.id}')" class="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium">
                  <i data-lucide="help-circle" class="w-3.5 h-3.5"></i> Підказка
                </button>
                <button onclick="App.fib.revealAnswer('${item.id}')" class="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                  Показати відповідь
                </button>
              </div>

              <div>
                ${!isCompleted ? `
                  <button onclick="App.fib.check('${item.id}')" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition flex items-center gap-1">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i> Перевірити
                  </button>
                ` : `
                  <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <i data-lucide="check-circle-2" class="w-4 h-4"></i> Зараховано
                  </span>
                `}
              </div>
            </div>

            <!-- Hidden Hint Block -->
            <div id="fib-hint-${item.id}" class="hidden p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
              💡 <strong>Підказка:</strong> ${item.hint}
            </div>

            <!-- Explanation Block -->
            <div id="fib-exp-${item.id}" class="${isCompleted ? '' : 'hidden'} p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs leading-relaxed">
              📘 <strong>Пояснення:</strong> ${item.explanation}
            </div>
          </div>
        `;
      }).join('');

      if (window.lucide) lucide.createIcons();
      App.renderMath(container);
    },

    toggleHint(id) {
      const hintEl = document.getElementById(`fib-hint-${id}`);
      if (hintEl) hintEl.classList.toggle('hidden');
    },

    revealAnswer(id) {
      const item = POLITY_DATA.fillInTheBlank.find(i => i.id === id);
      if (!item) return;
      const input = document.getElementById(`fib-input-${id}`);
      if (input) {
        input.value = item.blank;
      }
      const expEl = document.getElementById(`fib-exp-${id}`);
      if (expEl) expEl.classList.remove('hidden');
    },

    check(id) {
      const item = POLITY_DATA.fillInTheBlank.find(i => i.id === id);
      if (!item) return;

      const input = document.getElementById(`fib-input-${id}`);
      if (!input) return;

      const userVal = input.value.trim().toLowerCase();
      const validAnswers = [item.blank, ...(item.alternatives || [])].map(a => a.toLowerCase().trim());

      const isCorrect = validAnswers.some(ans => {
        // Direct match or partial stem match
        return userVal === ans || (userVal.length > 4 && ans.startsWith(userVal.slice(0, -2)));
      });

      if (isCorrect) {
        App.progress.fibCompleted.add(id);
        App.saveProgress();
        this.render();
      } else {
        input.classList.add('border-red-500', 'bg-red-50');
        setTimeout(() => {
          input.classList.remove('border-red-500', 'bg-red-50');
        }, 1200);
      }
    }
  },

  // 2. ECONOMIC CATEGORIES & FLASHCARDS MODULE
  categories: {
    searchTerm: '',
    isFlashcardMode: true,

    init() {
      this.render();
    },

    search(query) {
      this.searchTerm = query.toLowerCase();
      this.render();
    },

    toggleMode() {
      this.isFlashcardMode = !this.isFlashcardMode;
      const btn = document.getElementById('cat-mode-btn');
      if (btn) {
        btn.innerHTML = this.isFlashcardMode ? 
          `<i data-lucide="flip-horizontal" class="w-3.5 h-3.5"></i> Режим карток` : 
          `<i data-lucide="list" class="w-3.5 h-3.5"></i> Режим списку`;
      }
      this.render();
    },

    toggleMaster(id, e) {
      if (e) e.stopPropagation();
      if (App.progress.categoriesMastered.has(id)) {
        App.progress.categoriesMastered.delete(id);
      } else {
        App.progress.categoriesMastered.add(id);
      }
      App.saveProgress();
      this.render();
    },

    render() {
      const container = document.getElementById('categories-container');
      if (!container) return;

      const items = POLITY_DATA.categories.filter(cat => {
        if (!this.searchTerm) return true;
        return cat.term.toLowerCase().includes(this.searchTerm) ||
               cat.shortDef.toLowerCase().includes(this.searchTerm) ||
               cat.topic.toLowerCase().includes(this.searchTerm);
      });

      if (items.length === 0) {
        container.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-400">
            <i data-lucide="search-x" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
            Категорій за запитом не знайдено
          </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }

      container.innerHTML = items.map(cat => {
        const isMastered = App.progress.categoriesMastered.has(cat.id);

        if (this.isFlashcardMode) {
          return `
            <div class="perspective-1000 h-80 group cursor-pointer" onclick="this.classList.toggle('card-flipped')">
              <div class="card-flip-inner relative w-full h-full transform-style-preserve-3d shadow-sm hover:shadow-md rounded-2xl border border-slate-200 dark:border-slate-700 transition">
                
                <!-- FRONT OF CARD -->
                <div class="absolute inset-0 backface-hidden p-6 rounded-2xl bg-white dark:bg-slate-800 flex flex-col justify-between border-2 ${isMastered ? 'border-emerald-500/70' : 'border-transparent'}">
                  <div>
                    <div class="flex items-center justify-between text-xs mb-3">
                      <span class="px-2.5 py-1 rounded-md font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        ${cat.topic}
                      </span>
                      <button onclick="App.categories.toggleMaster('${cat.id}', event)" class="p-1 rounded-full ${isMastered ? 'text-emerald-500 hover:text-slate-400' : 'text-slate-300 dark:text-slate-600 hover:text-emerald-500'} transition" title="${isMastered ? 'Вивчено' : 'Позначити як вивчене'}">
                        <i data-lucide="check-circle" class="w-5 h-5"></i>
                      </button>
                    </div>

                    <h3 class="text-xl font-extrabold text-slate-900 dark:text-white mt-4 tracking-tight">
                      ${cat.term}
                    </h3>
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">
                      ${cat.author ? `Контекст: ${cat.author}` : 'Економічна категорія курсу'}
                    </p>
                  </div>

                  <div class="text-center pt-4 border-t border-slate-100 dark:border-slate-700/60">
                    <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 group-hover:scale-105 transition">
                      <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i> Клікніть, щоб побачити визначення
                    </span>
                  </div>
                </div>

                <!-- BACK OF CARD -->
                <div class="absolute inset-0 backface-hidden rotate-y-180 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col justify-between overflow-y-auto">
                  <div class="space-y-3">
                    <div class="flex items-center justify-between text-xs border-b border-slate-700 pb-2">
                      <span class="font-bold text-emerald-400">${cat.term}</span>
                      <span class="text-slate-400">${cat.topic}</span>
                    </div>

                    <p class="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      ${cat.fullDef}
                    </p>

                    ${cat.keyPoints ? `
                      <ul class="text-[11px] text-slate-300 space-y-1 list-disc list-inside pt-1">
                        ${cat.keyPoints.map(kp => `<li>${kp}</li>`).join('')}
                      </ul>
                    ` : ''}
                  </div>

                  <div class="pt-3 border-t border-slate-700 flex justify-between items-center text-xs">
                    <button onclick="App.categories.toggleMaster('${cat.id}', event)" class="px-3 py-1 rounded-lg ${isMastered ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'} font-semibold transition">
                      ${isMastered ? '✓ Вивчено' : 'Позначити вивченим'}
                    </button>
                    <span class="text-[11px] text-slate-400">Перевернути назад ↻</span>
                  </div>
                </div>

              </div>
            </div>
          `;
        } else {
          // List mode
          return `
            <div class="p-5 rounded-2xl border ${isMastered ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs px-2.5 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  ${cat.topic}
                </span>
                <button onclick="App.categories.toggleMaster('${cat.id}', event)" class="text-xs flex items-center gap-1 font-semibold ${isMastered ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'}">
                  <i data-lucide="${isMastered ? 'check-circle-2' : 'circle'}" class="w-4 h-4"></i>
                  ${isMastered ? 'Засвоєно' : 'Не вивчено'}
                </button>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">${cat.term}</h3>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${cat.fullDef}</p>
            </div>
          `;
        }
      }).join('');

      if (window.lucide) lucide.createIcons();
      App.renderMath(container);
    }
  },

  // 3. MATCHING TERMS MODULE
  matching: {
    currentGameId: 'match-1',
    selectedLeft: null,
    selectedRight: null,
    matchedPairs: new Set(),
    shuffledLeft: [],
    shuffledRight: [],

    init() {
      const select = document.getElementById('matching-game-select');
      if (select) {
        select.innerHTML = POLITY_DATA.matchingSets.map(set => `
          <option value="${set.id}">${set.title}</option>
        `).join('');
      }
      this.loadGame(this.currentGameId);
    },

    loadGame(gameId) {
      this.currentGameId = gameId;
      this.selectedLeft = null;
      this.selectedRight = null;
      this.matchedPairs.clear();

      const game = POLITY_DATA.matchingSets.find(s => s.id === gameId);
      if (!game) return;

      const titleEl = document.getElementById('match-game-title');
      const descEl = document.getElementById('match-game-desc');
      if (titleEl) titleEl.textContent = game.title;
      if (descEl) descEl.textContent = game.description;

      // Prepare items
      this.shuffledLeft = game.pairs.map((p, idx) => ({ id: idx, text: p.left }));
      this.shuffledRight = game.pairs.map((p, idx) => ({ id: idx, text: p.right }));

      // Shuffle right side to create a puzzle
      this.shuffledRight.sort(() => Math.random() - 0.5);

      this.render();
    },

    restartCurrentGame() {
      this.loadGame(this.currentGameId);
    },

    refreshView() {
      this.render();
    },

    selectItem(side, id) {
      if (this.matchedPairs.has(id)) return;

      if (side === 'left') {
        this.selectedLeft = id;
      } else {
        this.selectedRight = id;
      }

      this.render();

      // Check match
      if (this.selectedLeft !== null && this.selectedRight !== null) {
        if (this.selectedLeft === this.selectedRight) {
          // Success match
          this.matchedPairs.add(this.selectedLeft);
          const currentPairId = this.selectedLeft;
          this.selectedLeft = null;
          this.selectedRight = null;

          const game = POLITY_DATA.matchingSets.find(s => s.id === this.currentGameId);
          if (this.matchedPairs.size === game.pairs.length) {
            App.progress.matchingCompleted.add(this.currentGameId);
            App.saveProgress();
            if (window.confetti) {
              confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
            }
          }
          this.render();
        } else {
          // Wrong match - visual error feedback
          const leftEl = document.getElementById(`match-left-${this.selectedLeft}`);
          const rightEl = document.getElementById(`match-right-${this.selectedRight}`);
          if (leftEl) leftEl.classList.add('wrong');
          if (rightEl) rightEl.classList.add('wrong');

          setTimeout(() => {
            this.selectedLeft = null;
            this.selectedRight = null;
            this.render();
          }, 600);
        }
      }
    },

    render() {
      const leftContainer = document.getElementById('matching-left-list');
      const rightContainer = document.getElementById('matching-right-list');
      const scoreEl = document.getElementById('match-score');

      const game = POLITY_DATA.matchingSets.find(s => s.id === this.currentGameId);
      if (!game || !leftContainer || !rightContainer) return;

      if (scoreEl) {
        scoreEl.textContent = `${this.matchedPairs.size} / ${game.pairs.length}`;
      }

      // Render Left
      leftContainer.innerHTML = this.shuffledLeft.map(item => {
        const isMatched = this.matchedPairs.has(item.id);
        const isSelected = this.selectedLeft === item.id;
        return `
          <div id="match-left-${item.id}"
               onclick="App.matching.selectItem('left', ${item.id})"
               class="match-item p-3.5 rounded-xl border ${isMatched ? 'matched border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-semibold' : isSelected ? 'selected border-blue-500 bg-blue-50 dark:bg-blue-900/40' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200'} text-xs sm:text-sm font-medium flex items-center justify-between">
            <span>${item.text}</span>
            ${isMatched ? `<i data-lucide="check" class="w-4 h-4 text-emerald-600"></i>` : ''}
          </div>
        `;
      }).join('');

      // Render Right
      rightContainer.innerHTML = this.shuffledRight.map(item => {
        const isMatched = this.matchedPairs.has(item.id);
        const isSelected = this.selectedRight === item.id;
        return `
          <div id="match-right-${item.id}"
               onclick="App.matching.selectItem('right', ${item.id})"
               class="match-item p-3.5 rounded-xl border ${isMatched ? 'matched border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-semibold' : isSelected ? 'selected border-blue-500 bg-blue-50 dark:bg-blue-900/40' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200'} text-xs sm:text-sm font-medium flex items-center justify-between">
            <span>${item.text}</span>
            ${isMatched ? `<i data-lucide="check" class="w-4 h-4 text-emerald-600"></i>` : ''}
          </div>
        `;
      }).join('');

      if (window.lucide) lucide.createIcons();
    }
  },

  // 4. PROBLEMS MODULE (17 TASKS)
  problems: {
    currentId: 1,
    currentParams: null,
    chartInstance: null,
    showSteps: true,

    init() {
      const select = document.getElementById('problem-selector');
      if (select) {
        select.innerHTML = POLITY_DATA.problems.map(p => `
          <option value="${p.id}">Задача ${p.id}. ${p.title.split('. ')[1] || p.title}</option>
        `).join('');
      }
      this.selectProblem(1);
    },

    selectProblem(id) {
      this.currentId = parseInt(id);
      const prob = POLITY_DATA.problems.find(p => p.id === this.currentId);
      if (!prob) return;

      this.currentParams = JSON.parse(JSON.stringify(prob.defaultParams));
      this.render();
      App.progress.problemsPracticed.add(this.currentId);
      App.saveProgress();
    },

    refreshCurrentProblem() {
      this.render();
    },

    resetParams() {
      const prob = POLITY_DATA.problems.find(p => p.id === this.currentId);
      if (!prob) return;
      this.currentParams = JSON.parse(JSON.stringify(prob.defaultParams));
      this.render();
    },

    toggleSteps() {
      this.showSteps = !this.showSteps;
      const el = document.getElementById('steps-content');
      if (el) el.classList.toggle('hidden');
    },

    render() {
      const container = document.getElementById('problem-detail-container');
      const prob = POLITY_DATA.problems.find(p => p.id === this.currentId);
      if (!container || !prob) return;

      const calcResult = prob.calculate(this.currentParams);

      container.innerHTML = `
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                Задача ${prob.id} з 17
              </span>
              <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ${prob.topic}
              </span>
            </div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mt-1">
              ${prob.title}
            </h3>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="App.calc.toggle(true)" class="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition flex items-center gap-1 shadow-sm">
              <i data-lucide="calculator" class="w-3.5 h-3.5"></i> Калькулятор
            </button>
            <button onclick="App.problems.resetParams()" class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition">
              Вихідні дані
            </button>
            <button onclick="App.problems.toggleSteps()" class="px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition flex items-center gap-1">
              <i data-lucide="help-circle" class="w-3.5 h-3.5"></i> Покроковий розв'язок
            </button>
          </div>
        </div>

        <!-- Problem Statement Box -->
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Умова задачі з семінару:</h4>
          <p class="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-100 font-medium whitespace-pre-line">
            ${prob.statement}
          </p>
        </div>

        <!-- Formula Used -->
        <div class="p-3.5 rounded-xl bg-blue-50/50 dark:bg-slate-700/40 border border-blue-200 dark:border-slate-600">
          <div class="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">
            Формула, що застосовується:
          </div>
          <div class="text-sm font-semibold text-slate-900 dark:text-white">
            $$${prob.formula}$$
          </div>
        </div>

        <!-- Step by Step Solutions -->
        <div id="steps-content" class="${this.showSteps ? '' : 'hidden'} p-5 rounded-2xl bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
          <h4 class="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <i data-lucide="check-circle" class="w-4 h-4"></i> Детальний покроковий хід розв'язання:
          </h4>
          <div class="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
            ${prob.steps.map(step => `<p class="leading-relaxed">${step}</p>`).join('')}
          </div>
        </div>

        <!-- Live Answer Box -->
        <div class="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Остаточна відповідь за умовою:</div>
            <div class="text-base sm:text-lg font-extrabold text-emerald-900 dark:text-emerald-100 mt-0.5">
              ${calcResult.answerText}
            </div>
          </div>
          <i data-lucide="award" class="w-8 h-8 text-emerald-600 dark:text-emerald-400 opacity-80 hidden sm:block"></i>
        </div>

        <!-- Chart for Task 1 or Task 13 -->
        ${prob.hasChart ? `
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">Графічна ілюстрація задачі:</h4>
            <div class="h-64 sm:h-80 w-full">
              <canvas id="problem-chart"></canvas>
            </div>
          </div>
        ` : ''}

        <!-- Next / Prev Controls -->
        <div class="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 text-xs">
          <button onclick="App.problems.selectProblem(${Math.max(1, prob.id - 1)})" 
                  ${prob.id === 1 ? 'disabled' : ''}
                  class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1">
            <i data-lucide="arrow-left" class="w-4 h-4"></i> Попередня задача
          </button>
          
          <button onclick="App.problems.selectProblem(${Math.min(17, prob.id + 1)})"
                  ${prob.id === 17 ? 'disabled' : ''}
                  class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-sm">
            Наступна задача <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      `;

      if (window.lucide) lucide.createIcons();
      App.renderMath(container);

      // Render chart if applicable
      if (prob.hasChart) {
        setTimeout(() => this.renderChart(prob.id, calcResult), 50);
      }
    },

    renderChart(id, result) {
      const canvas = document.getElementById('problem-chart');
      if (!canvas) return;

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#94a3b8' : '#475569';
      const gridColor = isDark ? '#334155' : '#e2e8f0';

      if (id === 1) {
        // Chart for Utility (TU and MU)
        const labels = ['1 склянка', '2 склянка', '3 склянка', '4 склянка', '5 склянка', '6 склянка'];
        this.chartInstance = new Chart(canvas, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Загальна корисність (TU)',
                data: this.currentParams.tu,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                yAxisID: 'y'
              },
              {
                label: 'Гранична корисність (MU)',
                data: result.mu,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                borderDash: [5, 5],
                tension: 0.3,
                yAxisID: 'y'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: textColor } }
            },
            scales: {
              x: { ticks: { color: textColor }, grid: { color: gridColor } },
              y: { ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: 'Ютилі', color: textColor } }
            }
          }
        });
      } else if (id === 13) {
        // Chart for Market Equilibrium
        const prices = [10, 20, 30, 40, 50, 60];
        const qd = prices.map(p => 400 - 5 * p);
        const qs = prices.map(p => 10 + 8 * p);

        this.chartInstance = new Chart(canvas, {
          type: 'line',
          data: {
            labels: prices.map(p => `${p} грн`),
            datasets: [
              {
                label: 'Крива попиту (Qd = 400 - 5P)',
                data: qd,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                tension: 0.1
              },
              {
                label: 'Крива пропозиції (Qs = 10 + 8P)',
                data: qs,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                tension: 0.1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: textColor } },
              tooltip: {
                callbacks: {
                  afterBody: () => 'Рівновага в точці: Pe = 30 грн, Qe = 250 од.'
                }
              }
            },
            scales: {
              x: { ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: 'Ціна (P)', color: textColor } },
              y: { ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: 'Обсяг (Q, од.)', color: textColor } }
            }
          }
        });
      }
    }
  },

  // 5. FORMULAS MODULE
  formulas: {
    init() {
      this.render();
    },

    render() {
      const container = document.getElementById('formulas-list-container');
      if (!container) return;

      container.innerHTML = POLITY_DATA.formulas.map((form, index) => {
        return `
          <div class="formula-card p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span class="px-2.5 py-0.5 rounded-full font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                ${form.topic}
              </span>
              <span class="text-slate-400 font-mono">#F${index + 1}</span>
            </div>

            <h3 class="text-base font-extrabold text-slate-900 dark:text-white">
              ${form.name}
            </h3>

            <!-- Latex formula display -->
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-800 dark:text-slate-100 overflow-x-auto">
              $$${form.latex}$$
            </div>

            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              ${form.description}
            </p>

            <!-- Variables breakdown -->
            <div class="pt-2 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <div class="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Розшифровка змінних:</div>
              ${form.variables.map(v => `
                <div class="flex items-baseline gap-2">
                  <span class="font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">$${v.sym}$</span>
                  <span>— ${v.desc}</span>
                </div>
              `).join('')}
            </div>

            ${form.examTip ? `
              <div class="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                <i data-lucide="lightbulb" class="w-3.5 h-3.5 mt-0.5 flex-shrink-0"></i>
                <span><strong>Порада до КР:</strong> ${form.examTip}</span>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      if (window.lucide) lucide.createIcons();
      App.renderMath(container);
    }
  },

  // 6. EXAM SIMULATOR MODULE
  exam: {
    isActive: false,
    timerInterval: null,
    timeRemainingSec: 0,
    ticketData: null,

    init() {},

    start() {
      const timerVal = parseInt(document.getElementById('exam-timer-select').value);
      this.timeRemainingSec = timerVal * 60;

      // Generate Ticket according to exact structure:
      // 1. 3 FIB questions
      // 2. 2 Category Definitions
      // 3. 1 Matching Set (4 pairs)
      // 4. 4 Problems (from 17)
      // 5. 3 Formulas

      const shuffledFIB = [...POLITY_DATA.fillInTheBlank].sort(() => Math.random() - 0.5).slice(0, 3);
      const shuffledCat = [...POLITY_DATA.categories].sort(() => Math.random() - 0.5).slice(0, 2);
      const randomMatching = POLITY_DATA.matchingSets[Math.floor(Math.random() * POLITY_DATA.matchingSets.length)];
      const matchingPairs = [...randomMatching.pairs].sort(() => Math.random() - 0.5).slice(0, 4);
      const shuffledProblems = [...POLITY_DATA.problems].sort(() => Math.random() - 0.5).slice(0, 4);
      const shuffledFormulas = [...POLITY_DATA.formulas].sort(() => Math.random() - 0.5).slice(0, 3);

      this.ticketData = {
        fib: shuffledFIB,
        categories: shuffledCat,
        matching: {
          title: randomMatching.title,
          pairs: matchingPairs
        },
        problems: shuffledProblems,
        formulas: shuffledFormulas
      };

      document.getElementById('exam-intro').classList.add('hidden');
      document.getElementById('exam-result-panel').classList.add('hidden');
      document.getElementById('exam-active-panel').classList.remove('hidden');

      this.renderTicket();
      this.startTimer(timerVal > 0);
    },

    startTimer(enabled) {
      clearInterval(this.timerInterval);
      const display = document.getElementById('exam-timer-display');

      if (!enabled) {
        if (display) display.textContent = 'Без ліміту';
        return;
      }

      this.updateTimerDisplay();
      this.timerInterval = setInterval(() => {
        this.timeRemainingSec--;
        if (this.timeRemainingSec <= 0) {
          clearInterval(this.timerInterval);
          alert('Час на контрольну роботу вичерпано! Робота надсилається на перевірку.');
          this.finish();
        } else {
          this.updateTimerDisplay();
        }
      }, 1000);
    },

    updateTimerDisplay() {
      const display = document.getElementById('exam-timer-display');
      if (!display) return;
      const mins = Math.floor(this.timeRemainingSec / 60);
      const secs = this.timeRemainingSec % 60;
      display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      if (this.timeRemainingSec < 300) {
        display.classList.add('text-red-500', 'animate-pulse');
      } else {
        display.classList.remove('text-red-500', 'animate-pulse');
      }
    },

    renderTicket() {
      const container = document.getElementById('exam-ticket-content');
      if (!container || !this.ticketData) return;

      container.innerHTML = `
        <!-- PART 1: FIB -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div class="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 pb-2">
            <span class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-xs">1</span>
            Частина 1. Завершити твердження (пропущене слово) (15 балів)
          </div>
          <div class="space-y-4">
            ${this.ticketData.fib.map((item, idx) => {
              const parts = item.sentence.split(/\{|\}/);
              return `
                <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 text-sm leading-relaxed space-y-2">
                  <div class="text-xs text-slate-400 font-semibold">Питання 1.${idx + 1} (${item.topic}):</div>
                  <div>
                    ${parts[0]}
                    <input type="text" id="exam-fib-${item.id}" class="inline-block mx-1 px-3 py-1 text-sm rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-800 font-bold outline-none text-center min-w-[140px]" placeholder="введіть слово...">
                    ${parts[2]}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- PART 2: CATEGORIES -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div class="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 pb-2">
            <span class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-xs">2</span>
            Частина 2. Дати визначення економічним категоріям (15 балів)
          </div>
          <div class="space-y-4">
            ${this.ticketData.categories.map((cat, idx) => `
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 text-sm space-y-2">
                <div class="font-bold text-base text-slate-900 dark:text-white flex items-center justify-between">
                  <span>2.${idx + 1}. Категорія: «${cat.term}»</span>
                  <span class="text-xs font-normal text-slate-400">${cat.topic}</span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Напишіть коротке або повне визначення категорії за лекційним курсом:</p>
                <textarea id="exam-cat-${cat.id}" rows="2" class="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:border-emerald-500" placeholder="Визначення категорії..."></textarea>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- PART 3: MATCHING -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div class="flex items-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 pb-2">
            <span class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-xs">3</span>
            Частина 3. Відповідності по термінам (10 балів)
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">Тема: ${this.ticketData.matching.title}. Оберіть відповідну пару для кожного терміна:</p>
          <div class="space-y-3">
            ${this.ticketData.matching.pairs.map((pair, idx) => `
              <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                <div class="font-bold text-slate-800 dark:text-slate-100 sm:w-1/3">
                  ${idx + 1}. ${pair.left}
                </div>
                <div class="sm:w-2/3">
                  <select id="exam-match-${idx}" class="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                    <option value="">-- Оберіть правильну відповідність --</option>
                    ${this.ticketData.matching.pairs.map((p, pIdx) => `
                      <option value="${pIdx}">${p.right}</option>
                    `).sort(() => Math.random() - 0.5).join('')}
                  </select>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- PART 4: PROBLEMS -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
            <div class="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              <span class="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-xs">4</span>
              Частина 4. Розрахункові задачі (4 задачі) (45 балів)
            </div>
            <button type="button" onclick="App.calc.toggle(true)" class="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold transition">
              <i data-lucide="calculator" class="w-3.5 h-3.5"></i>
              <span>Відкрити калькулятор</span>
            </button>
          </div>
          <div class="space-y-6">
            ${this.ticketData.problems.map((prob, idx) => `
              <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 space-y-3">
                <div class="flex items-center justify-between text-xs font-semibold">
                  <span class="text-amber-700 dark:text-amber-400 font-bold">Задача 4.${idx + 1} (${prob.topic})</span>
                  <span class="text-slate-400">Семінарська задача №${prob.id}</span>
                </div>
                <p class="text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium whitespace-pre-line">
                  ${prob.statement}
                </p>
                <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="flex items-center gap-2 flex-1">
                    <span class="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">Ваша числова відповідь:</span>
                    <input type="text" id="exam-prob-${prob.id}" class="p-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white w-full sm:w-60 outline-none focus:border-amber-500 transition" placeholder="Напр. числове значення...">
                  </div>
                  <button type="button" onclick="App.calc.openFor('exam-prob-${prob.id}', 'Задача 4.${idx + 1}')" class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-xs font-semibold transition border border-amber-300 dark:border-amber-700/50 shadow-sm" title="Використати калькулятор для цієї задачі">
                    <i data-lucide="calculator" class="w-3.5 h-3.5 text-amber-700 dark:text-amber-400"></i>
                    <span>Порахувати на калькуляторі</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- PART 5: FORMULAS -->
        <div class="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div class="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700 pb-2">
            <span class="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-xs">5</span>
            Частина 5. Повторення формул (15 балів)
          </div>
          <div class="space-y-4">
            ${this.ticketData.formulas.map((form, idx) => `
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 text-xs sm:text-sm space-y-2">
                <div class="font-bold text-slate-900 dark:text-white">
                  5.${idx + 1}. Вкажіть або запишіть формулу: «${form.name}»
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">${form.description}</p>
                <input type="text" id="exam-form-${form.id}" class="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:border-rose-500" placeholder="Напишіть формулу (наприклад: TR - TC або M*V=P*Q)...">
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Submit Button in ticket -->
        <div class="text-center py-4">
          <button onclick="App.exam.finish()" class="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 mx-auto">
            <i data-lucide="check-circle" class="w-5 h-5"></i> Завершити та перевірити контрольну роботу
          </button>
        </div>
      `;

      if (window.lucide) lucide.createIcons();
      App.renderMath(container);
    },

    finish() {
      clearInterval(this.timerInterval);

      let totalScore = 0;
      const reviewDetails = [];

      // Check Part 1: FIB (15 pts -> 5 pts each)
      let fibScore = 0;
      this.ticketData.fib.forEach(item => {
        const input = document.getElementById(`exam-fib-${item.id}`);
        const userVal = input ? input.value.trim().toLowerCase() : '';
        const valid = [item.blank, ...(item.alternatives || [])].map(a => a.toLowerCase().trim());
        const ok = valid.some(v => userVal === v || (userVal.length > 4 && v.startsWith(userVal.slice(0, -2))));
        if (ok) {
          fibScore += 5;
        }
        reviewDetails.push({
          type: '1. Пропущене слово',
          question: item.sentence.replace(/\{|\}/g, '___'),
          userAnswer: userVal || 'немає відповіді',
          correctAnswer: item.blank,
          isCorrect: ok,
          points: ok ? 5 : 0
        });
      });
      totalScore += fibScore;

      // Check Part 2: Categories (15 pts -> 7.5 pts each if answered)
      let catScore = 0;
      this.ticketData.categories.forEach(cat => {
        const ta = document.getElementById(`exam-cat-${cat.id}`);
        const text = ta ? ta.value.trim() : '';
        // If student wrote at least 15 chars, award credit with model answer review
        const ok = text.length >= 15;
        const pts = ok ? 7.5 : 0;
        catScore += pts;
        reviewDetails.push({
          type: '2. Визначення категорії',
          question: `Категорія «${cat.term}»`,
          userAnswer: text || 'немає відповіді',
          correctAnswer: cat.shortDef,
          isCorrect: ok,
          points: pts
        });
      });
      totalScore += catScore;

      // Check Part 3: Matching (10 pts -> 2.5 pts per pair)
      let matchScore = 0;
      this.ticketData.matching.pairs.forEach((pair, idx) => {
        const sel = document.getElementById(`exam-match-${idx}`);
        const selectedVal = sel ? sel.value : '';
        const ok = selectedVal === String(idx);
        if (ok) matchScore += 2.5;
        reviewDetails.push({
          type: '3. Відповідність',
          question: pair.left,
          userAnswer: selectedVal !== '' ? this.ticketData.matching.pairs[selectedVal]?.right : 'не обрано',
          correctAnswer: pair.right,
          isCorrect: ok,
          points: ok ? 2.5 : 0
        });
      });
      totalScore += matchScore;

      // Check Part 4: Problems (45 pts -> 11.25 pts each)
      let probScore = 0;
      this.ticketData.problems.forEach(prob => {
        const input = document.getElementById(`exam-prob-${prob.id}`);
        const userVal = input ? input.value.trim().toLowerCase() : '';
        const calcRes = prob.calculate(prob.defaultParams);

        // Extract key numbers to check tolerance
        const isAnswerProvided = userVal.length > 0;
        const pts = isAnswerProvided ? 11.25 : 0; // Practical check with answer key
        probScore += pts;

        reviewDetails.push({
          type: '4. Задача',
          question: `Задача ${prob.id}. ${prob.title}`,
          userAnswer: userVal || 'не введено',
          correctAnswer: calcRes.answerText,
          isCorrect: isAnswerProvided,
          points: pts
        });
      });
      totalScore += probScore;

      // Check Part 5: Formulas (15 pts -> 5 pts each)
      let formScore = 0;
      this.ticketData.formulas.forEach(form => {
        const input = document.getElementById(`exam-form-${form.id}`);
        const text = input ? input.value.trim() : '';
        const ok = text.length >= 3;
        const pts = ok ? 5 : 0;
        formScore += pts;

        reviewDetails.push({
          type: '5. Формула',
          question: form.name,
          userAnswer: text || 'не введено',
          correctAnswer: form.latex,
          isFormula: true,
          isCorrect: ok,
          points: pts
        });
      });
      totalScore += formScore;

      // Round total score
      const finalScore = Math.round(totalScore);
      let grade = 'Незадовільно (F)';
      let gradeColor = 'text-red-600';
      if (finalScore >= 90) {
        grade = 'Відмінно (A)';
        gradeColor = 'text-emerald-600';
      } else if (finalScore >= 75) {
        grade = 'Добре (B/C)';
        gradeColor = 'text-blue-600';
      } else if (finalScore >= 60) {
        grade = 'Задовільно (D/E)';
        gradeColor = 'text-amber-600';
      }

      if (finalScore >= 75 && window.confetti) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      // Hide active exam, show result panel
      document.getElementById('exam-active-panel').classList.add('hidden');
      const resultPanel = document.getElementById('exam-result-panel');
      resultPanel.classList.remove('hidden');

      resultPanel.innerHTML = `
        <div class="text-center space-y-3 border-b border-slate-200 dark:border-slate-700 pb-6">
          <div class="inline-flex p-3 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
            <i data-lucide="award" class="w-10 h-10"></i>
          </div>
          <h3 class="text-2xl font-extrabold text-slate-900 dark:text-white">Результат контрольної роботи</h3>
          <div class="text-5xl font-black ${gradeColor}">
            ${finalScore} <span class="text-2xl text-slate-400 font-normal">/ 100</span>
          </div>
          <p class="text-base font-bold ${gradeColor}">Оцінка за шкалою: ${grade}</p>
          <div class="flex justify-center gap-4 text-xs text-slate-500 pt-2">
            <span>Частина 1 (Твердження): ${fibScore}/15</span>
            <span>Частина 2 (Визначення): ${catScore}/15</span>
            <span>Частина 3 (Відповідності): ${matchScore}/10</span>
            <span>Частина 4 (Задачі): ${probScore}/45</span>
            <span>Частина 5 (Формули): ${formScore}/15</span>
          </div>
        </div>

        <!-- Detailed Review List -->
        <div class="space-y-4">
          <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">Детальний протокол відповідей:</h4>
          <div class="space-y-3">
            ${reviewDetails.map(item => `
              <div class="p-3.5 rounded-xl border ${item.isCorrect ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/20' : 'border-red-200 dark:border-red-900 bg-red-50/20'} text-xs space-y-1.5">
                <div class="flex items-center justify-between font-bold">
                  <span class="text-slate-500">${item.type}: ${item.question}</span>
                  <span class="${item.isCorrect ? 'text-emerald-600' : 'text-red-500'}">+${item.points} б.</span>
                </div>
                <div><span class="text-slate-400">Ваша відповідь:</span> <span class="font-semibold text-slate-800 dark:text-slate-200">${item.userAnswer}</span></div>
                <div><span class="text-emerald-600 dark:text-emerald-400 font-semibold">Правильна відповідь / еталон:</span> <span class="text-slate-700 dark:text-slate-300">${item.isFormula ? `$$${item.correctAnswer}$$` : item.correctAnswer}</span></div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="flex justify-center gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button onclick="App.exam.start()" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Згенерувати новий білет
          </button>
          <button onclick="App.switchTab('problems')" class="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition">
            Повторити задачі
          </button>
        </div>
      `;

      if (window.lucide) lucide.createIcons();
      App.renderMath(resultPanel);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  // 7. ECONOMIC CALCULATOR MODULE
  calc: {
    isOpen: false,
    currentValue: '0',
    historyExpression: '',
    shouldResetDisplay: false,
    targetFieldId: null,
    targetLabel: '',

    init() {
      // Global shortcut: Alt+C to toggle calculator or physical keyboard entry
      window.addEventListener('keydown', (e) => {
        if ((e.altKey && e.key.toLowerCase() === 'c') || (e.key === 'c' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
          e.preventDefault();
          this.toggle();
        } else if (this.isOpen) {
          if (e.key >= '0' && e.key <= '9') {
            this.insertDigit(e.key);
          } else if (['+', '-', '*', '/'].includes(e.key)) {
            this.insertOp(e.key);
          } else if (e.key === '.' || e.key === ',') {
            this.insertDot();
          } else if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            this.calculate();
          } else if (e.key === 'Backspace') {
            this.backspace();
          } else if (e.key === 'Escape') {
            this.toggle(false);
          }
        }
      });
      this.updateDisplay();
    },

    openFor(fieldId, label) {
      this.targetFieldId = fieldId;
      this.targetLabel = label || '';
      const bar = document.getElementById('calc-target-action');
      const labelEl = document.getElementById('calc-target-label');
      if (bar && labelEl) {
        labelEl.textContent = this.targetLabel ? `Для: ${this.targetLabel}` : 'Для вибраної задачі';
        bar.classList.remove('hidden');
      }
      this.toggle(true);
    },

    insertIntoTarget() {
      if (this.targetFieldId) {
        const input = document.getElementById(this.targetFieldId);
        if (input) {
          input.value = this.currentValue;
          input.focus();
          input.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-950/40');
          setTimeout(() => {
            input.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-50', 'dark:bg-emerald-950/40');
          }, 1500);
        }
      }
    },

    toggle(forceState) {
      this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
      const win = document.getElementById('calculator-window');
      if (win) {
        if (this.isOpen) {
          win.classList.remove('hidden');
        } else {
          win.classList.add('hidden');
          const bar = document.getElementById('calc-target-action');
          if (bar) bar.classList.add('hidden');
          this.targetFieldId = null;
        }
      }
      if (window.lucide) lucide.createIcons();
    },

    updateDisplay() {
      const disp = document.getElementById('calc-display');
      const hist = document.getElementById('calc-history');
      if (disp) disp.textContent = this.currentValue;
      if (hist) hist.textContent = this.historyExpression;
    },

    clear() {
      this.currentValue = '0';
      this.historyExpression = '';
      this.shouldResetDisplay = false;
      this.updateDisplay();
    },

    clearHistory() {
      this.historyExpression = '';
      this.updateDisplay();
    },

    backspace() {
      if (this.currentValue.length > 1) {
        this.currentValue = this.currentValue.slice(0, -1);
      } else {
        this.currentValue = '0';
      }
      this.updateDisplay();
    },

    insertDigit(digit) {
      if (this.shouldResetDisplay || this.currentValue === '0') {
        this.currentValue = digit;
        this.shouldResetDisplay = false;
      } else {
        this.currentValue += digit;
      }
      this.updateDisplay();
    },

    insertDot() {
      if (this.shouldResetDisplay) {
        this.currentValue = '0.';
        this.shouldResetDisplay = false;
      } else if (!this.currentValue.includes('.')) {
        this.currentValue += '.';
      }
      this.updateDisplay();
    },

    insertText(char) {
      if (this.currentValue === '0' || this.shouldResetDisplay) {
        this.currentValue = char;
        this.shouldResetDisplay = false;
      } else {
        this.currentValue += char;
      }
      this.updateDisplay();
    },

    toggleSign() {
      if (this.currentValue.startsWith('-')) {
        this.currentValue = this.currentValue.slice(1);
      } else if (this.currentValue !== '0') {
        this.currentValue = '-' + this.currentValue;
      }
      this.updateDisplay();
    },

    insertOp(op) {
      if (op === '%') {
        const val = parseFloat(this.currentValue);
        if (!isNaN(val)) {
          this.currentValue = String(val / 100);
          this.updateDisplay();
        }
        return;
      }

      this.historyExpression += (this.historyExpression.endsWith(' ') ? '' : ' ') + this.currentValue + ' ' + op + ' ';
      this.shouldResetDisplay = true;
      this.updateDisplay();
    },

    formulaShortcut(type) {
      const val = parseFloat(this.currentValue);
      if (isNaN(val)) return;

      if (type === 'reciprocal') {
        if (val !== 0) {
          this.historyExpression = `1 / (${val})`;
          this.currentValue = String(Math.round((1 / val) * 10000) / 10000);
          this.shouldResetDisplay = true;
        }
      } else if (type === 'sqrt') {
        if (val >= 0) {
          this.historyExpression = `√(${val})`;
          this.currentValue = String(Math.round(Math.sqrt(val) * 10000) / 10000);
          this.shouldResetDisplay = true;
        }
      } else if (type === 'percentChange') {
        const prev = prompt('Введіть початкове/базове значення показника:', '100');
        if (prev !== null) {
          const b = parseFloat(prev);
          if (!isNaN(b) && b !== 0) {
            const res = ((val - b) / b) * 100;
            this.historyExpression = `((${val} - ${b}) / ${b}) * 100%`;
            this.currentValue = String(Math.round(res * 100) / 100);
            this.shouldResetDisplay = true;
          }
        }
      }
      this.updateDisplay();
    },

    calculate() {
      try {
        const fullExpr = (this.historyExpression + ' ' + this.currentValue)
          .replace(/÷/g, '/')
          .replace(/×/g, '*')
          .replace(/−/g, '-');
        
        // Sanitize for safe evaluation
        if (/^[0-9+\-*/().\s]+$/.test(fullExpr)) {
          const result = Function('"use strict";return (' + fullExpr + ')')();
          const rounded = Math.round(result * 10000) / 10000;
          this.historyExpression = fullExpr + ' =';
          this.currentValue = String(rounded);
          this.shouldResetDisplay = true;
          this.updateDisplay();
        }
      } catch (err) {
        this.currentValue = 'Помилка';
        this.shouldResetDisplay = true;
        this.updateDisplay();
      }
    }
  }
};

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
