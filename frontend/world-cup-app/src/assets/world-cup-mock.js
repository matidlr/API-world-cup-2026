
    // ─────────────────────────────────────────────────────────────
    // TEAM PALETTE DEFINITIONS
    // Champion teams get their official colors.
    // Any other team ID gets GENERIC_THEME.
    // ─────────────────────────────────────────────────────────────
    const TEAM_CONFIGS = {
      arg: { name: 'Argentina', flag: '🇦🇷', isChampion: true,
             primary: '#74ACDF', secondary: '#FFFFFF', accent: '#4A90C4', dark: '#2E6DA8',
             textLight: '#FFFFFF', textDark: '#0A1628' },

      bra: { name: 'Brazil',    flag: '🇧🇷', isChampion: true,
             primary: '#009C3B', secondary: '#FEDD00', accent: '#002776', dark: '#006929',
             textLight: '#FFFFFF', textDark: '#001A0D' },

      uru: { name: 'Uruguay',   flag: '🇺🇾', isChampion: true,
             primary: '#5B9BD5', secondary: '#FFFFFF', accent: '#1A3A6B', dark: '#2D5F9A',
             textLight: '#FFFFFF', textDark: '#0A1628' },

      esp: { name: 'Spain',     flag: '🇪🇸', isChampion: true,
             primary: '#AA151B', secondary: '#F1BF00', accent: '#F1BF00', dark: '#7A0F13',
             textLight: '#FFFFFF', textDark: '#2A0004' },

      fra: { name: 'France',    flag: '🇫🇷', isChampion: true,
             primary: '#002395', secondary: '#FFFFFF', accent: '#ED2939', dark: '#001569',
             textLight: '#FFFFFF', textDark: '#000A30' },

      ger: { name: 'Germany',   flag: '🇩🇪', isChampion: true,
             primary: '#2A2A2A', secondary: '#FFFFFF', accent: '#DD0000', dark: '#111111',
             textLight: '#FFFFFF', textDark: '#111111' },

      eng: { name: 'England',   flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', isChampion: true,
             primary: '#CF081F', secondary: '#FFFFFF', accent: '#00247D', dark: '#9A0616',
             textLight: '#FFFFFF', textDark: '#2A0005' },
    };

    // Generic theme for non-champion teams
    const GENERIC_THEME = {
      name: null, flag: '⚽', isChampion: false,
      primary: '#4A6FA5', secondary: '#FFFFFF', accent: '#6C8EBF', dark: '#2D4A72',
      textLight: '#FFFFFF', textDark: '#0A1422',
    };

    const CHAMPION_IDS = ['arg', 'bra', 'uru', 'esp', 'fra', 'ger', 'eng'];

    // View metadata: [title, subtitle prefix]
    const VIEW_META = {
      squad:      ['Squad',                   'Full roster'],
      history:    ['Team History',             'International titles'],
      rivals:     ['Historical Rivals',        'Rival analysis'],
      coaching:   ['Coaching & Strategy',      'Technical staff and tactics'],
      groups:     ['Group Stage',              'Group results · World Cup 2026'],
      journey:    ['Team Journey',             'Path through the tournament'],
      simulate:   ['Simulate Final',           'World Cup 2026 simulation'],
      matches:    ['Match Details',            'Results and stats by phase'],
      stats:      ['Stats & Awards',           'World Cup 2026 final summary'],
      'history-wc': ['Historical World Cups', 'Previous editions'],
      live:       ['Live Events',              'Match timeline · 2026 Final'],
      'team-state': ['Team State',             'Squads on field · 2026 Final'],
      chat:       ['🎮 Play the Final',        'Interactive final match'],
    };

    // ─────────────────────────────────────────────────────────────
    // STATE HELPERS  (localStorage)
    // ─────────────────────────────────────────────────────────────
    function getState() {
      return {
        teamId: localStorage.getItem('wc_teamId') || 'arg',
        lang:   localStorage.getItem('wc_lang')   || 'es',
      };
    }

    function getConfig(teamId) {
      return TEAM_CONFIGS[teamId] || { ...GENERIC_THEME, name: teamId.toUpperCase() };
    }

    // ─────────────────────────────────────────────────────────────
    // THEME APPLICATION
    // Sets all CSS variables from the team config object.
    // ─────────────────────────────────────────────────────────────
    function applyTheme(teamId) {
      const cfg  = getConfig(teamId);
      const root = document.documentElement;

      root.style.setProperty('--team-primary',    cfg.primary);
      root.style.setProperty('--team-secondary',  cfg.secondary);
      root.style.setProperty('--team-accent',     cfg.accent);
      root.style.setProperty('--team-dark',       cfg.dark);
      root.style.setProperty('--team-text-light', cfg.textLight);
      root.style.setProperty('--team-text-dark',  cfg.textDark);
      root.style.setProperty('--team-highlight',  hexAlpha(cfg.primary, 0.12));

      // Update sidebar identity
      document.getElementById('sb-flag').textContent      = cfg.flag || '⚽';
      document.getElementById('sb-team-name').textContent = cfg.name || teamId.toUpperCase();

      // Update header
      const { lang } = getState();
      const langLabel = lang === 'es' ? 'Spanish' : 'English';
      document.getElementById('hdr-team-name').textContent  = cfg.name || teamId.toUpperCase();
      document.getElementById('hdr-lang-text').textContent  = langLabel;
      document.getElementById('lang-chip').textContent      = lang.toUpperCase();

      // Refresh current topbar subtitle
      const activeView = document.querySelector('.content.active');
      if (activeView) {
        const id = activeView.id.replace('view-', '');
        setTopbar(id, cfg.name || teamId.toUpperCase());
      }
    }

    // Convert hex color to rgba string
    function hexAlpha(hex, a) {
      const r = parseInt(hex.slice(1,3), 16);
      const g = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);
      return `rgba(${r},${g},${b},${a})`;
    }

    // ─────────────────────────────────────────────────────────────
    // NAVIGATION
    // ─────────────────────────────────────────────────────────────
    function showView(viewId, el) {
      document.querySelectorAll('.content').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

      const view = document.getElementById('view-' + viewId);
      if (view) view.classList.add('active');
      if (el)   el.classList.add('active');

      const { teamId } = getState();
      const cfg = getConfig(teamId);
      setTopbar(viewId, cfg.name || teamId.toUpperCase());
    }

    function setTopbar(viewId, teamName) {
      const [title, subtitle] = VIEW_META[viewId] || [viewId, ''];
      document.getElementById('topbar-title').textContent    = title;
      document.getElementById('topbar-subtitle').textContent = `${subtitle} · ${teamName}`;

      // Inject or clear the topbar action slot
      const actionSlot = document.getElementById('topbar-action');
      if (viewId === 'chat') {
        actionSlot.innerHTML = `
          <button class="btn btn-accent" id="start-final-btn" onclick="startFinal()">⚡ Start Final</button>`;
      } else {
        actionSlot.innerHTML = '';
      }
    }

    // ─────────────────────────────────────────────────────────────
    // ADMIN PANEL
    // ─────────────────────────────────────────────────────────────
    function openAdminPanel() {
      document.getElementById('admin-panel').classList.add('open');
      document.getElementById('admin-overlay').classList.add('open');
    }

    function closeAdminPanel() {
      document.getElementById('admin-panel').classList.remove('open');
      document.getElementById('admin-overlay').classList.remove('open');
    }

    /** Save teamId + lang to localStorage and reload the page. */
    function applyAdminConfig() {
      const teamId = document.getElementById('adm-team-id').value.trim().toLowerCase();
      const lang   = document.getElementById('adm-lang').value;
      if (!teamId) { alert('Please enter a team ID.'); return; }
      localStorage.setItem('wc_teamId', teamId);
      localStorage.setItem('wc_lang',   lang);
      window.location.reload();
    }

    /** Quick-select a champion team from the grid. */
    function selectChampion(teamId) {
      document.getElementById('adm-team-id').value = teamId;
      document.querySelectorAll('.champion-btn').forEach(b => {
        b.classList.toggle('selected', b.dataset.team === teamId);
      });
    }

    /** Build the champion quick-select grid. */
    function buildChampionGrid() {
      const grid = document.getElementById('champion-grid');
      grid.innerHTML = '';

      CHAMPION_IDS.forEach(id => {
        const cfg = TEAM_CONFIGS[id];
        const btn = document.createElement('button');
        btn.className    = 'champion-btn';
        btn.dataset.team = id;
        btn.innerHTML    = `<span class="cb-flag">${cfg.flag}</span><span class="cb-code">${id}</span>`;
        btn.onclick      = () => selectChampion(id);
        grid.appendChild(btn);
      });

      // Generic option
      const generic = document.createElement('button');
      generic.className    = 'champion-btn';
      generic.dataset.team = '__generic';
      generic.innerHTML    = `<span class="cb-flag">⚽</span><span class="cb-code">other</span>`;
      generic.onclick      = () => {
        document.getElementById('adm-team-id').value = '';
        document.querySelectorAll('.champion-btn').forEach(b => b.classList.remove('selected'));
        generic.classList.add('selected');
      };
      grid.appendChild(generic);
    }

    /** Populate admin panel info box from current state. */
    function updateAdminInfo() {
      const { teamId, lang } = getState();
      const cfg = getConfig(teamId);
      document.getElementById('adm-info-team').textContent  = `${cfg.flag || '⚽'} ${cfg.name || teamId.toUpperCase()}`;
      document.getElementById('adm-info-lang').textContent  = lang === 'es' ? '🇪🇸 Spanish' : '🇬🇧 English';
      document.getElementById('adm-info-theme').textContent = cfg.isChampion ? '🏆 Champion team' : '⚽ Generic';
    }

    // ─────────────────────────────────────────────────────────────
    // CHAT DEMO
    // ─────────────────────────────────────────────────────────────
    function startFinal() {
      // Remove the waiting message
      const waitingMsg = document.getElementById('chat-waiting-msg');
      if (waitingMsg) waitingMsg.remove();

      // Hide the Start Final button (can't restart)
      const startBtn = document.getElementById('start-final-btn');
      if (startBtn) { startBtn.disabled = true; startBtn.textContent = '✅ Final started'; startBtn.style.opacity = '0.5'; startBtn.style.cursor = 'not-allowed'; }

      // Enable chat input + send button
      const input   = document.getElementById('chat-input');
      const sendBtn = document.getElementById('chat-send-btn');
      input.disabled   = false;
      sendBtn.disabled = false;
      sendBtn.style.opacity = '1';
      sendBtn.style.cursor  = 'pointer';

      // Load initial match messages
      const messages = document.getElementById('chat-messages');
      const m1 = document.createElement('div');
      m1.className = 'chat-msg system';
      m1.innerHTML = `<div class="chat-bubble">⚽ World Cup 2026 Final has started! 🇦🇷 Argentina vs France 🇫🇷</div>`;
      messages.appendChild(m1);

      setTimeout(() => {
        const m2 = document.createElement('div');
        m2.className = 'chat-msg bot';
        m2.innerHTML = `<div class="chat-bubble">
          The match is about to begin. Formation: 4-3-3 · Strategy: COUNTER_ATTACK.<br><br>
          <strong>What do you do on the first turn?</strong><br>
          1️⃣ Attack through the center<br>
          2️⃣ Attack down the wing<br>
          3️⃣ Sit back and defend
        </div>`;
        messages.appendChild(m2);
        messages.scrollTop = messages.scrollHeight;
        input.focus();
      }, 600);
    }

    function sendChat() {
      const input   = document.getElementById('chat-input');
      const sendBtn = document.getElementById('chat-send-btn');
      if (sendBtn.disabled) return;
      const val = input.value.trim();
      if (!val) return;

      const messages = document.getElementById('chat-messages');

      const userBubble = document.createElement('div');
      userBubble.className = 'chat-msg user';
      userBubble.innerHTML = `<div class="chat-bubble">${val}</div>`;
      messages.appendChild(userBubble);
      input.value = '';

      setTimeout(() => {
        const botBubble = document.createElement('div');
        botBubble.className = 'chat-msg bot';
        botBubble.innerHTML = `<div class="chat-bubble">
          ⚙️ Processing your action...<br><br>
          1️⃣ High press<br>2️⃣ Long ball<br>3️⃣ Tactical pause
        </div>`;
        messages.appendChild(botBubble);
        messages.scrollTop = messages.scrollHeight;
      }, 500);

      messages.scrollTop = messages.scrollHeight;
    }

    // ─────────────────────────────────────────────────────────────
    // MOCK DATA: RIVALS
    // In the real app: GET /teams/{teamId}/rivals → list of {id, name}
    // Then for each rival: GET /teams?teamId= to get full team data.
    // ─────────────────────────────────────────────────────────────
    const MOCK_RIVALS = [
      { id:'bra', flag:'🇧🇷', name:'Brazil',      conf:'CONMEBOL', rating:92, coach:'Carlo Ancelotti',   captain:'Marquinhos',        strategy:'ATTACK',         formation:'4-3-3'   },
      { id:'uru', flag:'🇺🇾', name:'Uruguay',     conf:'CONMEBOL', rating:84, coach:'Marcelo Bielsa',    captain:'Federico Valverde', strategy:'COUNTER_ATTACK', formation:'4-4-2'   },
      { id:'eng', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', name:'England',     conf:'UEFA',     rating:89, coach:'Thomas Tuchel',     captain:'Harry Kane',        strategy:'BALANCED',       formation:'4-2-3-1' },
      { id:'ned', flag:'🇳🇱', name:'Netherlands', conf:'UEFA',     rating:86, coach:'Ronald Koeman',     captain:'Virgil van Dijk',   strategy:'ATTACK',         formation:'4-3-3'   },
      { id:'fra', flag:'🇫🇷', name:'France',      conf:'UEFA',     rating:91, coach:'Didier Deschamps',  captain:'Kylian Mbappé',     strategy:'POSSESSION',     formation:'4-2-3-1' },
      { id:'ger', flag:'🇩🇪', name:'Germany',     conf:'UEFA',     rating:88, coach:'Julian Nagelsmann', captain:'Ilkay Gündogan',    strategy:'ATTACK',         formation:'4-3-3'   },
    ];

    const TEAM_FLAGS = { arg:'🇦🇷', bra:'🇧🇷', uru:'🇺🇾', fra:'🇫🇷', ger:'🇩🇪', eng:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', esp:'🇪🇸', ned:'🇳🇱', jpn:'🇯🇵', pan:'🇵🇦' };

    function buildRivalsGrid() {
      const grid = document.getElementById('rivals-grid');
      if (!grid) return;
      grid.innerHTML = MOCK_RIVALS.map(r => `
        <div class="rival-card">
          <div class="rival-flag">${r.flag}</div>
          <div class="rival-name">${r.name}</div>
          <div class="rival-conf">${r.conf}</div>
          <div class="rival-rating-row">
            <span class="rival-rating-val">${r.rating}</span>
            <span class="rival-rating-lbl">Overall Rating</span>
          </div>
          <div class="rival-detail">
            🧑‍💼 <strong>${r.coach}</strong><br>
            🪖 Captain: <strong>${r.captain}</strong>
          </div>
          <div class="rival-badges">
            <span class="badge badge-gray" style="font-size:10px">${r.formation}</span>
            <span class="badge badge-primary" style="font-size:10px">${r.strategy.replace(/_/g,' ')}</span>
          </div>
        </div>`).join('');
    }

    // ─────────────────────────────────────────────────────────────
    // MOCK DATA: HISTORICAL WORLD CUPS (simulated, not real FIFA)
    // In the real app: GET /world-cup/history → [worldCupId, ...]
    // Then: GET /world-cup/{worldCupId}/stats for each
    // ─────────────────────────────────────────────────────────────
    const MOCK_WC_HISTORY = [
      {
        id: 'wc_9f9e0d9d-f6b9-46c2-b471-4a172b37cc1f',
        edition: 1,
        totalMatches: 104, totalGoals: 276, avgGoals: 2.65,
        champion:   { teamId:'arg', teamName:'Argentina' },
        runnerUp:   { teamId:'bra', teamName:'Brazil'    },
        thirdPlace: { teamId:'uru', teamName:'Uruguay'   },
        fourthPlace:{ teamId:'ger', teamName:'Germany'   },
        topScorer:  { playerName:'Lionel Messi', teamName:'Argentina', value: 7 },
        topAssist:  { playerName:'Lionel Messi', teamName:'Argentina', value: 7 },
        cards:      { totalYellowCards: 12, totalRedCards: 1 },
      },
    ];

    function buildWcHistory() {
      const container = document.getElementById('wc-history-container');
      if (!container) return;

      if (MOCK_WC_HISTORY.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📜</div>
          <p>No simulated World Cups yet. Simulate one first!</p></div>`;
        return;
      }

      container.innerHTML = MOCK_WC_HISTORY.map((wc, i) => {
        const champFlag  = TEAM_FLAGS[wc.champion.teamId]   || '⚽';
        const runnerFlag = TEAM_FLAGS[wc.runnerUp.teamId]   || '⚽';
        const thirdFlag  = TEAM_FLAGS[wc.thirdPlace.teamId] || '⚽';
        const fourthFlag = TEAM_FLAGS[wc.fourthPlace.teamId]|| '⚽';
        return `
        <div class="card" style="margin-bottom:14px">
          <div class="card-header">
            <span class="card-title">🏆 World Cup — Edition ${i + 1}</span>
            <span class="badge badge-gray" style="font-size:10px">${wc.id.substring(0,18)}…</span>
          </div>

          <!-- Podium -->
          <div class="podium-row" style="margin-bottom:16px">
            <div class="podium-card">
              <div class="podium-medal">🥇</div>
              <div class="podium-flag">${champFlag}</div>
              <div class="podium-name">${wc.champion.teamName}</div>
              <div class="podium-place">Champion</div>
            </div>
            <div class="podium-card">
              <div class="podium-medal">🥈</div>
              <div class="podium-flag">${runnerFlag}</div>
              <div class="podium-name">${wc.runnerUp.teamName}</div>
              <div class="podium-place">Runner-up</div>
            </div>
            <div class="podium-card">
              <div class="podium-medal">🥉</div>
              <div class="podium-flag">${thirdFlag}</div>
              <div class="podium-name">${wc.thirdPlace.teamName}</div>
              <div class="podium-place">3rd Place</div>
            </div>
            <div class="podium-card">
              <div class="podium-medal">4️⃣</div>
              <div class="podium-flag">${fourthFlag}</div>
              <div class="podium-name">${wc.fourthPlace.teamName}</div>
              <div class="podium-place">4th Place</div>
            </div>
          </div>

          <!-- Stats row -->
          <div class="grid-4" style="margin-bottom:14px">
            <div class="stat-box"><div class="stat-value">${wc.totalMatches}</div><div class="stat-label">Matches</div></div>
            <div class="stat-box"><div class="stat-value">${wc.totalGoals}</div><div class="stat-label">Goals</div></div>
            <div class="stat-box"><div class="stat-value">${wc.avgGoals}</div><div class="stat-label">Goals / Match</div></div>
            <div class="stat-box"><div class="stat-value">${wc.cards.totalYellowCards}🟨 ${wc.cards.totalRedCards}🟥</div><div class="stat-label">Cards</div></div>
          </div>

          <!-- Individual awards -->
          <div class="grid-2">
            <div style="background:var(--bg-card-hover);border-radius:8px;padding:12px 14px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">⭐ Top Scorer</div>
              <div style="font-size:14px;font-weight:700">${wc.topScorer.playerName}</div>
              <div style="font-size:11px;color:var(--text-muted)">${wc.topScorer.teamName} · <strong style="color:var(--team-primary)">${wc.topScorer.value} goals</strong></div>
            </div>
            <div style="background:var(--bg-card-hover);border-radius:8px;padding:12px 14px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">🎯 Top Assists</div>
              <div style="font-size:14px;font-weight:700">${wc.topAssist.playerName}</div>
              <div style="font-size:11px;color:var(--text-muted)">${wc.topAssist.teamName} · <strong style="color:var(--team-primary)">${wc.topAssist.value} assists</strong></div>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    // ─────────────────────────────────────────────────────────────
    // MOCK DATA: GROUP STAGE
    // Argentina is in Group E. In the real app the group is derived
    // from the API response for the selected teamId.
    // ─────────────────────────────────────────────────────────────
    const MOCK_GROUPS = {
      A: [
        {pos:1,flag:'🇨🇩',name:'DR Congo',    conf:'CAF',     p:3,w:2,d:1,l:0,gf:2,ga:0,gd:2,  pts:7,q:true, bt:false},
        {pos:2,flag:'🇩🇪',name:'Germany',     conf:'UEFA',    p:3,w:1,d:2,l:0,gf:2,ga:1,gd:1,  pts:5,q:true, bt:false},
        {pos:3,flag:'🇵🇦',name:'Panama',      conf:'CONCACAF',p:3,w:1,d:1,l:1,gf:3,ga:3,gd:0,  pts:4,q:true, bt:true},
        {pos:4,flag:'🇵🇾',name:'Paraguay',    conf:'CONMEBOL',p:3,w:0,d:0,l:3,gf:1,ga:4,gd:-3, pts:0,q:false,bt:false},
      ],
      B: [
        {pos:1,flag:'🇦🇷',name:'Argentina',   conf:'CONMEBOL',p:3,w:3,d:0,l:0,gf:7,ga:1,gd:6,  pts:9,q:true, bt:false,highlight:true},
        {pos:2,flag:'🇳🇿',name:'New Zealand', conf:'OFC',     p:3,w:1,d:1,l:1,gf:3,ga:4,gd:-1, pts:4,q:true, bt:false},
        {pos:3,flag:'🇸🇪',name:'Sweden',      conf:'UEFA',    p:3,w:0,d:2,l:1,gf:1,ga:2,gd:-1, pts:2,q:false,bt:false},
        {pos:4,flag:'🇨🇭',name:'Switzerland', conf:'UEFA',    p:3,w:0,d:1,l:2,gf:2,ga:6,gd:-4, pts:1,q:false,bt:false},
      ],
      C: [
        {pos:1,flag:'🇪🇸',name:'Spain',       conf:'UEFA',    p:3,w:3,d:0,l:0,gf:6,ga:1,gd:5,  pts:9,q:true, bt:false},
        {pos:2,flag:'🇲🇽',name:'Mexico',      conf:'CONCACAF',p:3,w:2,d:0,l:1,gf:4,ga:1,gd:3,  pts:6,q:true, bt:false},
        {pos:3,flag:'🇦🇺',name:'Australia',   conf:'AFC',     p:3,w:1,d:0,l:2,gf:2,ga:4,gd:-2, pts:3,q:true, bt:true},
        {pos:4,flag:'🇵🇹',name:'Portugal',    conf:'UEFA',    p:3,w:0,d:0,l:3,gf:0,ga:6,gd:-6, pts:0,q:false,bt:false},
      ],
      D: [
        {pos:1,flag:'🇩🇿',name:'Algeria',     conf:'CAF',     p:3,w:3,d:0,l:0,gf:9,ga:2,gd:7,  pts:9,q:true, bt:false},
        {pos:2,flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',name:'England',     conf:'UEFA',    p:3,w:2,d:0,l:1,gf:4,ga:5,gd:-1, pts:6,q:true, bt:false},
        {pos:3,flag:'🇭🇹',name:'Haiti',       conf:'CONCACAF',p:3,w:0,d:1,l:2,gf:4,ga:7,gd:-3, pts:1,q:false,bt:false},
        {pos:4,flag:'🇺🇸',name:'United States',conf:'CONCACAF',p:3,w:0,d:1,l:2,gf:2,ga:5,gd:-3,pts:1,q:false,bt:false},
      ],
      E: [
        {pos:1,flag:'🇳🇱',name:'Netherlands', conf:'UEFA',    p:3,w:2,d:1,l:0,gf:5,ga:2,gd:3,  pts:7,q:true, bt:false},
        {pos:2,flag:'🇹🇳',name:'Tunisia',     conf:'CAF',     p:3,w:1,d:2,l:0,gf:4,ga:2,gd:2,  pts:5,q:true, bt:false},
        {pos:3,flag:'🇺🇾',name:'Uruguay',     conf:'CONMEBOL',p:3,w:1,d:1,l:1,gf:6,ga:4,gd:2,  pts:4,q:true, bt:true},
        {pos:4,flag:'🇿🇦',name:'South Africa',conf:'CAF',     p:3,w:0,d:0,l:3,gf:4,ga:11,gd:-7,pts:0,q:false,bt:false},
      ],
      F: [
        {pos:1,flag:'🇯🇵',name:'Japan',       conf:'AFC',     p:3,w:2,d:1,l:0,gf:6,ga:4,gd:2,  pts:7,q:true, bt:false},
        {pos:2,flag:'🇧🇷',name:'Brazil',      conf:'CONMEBOL',p:3,w:1,d:2,l:0,gf:5,ga:4,gd:1,  pts:5,q:true, bt:false},
        {pos:3,flag:'🇪🇬',name:'Egypt',       conf:'CAF',     p:3,w:0,d:2,l:1,gf:4,ga:5,gd:-1, pts:2,q:true, bt:true},
        {pos:4,flag:'🇲🇦',name:'Morocco',     conf:'CAF',     p:3,w:0,d:1,l:2,gf:4,ga:6,gd:-2, pts:1,q:false,bt:false},
      ],
      G: [
        {pos:1,flag:'🇫🇷',name:'France',      conf:'UEFA',    p:3,w:2,d:1,l:0,gf:9,ga:0,gd:9,  pts:7,q:true, bt:false},
        {pos:2,flag:'🇬🇭',name:'Ghana',       conf:'CAF',     p:3,w:1,d:1,l:1,gf:1,ga:5,gd:-4, pts:4,q:true, bt:false},
        {pos:3,flag:'🇧🇦',name:'Bosnia & Herz.',conf:'UEFA',  p:3,w:0,d:2,l:1,gf:0,ga:1,gd:-1, pts:2,q:false,bt:false},
        {pos:4,flag:'🇨🇻',name:'Cape Verde',  conf:'CAF',     p:3,w:0,d:2,l:1,gf:0,ga:4,gd:-4, pts:2,q:false,bt:false},
      ],
      H: [
        {pos:1,flag:'🇦🇹',name:'Austria',     conf:'UEFA',    p:3,w:2,d:1,l:0,gf:6,ga:2,gd:4,  pts:7,q:true, bt:false},
        {pos:2,flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿',name:'Scotland',    conf:'UEFA',    p:3,w:1,d:1,l:1,gf:4,ga:2,gd:2,  pts:4,q:true, bt:false},
        {pos:3,flag:'🇺🇿',name:'Uzbekistan',  conf:'AFC',     p:3,w:1,d:1,l:1,gf:2,ga:2,gd:0,  pts:4,q:true, bt:true},
        {pos:4,flag:'🇰🇷',name:'South Korea', conf:'AFC',     p:3,w:0,d:1,l:2,gf:0,ga:6,gd:-6, pts:1,q:false,bt:false},
      ],
      I: [
        {pos:1,flag:'🇹🇷',name:'Turkey',      conf:'UEFA',    p:3,w:2,d:1,l:0,gf:5,ga:3,gd:2,  pts:7,q:true, bt:false},
        {pos:2,flag:'🇨🇿',name:'Czech Republic',conf:'UEFA',  p:3,w:1,d:1,l:1,gf:3,ga:3,gd:0,  pts:4,q:true, bt:false},
        {pos:3,flag:'🇨🇴',name:'Colombia',    conf:'CONMEBOL',p:3,w:1,d:0,l:2,gf:2,ga:3,gd:-1, pts:3,q:true, bt:true},
        {pos:4,flag:'🇸🇦',name:'Saudi Arabia',conf:'AFC',     p:3,w:1,d:0,l:2,gf:1,ga:2,gd:-1, pts:3,q:false,bt:false},
      ],
      J: [
        {pos:1,flag:'🇳🇴',name:'Norway',      conf:'UEFA',    p:3,w:2,d:1,l:0,gf:5,ga:2,gd:3,  pts:7,q:true, bt:false},
        {pos:2,flag:'🇨🇦',name:'Canada',      conf:'CONCACAF',p:3,w:1,d:1,l:1,gf:5,ga:4,gd:1,  pts:4,q:true, bt:false},
        {pos:3,flag:'🇸🇳',name:'Senegal',     conf:'CAF',     p:3,w:1,d:1,l:1,gf:4,ga:4,gd:0,  pts:4,q:true, bt:true},
        {pos:4,flag:'🇭🇷',name:'Croatia',     conf:'UEFA',    p:3,w:0,d:1,l:2,gf:1,ga:5,gd:-4, pts:1,q:false,bt:false},
      ],
      K: [
        {pos:1,flag:'🇯🇴',name:'Jordan',      conf:'AFC',     p:3,w:3,d:0,l:0,gf:8,ga:1,gd:7,  pts:9,q:true, bt:false},
        {pos:2,flag:'🇨🇼',name:'Curacao',     conf:'CONCACAF',p:3,w:2,d:0,l:1,gf:7,ga:6,gd:1,  pts:6,q:true, bt:false},
        {pos:3,flag:'🇶🇦',name:'Qatar',       conf:'AFC',     p:3,w:0,d:1,l:2,gf:3,ga:6,gd:-3, pts:1,q:false,bt:false},
        {pos:4,flag:'🇨🇮',name:'Ivory Coast', conf:'CAF',     p:3,w:0,d:1,l:2,gf:3,ga:8,gd:-5, pts:1,q:false,bt:false},
      ],
      L: [
        {pos:1,flag:'🇧🇪',name:'Belgium',     conf:'UEFA',    p:3,w:2,d:1,l:0,gf:6,ga:1,gd:5,  pts:7,q:true, bt:false},
        {pos:2,flag:'🇪🇨',name:'Ecuador',     conf:'CONMEBOL',p:3,w:2,d:0,l:1,gf:3,ga:2,gd:1,  pts:6,q:true, bt:false},
        {pos:3,flag:'🇮🇷',name:'Iran',        conf:'AFC',     p:3,w:0,d:2,l:1,gf:4,ga:5,gd:-1, pts:2,q:true, bt:true},
        {pos:4,flag:'🇮🇶',name:'Iraq',        conf:'AFC',     p:3,w:0,d:1,l:2,gf:2,ga:7,gd:-5, pts:1,q:false,bt:false},
      ],
    };

    let activeGroup = 'B'; // Argentina's group (in real app: derived from API)

    function buildGroupSelector() {
      const sel = document.getElementById('group-selector');
      sel.innerHTML = '';
      Object.keys(MOCK_GROUPS).forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'group-btn' + (letter === activeGroup ? ' active' : '');
        btn.dataset.group = letter;
        btn.textContent = letter;
        btn.onclick = () => showGroup(letter);
        sel.appendChild(btn);
      });
    }

    function showGroup(letter) {
      activeGroup = letter;
      document.querySelectorAll('.group-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.group === letter));
      renderGroupTable(letter);
    }

    function renderGroupTable(letter) {
      const teams = MOCK_GROUPS[letter];
      const hasBestThird = teams.some(t => t.bt);

      const rows = teams.map(t => {
        const gd = t.gd > 0 ? `+${t.gd}` : `${t.gd}`;
        const hl = t.highlight ? 'highlight-row' : '';
        const nameWeight = t.highlight ? 'font-weight:800' : '';

        let qualBadge = '';
        if (t.bt) {
          qualBadge = '<span style="color:#2196F3;font-weight:700;font-size:11px" title="Best Third — qualified">★ 3°</span>';
        } else if (t.q) {
          qualBadge = '<span style="color:#4CAF50;font-weight:700;font-size:12px">✓</span>';
        }

        return `<tr class="${t.q || t.bt ? 'qualified' : ''} ${hl}">
          <td><span class="team-name-cell">
            <span class="pos-circle">${t.pos}</span>
            <span style="${nameWeight}">${t.flag} ${t.name}</span>
          </span></td>
          <td>${t.conf}</td>
          <td>${t.p}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td>
          <td>${t.gf}</td><td>${t.ga}</td><td>${gd}</td>
          <td class="pts-cell">${t.pts}</td>
          <td>${qualBadge}</td>
        </tr>`;
      }).join('');

      const legend = hasBestThird
        ? '🟢 Top 2 qualify &nbsp;·&nbsp; <span style="color:#2196F3">★ Best Third</span> — also qualified'
        : '🟢 Top 2 qualify &nbsp;·&nbsp; Best thirds may also advance';

      document.getElementById('group-table-container').innerHTML = `
        <div class="card">
          <div class="card-header">
            <span class="card-title">Group ${letter}</span>
            <span class="badge badge-gray">3 matches played</span>
          </div>
          <div class="group-table-wrap">
            <table class="group-table">
              <thead>
                <tr>
                  <th style="min-width:160px">Team</th><th>Conf</th>
                  <th>P</th><th>W</th><th>D</th><th>L</th>
                  <th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th></th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div style="margin-top:10px;font-size:11px;color:var(--text-muted)">
            ${legend}
          </div>
        </div>`;
    }

    // ─────────────────────────────────────────────────────────────
    // MOCK DATA: MATCH DETAILS
    // ─────────────────────────────────────────────────────────────
    const MOCK_MATCHES = [
      // ── Group Stage ────────────────────────────────────────────────
      // Argentina (Group B) — all 3 matches
      {stage:'GROUP_STAGE', code:'B-M1', home:'🇦🇷 Argentina', away:'🇳🇿 New Zealand', score:'2–0', res:'REGULAR_TIME', pom:'Giovani Lo Celso',  goals:'Otamendi 55\' · Lo Celso 77\''},
      {stage:'GROUP_STAGE', code:'B-M3', home:'🇦🇷 Argentina', away:'🇸🇪 Sweden',      score:'2–1', res:'REGULAR_TIME', pom:'Marcos Acuña',        goals:'Acuña 65\' · J. Álvarez 87\' / Isak Hien 66\''},
      {stage:'GROUP_STAGE', code:'B-M5', home:'🇦🇷 Argentina', away:'🇨🇭 Switzerland', score:'3–0', res:'REGULAR_TIME', pom:'Julián Álvarez',      goals:'J. Álvarez 25\' · Montiel 69\' · Palacios 82\''},
      // Other notable Group B match
      {stage:'GROUP_STAGE', code:'B-M4', home:'🇳🇿 New Zealand', away:'🇨🇭 Switzerland', score:'3–2', res:'REGULAR_TIME', pom:'Ben Waine',         goals:'Howieson 4\' · B. Waine 27\' · E. Just 53\' / Vargas 50\' · R. Rodríguez 86\''},
      // Group A
      {stage:'GROUP_STAGE', code:'A-M1', home:'🇩🇪 Germany',   away:'🇵🇾 Paraguay',   score:'1–0', res:'REGULAR_TIME', pom:'Pascal Gross',        goals:'Gross 35\''},
      {stage:'GROUP_STAGE', code:'A-M2', home:'🇵🇦 Panama',    away:'🇨🇩 DR Congo',   score:'0–1', res:'REGULAR_TIME', pom:'Arthur Masuaku',      goals:'Masuaku 58\''},

      // ── Round of 32 ────────────────────────────────────────────────
      {stage:'ROUND_OF_32', code:'R32-1',  home:'🇦🇷 Argentina', away:'🇩🇿 Algeria',  score:'1–0', res:'REGULAR_TIME', pom:'Giovani Lo Celso',  goals:'Lo Celso 22\''},
      {stage:'ROUND_OF_32', code:'R32-2',  home:'🇨🇩 DR Congo',  away:'🇫🇷 France',   score:'0–1', res:'REGULAR_TIME', pom:'Kingsley Coman',    goals:'Coman 76\''},
      // 🚨 Upset: New Zealand beats Brazil
      {stage:'ROUND_OF_32', code:'R32-11', home:'🇳🇿 New Zealand', away:'🇧🇷 Brazil', score:'3–2', res:'REGULAR_TIME', pom:'Clayton Lewis',      goals:'C. Lewis 7\' · J. Bell 50\' · Howieson 72\' / Antony 30\' · Estevão 75\''},
      // 🚨 Upset: Turkey beats Spain
      {stage:'ROUND_OF_32', code:'R32-16', home:'🇹🇷 Turkey',    away:'🇪🇸 Spain',    score:'2–0', res:'REGULAR_TIME', pom:'Kerem Akturkoglu',  goals:'Akturkoglu 3\' · S. Ozcan 40\''},

      // ── Round of 16 ────────────────────────────────────────────────
      {stage:'ROUND_OF_16', code:'R16-1',  home:'🇦🇷 Argentina', away:'🇯🇴 Jordan',       score:'2–0', res:'REGULAR_TIME', pom:'Enzo Fernández',     goals:'Montiel 1\' · E. Fernández 3\''},
      {stage:'ROUND_OF_16', code:'R16-2',  home:'🇵🇦 Panama',    away:'🇹🇳 Tunisia',      score:'2–0', res:'REGULAR_TIME', pom:'Fredy Góndola',       goals:'Góndola 6\' 6\''},
      {stage:'ROUND_OF_16', code:'R16-3',  home:'🇳🇱 Netherlands', away:'🇯🇵 Japan',      score:'1–3', res:'REGULAR_TIME', pom:'Wataru Endo',         goals:'J. Ito 28\' · T. Kubo 37\' · W. Endo 61\' / Bergwijn 44\''},
      {stage:'ROUND_OF_16', code:'R16-4',  home:'🇲🇽 Mexico',    away:'🇺🇿 Uzbekistan',   score:'1–2', res:'REGULAR_TIME', pom:'Alan Pulido',         goals:'A. Pulido 54\' / Alikulov 57\' · Fayzullaev —'},

      // ── Quarter Finals ─────────────────────────────────────────────
      {stage:'QUARTER_FINALS', code:'QF-1', home:'🇦🇷 Argentina', away:'🇵🇦 Panama',  score:'2–1', res:'REGULAR_TIME', pom:'Rodrigo De Paul',      goals:'Otamendi 9\' · De Paul 86\' / E. Walker 7\''},
      {stage:'QUARTER_FINALS', code:'QF-2', home:'🇫🇷 France',    away:'🇪🇬 Egypt',   score:'2–1', res:'REGULAR_TIME', pom:'Michael Olise',         goals:'Olise 59\' · Tchouameni 77\' / M. Hamdy 38\''},
      {stage:'QUARTER_FINALS', code:'QF-3', home:'🇯🇵 Japan',     away:'🇺🇾 Uruguay', score:'0–0 (5–4p)', res:'PENALTIES', pom:'Kosuke Matsui',     goals:'—'},
      {stage:'QUARTER_FINALS', code:'QF-4', home:'🇺🇿 Uzbekistan', away:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 England', score:'0–1', res:'EXTRA_TIME', pom:'Lewis Hall',     goals:'L. Hall 71\''},

      // ── Semi Finals ────────────────────────────────────────────────
      {stage:'SEMI_FINALS', code:'SF-1', home:'🇦🇷 Argentina', away:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 England', score:'1–0', res:'EXTRA_TIME',   pom:'Enzo Fernández',    goals:'E. Fernández 87\''},
      {stage:'SEMI_FINALS', code:'SF-2', home:'🇯🇵 Japan',     away:'🇫🇷 France',    score:'0–2', res:'REGULAR_TIME', pom:'Marcus Thuram',        goals:'M. Thuram 59\' · J. Kounde 66\''},

      // ── Third Place ────────────────────────────────────────────────
      {stage:'THIRD_PLACE', code:'TP-1', home:'🇯🇵 Japan', away:'🏴󠁧󠁢󠁥󠁮󠁧󠁿 England', score:'1–2', res:'REGULAR_TIME', pom:'Kou Itakura', goals:'K. Itakura 1\' / P. Foden 25\' · M. Rashford 29\''},

      // ── Final ──────────────────────────────────────────────────────
      {stage:'FINAL', code:'FINAL-1', home:'🇦🇷 Argentina', away:'🇫🇷 France', score:'—', res:'PENDING', pom:null, goals:null, pending:true},
    ];

    const STAGE_LABELS = {
      ALL:            'All',
      GROUP_STAGE:    'Group Stage',
      ROUND_OF_32:    'Round of 32',
      ROUND_OF_16:    'Round of 16',
      QUARTER_FINALS: 'Quarter Finals',
      SEMI_FINALS:    'Semi Finals',
      THIRD_PLACE:    '3rd Place',
      FINAL:          'Final',
    };

    let activeStage = 'ALL';

    function buildStageTabs() {
      const tabs = document.getElementById('stage-tabs');
      tabs.innerHTML = '';
      Object.entries(STAGE_LABELS).forEach(([key, label]) => {
        const btn = document.createElement('button');
        btn.className = 'stage-tab' + (key === activeStage ? ' active' : '');
        btn.dataset.stage = key;
        btn.textContent = label;
        btn.onclick = () => filterMatches(key);
        tabs.appendChild(btn);
      });
    }

    function filterMatches(stage) {
      activeStage = stage;
      document.querySelectorAll('.stage-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.stage === stage));
      renderMatches(stage);
    }

    function renderMatches(stage) {
      const list = stage === 'ALL'
        ? MOCK_MATCHES
        : MOCK_MATCHES.filter(m => m.stage === stage);

      const cards = list.map(m => {
        const resLabel = {
          REGULAR_TIME: 'Regular Time',
          EXTRA_TIME:   'Extra Time',
          PENALTIES:    '🥅 Penalties',
          PENDING:      '⏳ Pending',
        }[m.res] || m.res;

        const footer = m.pending
          ? '<em style="color:var(--text-muted)">Match not yet played</em>'
          : `${m.pom ? `⭐ PoM: <span class="match-pom">${m.pom}</span>` : ''}`
          + `${m.goals ? `<br><span style="color:var(--text-muted)">⚽ ${m.goals}</span>` : ''}`;

        return `<div class="match-card">
          <div class="match-card-top">
            <span class="match-code-lbl">${m.code}</span>
            <span class="match-res-lbl">${resLabel}</span>
          </div>
          <div class="match-teams-row">
            <div class="match-team-info">${m.home}</div>
            <div class="match-score-big">${m.score}</div>
            <div class="match-team-info">${m.away}</div>
          </div>
          <div class="match-card-foot">${footer}</div>
        </div>`;
      }).join('');

      document.getElementById('matches-container').innerHTML =
        cards || '<div class="empty-state" style="padding:40px 0"><div class="empty-icon">📅</div><p>No matches for this stage.</p></div>';
    }

    // ─────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
      const { teamId, lang } = getState();

      // Apply team theme
      applyTheme(teamId);

      // Pre-fill admin panel inputs
      document.getElementById('adm-team-id').value = teamId;
      document.getElementById('adm-lang').value     = lang;

      // Build champion grid and mark current selection
      buildChampionGrid();
      const currentBtn = document.querySelector(`.champion-btn[data-team="${teamId}"]`);
      if (currentBtn) currentBtn.classList.add('selected');

      // Fill admin info box
      updateAdminInfo();

      // Set initial topbar
      setTopbar('squad', getConfig(teamId).name || teamId.toUpperCase());

      // Build Rivals grid
      buildRivalsGrid();

      // Build WC History cards
      buildWcHistory();

      // Build Group Stage selector + default table
      buildGroupSelector();
      renderGroupTable(activeGroup);

      // Build Match Details tabs + default list
      buildStageTabs();
      renderMatches(activeStage);

      // Chat: send on Enter (only when input is enabled)
      document.getElementById('chat-input').addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.target.disabled) sendChat();
      });
    });

