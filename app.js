// EAC Championship 2026 - Main Application Logic (English Version)

// State
let allSwimmers = [];
let allTeams = [];
let favoriteSwimmers = JSON.parse(localStorage.getItem('eac_favorites') || '[]');
let currentActiveSwimmer = null;
let currentTab = 'search'; // 'search', 'program', 'teams', 'favorites'

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  checkUrlParams();
});

// Load and prepare data
function loadData() {
  allSwimmers = getAllSwimmers();
  allTeams = getAllTeams();
  updateFavoritesCount();
}

// Setup Event Listeners
function setupEventListeners() {
  const searchInput = document.getElementById('swimmerSearchInput');
  const searchResultsDropdown = document.getElementById('searchResultsDropdown');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  // Search input live filtering
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length > 0) {
      clearSearchBtn.classList.remove('hidden');
      performSearch(query);
    } else {
      clearSearchBtn.classList.add('hidden');
      searchResultsDropdown.classList.add('hidden');
    }
  });

  // Search focus
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length > 0) {
      searchResultsDropdown.classList.remove('hidden');
    } else {
      showQuickSwimmers();
    }
  });

  // Clear search
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    searchResultsDropdown.classList.add('hidden');
    searchInput.focus();
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResultsDropdown.contains(e.target)) {
      searchResultsDropdown.classList.add('hidden');
    }
  });

  // Navigation Tabs
  document.querySelectorAll('[data-tab-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab-target');
      switchTab(target);
    });
  });

  // Meet Program Filters
  const sessionFilter = document.getElementById('programSessionFilter');
  const eventFilter = document.getElementById('programEventFilter');
  if (sessionFilter) {
    sessionFilter.addEventListener('change', renderFullProgram);
  }
  if (eventFilter) {
    eventFilter.addEventListener('change', renderFullProgram);
  }
}

// Check URL Params for direct deep-linking
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const swimmerParam = params.get('swimmer');
  const tabParam = params.get('tab');
  const eventParam = params.get('event');

  if (swimmerParam) {
    const matched = allSwimmers.find(s => 
      s.name.toLowerCase() === swimmerParam.toLowerCase() ||
      formatNameForDisplay(s.name).toLowerCase() === swimmerParam.toLowerCase()
    );
    if (matched) {
      switchTab('search');
      selectSwimmer(matched.name);
      return;
    }
  }

  if (tabParam) {
    switchTab(tabParam);
    if (eventParam && tabParam === 'program') {
      const eventFilter = document.getElementById('programEventFilter');
      if (eventFilter) {
        eventFilter.value = eventParam;
        renderFullProgram();
      }
    }
  } else {
    // Default tab: search
    switchTab('search');
  }
}

// Switch Active Tab
function switchTab(tabId) {
  currentTab = tabId;

  // Update nav buttons
  document.querySelectorAll('[data-tab-target]').forEach(btn => {
    const isTarget = btn.getAttribute('data-tab-target') === tabId;
    if (isTarget) {
      btn.className = "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-sky-600 text-white shadow-sm transition-all";
    } else {
      btn.className = "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all";
    }
  });

  // Hide all sections
  document.getElementById('searchSection').classList.add('hidden');
  document.getElementById('programSection').classList.add('hidden');
  document.getElementById('teamsSection').classList.add('hidden');
  document.getElementById('favoritesSection').classList.add('hidden');

  // Show active section
  if (tabId === 'search') {
    document.getElementById('searchSection').classList.remove('hidden');
    if (!currentActiveSwimmer) {
      showQuickSwimmers();
    }
  } else if (tabId === 'program') {
    document.getElementById('programSection').classList.remove('hidden');
    populateProgramEventFilter();
    renderFullProgram();
  } else if (tabId === 'teams') {
    document.getElementById('teamsSection').classList.remove('hidden');
    renderTeams();
  } else if (tabId === 'favorites') {
    document.getElementById('favoritesSection').classList.remove('hidden');
    renderFavorites();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Perform Live Search
function performSearch(query) {
  const dropdown = document.getElementById('searchResultsDropdown');
  const cleanQuery = query.toLowerCase().replace(/,/g, '').trim();
  const queryParts = cleanQuery.split(/\s+/).filter(Boolean);

  const matched = allSwimmers.filter(swimmer => {
    const rawName = swimmer.name.toLowerCase();
    const cleanRaw = rawName.replace(/,/g, '');
    const displayFormat = formatNameForDisplay(swimmer.name).toLowerCase();
    const team = (swimmer.team || '').toLowerCase();

    return queryParts.every(part => 
      cleanRaw.includes(part) || 
      displayFormat.includes(part) || 
      team.includes(part)
    );
  });

  if (matched.length === 0) {
    dropdown.innerHTML = `
      <div class="p-6 text-center text-slate-500">
        <p class="font-medium text-slate-700">No swimmers found matching "${query}"</p>
        <p class="text-xs text-slate-400 mt-1">Try searching by first name, last name, or school (e.g. Charlie, Kim, Dominguez, DAA).</p>
      </div>
    `;
    dropdown.classList.remove('hidden');
    return;
  }

  let html = `<div class="p-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">Swimmers Found (${matched.length})</div>`;
  html += '<div class="max-h-80 overflow-y-auto divide-y divide-slate-100">';

  matched.slice(0, 15).forEach(swimmer => {
    const eventCount = swimmer.events.length;
    const isFav = favoriteSwimmers.includes(swimmer.name);
    html += `
      <div onclick="selectSwimmer('${escapeHtml(swimmer.name)}')" 
           class="flex items-center justify-between p-3.5 hover:bg-sky-50 cursor-pointer transition-colors group">
        <div>
          <div class="font-semibold text-slate-900 group-hover:text-sky-700 flex items-center gap-1.5">
            <span>${highlightMatch(swimmer.name, queryParts)}</span>
            ${isFav ? '<span class="text-amber-500 text-xs">★</span>' : ''}
          </div>
          <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span class="inline-block bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">${swimmer.team}</span>
            <span>Age: ${swimmer.age || '-'}</span>
          </div>
        </div>
        <div class="text-right">
          <span class="inline-flex items-center text-xs font-medium bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full">
            ${eventCount} Event${eventCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    `;
  });

  html += '</div>';
  dropdown.innerHTML = html;
  dropdown.classList.remove('hidden');
}

// Show Quick Swimmers when search input is empty & focused
function showQuickSwimmers() {
  const dropdown = document.getElementById('searchResultsDropdown');
  let html = `
    <div class="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
      <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Swimmer Select</span>
      <span class="text-xs text-slate-400">${allSwimmers.length} Athletes</span>
    </div>
    <div class="p-3 max-h-72 overflow-y-auto">
      <div class="text-xs text-slate-500 mb-2">Click any swimmer below to immediately view their heats & matchups:</div>
      <div class="flex flex-wrap gap-1.5">
  `;

  allSwimmers.slice(0, 24).forEach(s => {
    html += `
      <button onclick="selectSwimmer('${escapeHtml(s.name)}')" 
              class="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-sky-500 hover:text-sky-600 hover:bg-sky-50 transition-all">
        ${s.name}
      </button>
    `;
  });

  html += `
      </div>
    </div>
  `;
  dropdown.innerHTML = html;
  dropdown.classList.remove('hidden');
}

// Select Swimmer and Display Results
function selectSwimmer(swimmerName) {
  const swimmer = allSwimmers.find(s => s.name === swimmerName);
  if (!swimmer) return;

  currentActiveSwimmer = swimmer;

  // Close dropdown and set search input value
  document.getElementById('searchResultsDropdown').classList.add('hidden');
  document.getElementById('swimmerSearchInput').value = swimmer.name;
  document.getElementById('clearSearchBtn').classList.remove('hidden');

  // Update URL without reload
  const newUrl = new URL(window.location);
  newUrl.searchParams.set('swimmer', swimmer.name);
  window.history.pushState({}, '', newUrl);

  // Render Swimmer Details
  renderSwimmerProfile(swimmer);
}

// Render Swimmer Profile & Events (Requirements 1 & 2)
function renderSwimmerProfile(swimmer) {
  const container = document.getElementById('swimmerDetailContainer');
  const emptyState = document.getElementById('searchEmptyState');
  emptyState.classList.add('hidden');
  container.classList.remove('hidden');

  const isFav = favoriteSwimmers.includes(swimmer.name);

  // Sort events chronologically (by eventId and heat)
  const sortedEvents = [...swimmer.events].sort((a, b) => a.eventId - b.eventId);

  let html = `
    <!-- Swimmer Header Profile Card -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-6 relative overflow-hidden animate-fade-in">
      <div class="absolute top-0 right-0 w-36 h-36 bg-sky-100 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">${swimmer.name}</h2>
            <button onclick="toggleFavorite('${escapeHtml(swimmer.name)}')" 
                    class="p-2 rounded-xl border border-slate-200 hover:bg-amber-50 text-lg transition-colors ${isFav ? 'text-amber-500 bg-amber-50 border-amber-200' : 'text-slate-300'}"
                    title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
              ★
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2 mt-2">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
              🏫 ${swimmer.team}
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              Age: ${swimmer.age || '-'}
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              🏊 ${swimmer.events.length} Event${swimmer.events.length > 1 ? 's' : ''} Entered
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 no-print">
          <button onclick="copyShareLink('${escapeHtml(swimmer.name)}')" 
                  class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
            🔗 Copy Share Link
          </button>
          <button onclick="window.print()" 
                  class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
            🖨️ Print
          </button>
        </div>
      </div>
    </div>

    <!-- Section Title -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Events Schedule & Heat Matchups</h3>
        <p class="text-xs text-slate-500">Scheduled start times, heat and lane assignments, and full competitor matchups.</p>
      </div>
      <span class="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg">
        ${sortedEvents.length} Event${sortedEvents.length > 1 ? 's' : ''}
      </span>
    </div>

    <!-- Event Cards Container -->
    <div class="space-y-6">
  `;

  // Render Each Event
  sortedEvents.forEach((ev, idx) => {
    html += renderEventCard(ev, swimmer.name, idx + 1);
  });

  html += '</div>';
  container.innerHTML = html;
}

// Render Individual Event Card with Matchup Table and Visual Pool
function renderEventCard(ev, targetSwimmerName, index) {
  const isMorning = ev.session.includes('Morning');

  return `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <!-- Card Header: Requirement 1 Highlight -->
      <div class="p-5 sm:p-6 bg-gradient-to-r ${isMorning ? 'from-amber-500/5 via-sky-500/5 to-transparent' : 'from-indigo-500/5 via-purple-500/5 to-transparent'} border-b border-slate-100">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded text-xs font-bold ${isMorning ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}">
                ${ev.session}
              </span>
              <span class="text-xs font-semibold text-slate-500">Race #${index}</span>
            </div>
            <h4 class="text-lg sm:text-xl font-bold text-slate-900">
              Event ${ev.eventId}: ${ev.eventName}
            </h4>
          </div>

          <!-- Highlighted Schedule Badges (Requirement 1) -->
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div class="bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-center min-w-[95px]">
              <div class="text-[10px] uppercase font-bold text-sky-600">Start Time</div>
              <div class="text-sm font-extrabold text-sky-900">${ev.startTime}</div>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center min-w-[85px]">
              <div class="text-[10px] uppercase font-bold text-amber-600">Heat</div>
              <div class="text-sm font-extrabold text-amber-900">${ev.heatNumber} of ${ev.totalHeats}</div>
            </div>
            <div class="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center min-w-[75px]">
              <div class="text-[10px] uppercase font-bold text-emerald-600">Lane</div>
              <div class="text-sm font-extrabold text-emerald-900">Lane ${ev.lane}</div>
            </div>
            <div class="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center min-w-[85px]">
              <div class="text-[10px] uppercase font-bold text-slate-500">Seed Time</div>
              <div class="text-sm font-bold text-slate-800">${ev.seedTime}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card Body: Matchup & Competitors (Requirement 2) -->
      <div class="p-5 sm:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-slate-800">🏁 Heat ${ev.heatNumber} Matchup (${ev.heatEntries.length} Swimmers)</span>
          </div>
          <div class="text-xs text-slate-400">
            * Click any competitor to switch to their full meet schedule.
          </div>
        </div>

        <!-- Visual Pool Lanes -->
        <div class="pool-container mb-4">
          <div class="text-xs font-semibold tracking-wider text-sky-200 mb-2 flex justify-between items-center">
            <span>🏊 Pool Lane Assignments (Lanes 1 - 8)</span>
            <span>Starts at ${ev.startTime}</span>
          </div>
          <div class="space-y-1.5">
            ${renderPoolLanes(ev.heatEntries, targetSwimmerName)}
          </div>
        </div>

        <!-- Detailed Matchup Table -->
        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-3 w-16 text-center">Lane</th>
                <th class="py-2.5 px-4">Swimmer Name</th>
                <th class="py-2.5 px-3 w-16 text-center">Age</th>
                <th class="py-2.5 px-4">Team</th>
                <th class="py-2.5 px-4 text-right">Seed Time</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${renderMatchupTableRows(ev.heatEntries, targetSwimmerName)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// Render Visual Pool Lanes
function renderPoolLanes(entries, targetSwimmerName) {
  const sorted = [...entries].sort((a, b) => a.lane - b.lane);
  const laneMap = new Map();
  sorted.forEach(e => laneMap.set(e.lane, e));

  let html = '';
  for (let l = 1; l <= 8; l++) {
    const entry = laneMap.get(l);
    if (!entry) {
      html += `
        <div class="lane-row opacity-40">
          <div class="lane-badge lane-badge-default">${l}</div>
          <div class="text-xs italic text-slate-300">Empty Lane</div>
        </div>
      `;
    } else {
      const isTarget = entry.name.toLowerCase() === targetSwimmerName.toLowerCase();
      html += `
        <div class="lane-row ${isTarget ? 'current-swimmer' : ''} cursor-pointer" onclick="selectSwimmer('${escapeHtml(entry.name)}')">
          <div class="lane-badge ${isTarget ? 'lane-badge-active' : 'lane-badge-default'}">${entry.lane}</div>
          <div class="flex-1 flex items-center justify-between gap-2 overflow-hidden">
            <div class="flex items-center gap-2 truncate">
              <span class="font-bold truncate ${isTarget ? 'text-sky-900' : 'text-white'}">${entry.name}</span>
              ${isTarget ? '<span class="text-[10px] bg-sky-600 text-white font-extrabold px-1.5 py-0.5 rounded-full">YOU</span>' : ''}
            </div>
            <div class="flex items-center gap-3 text-xs flex-shrink-0 ${isTarget ? 'text-slate-600' : 'text-sky-100'}">
              <span class="hidden sm:inline">${entry.team}</span>
              <span class="font-mono font-bold">${entry.seedTime}</span>
            </div>
          </div>
        </div>
      `;
    }
  }
  return html;
}

// Render Matchup Table Rows
function renderMatchupTableRows(entries, targetSwimmerName) {
  const sorted = [...entries].sort((a, b) => a.lane - b.lane);

  return sorted.map(e => {
    const isTarget = e.name.toLowerCase() === targetSwimmerName.toLowerCase();
    return `
      <tr class="${isTarget ? 'bg-sky-50/80 font-bold border-l-4 border-l-sky-500' : 'hover:bg-slate-50'} transition-colors cursor-pointer" 
          onclick="selectSwimmer('${escapeHtml(e.name)}')">
        <td class="py-2.5 px-3 text-center">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isTarget ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'}">
            ${e.lane}
          </span>
        </td>
        <td class="py-2.5 px-4">
          <div class="flex items-center gap-2">
            <span class="${isTarget ? 'text-sky-900 underline decoration-sky-400 font-extrabold' : 'text-slate-800'}">
              ${e.name}
            </span>
            ${isTarget ? '<span class="text-[10px] bg-sky-500 text-white font-bold px-1.5 py-0.2 rounded">YOU</span>' : ''}
          </div>
        </td>
        <td class="py-2.5 px-3 text-center text-slate-600">${e.age || '-'}</td>
        <td class="py-2.5 px-4 text-slate-600 text-xs">${e.team}</td>
        <td class="py-2.5 px-4 text-right font-mono font-semibold ${isTarget ? 'text-sky-700' : 'text-slate-800'}">
          ${e.seedTime}
        </td>
      </tr>
    `;
  }).join('');
}

// Populate Event Filter in Full Program Tab
function populateProgramEventFilter() {
  const select = document.getElementById('programEventFilter');
  if (!select || select.children.length > 1) return;

  MEET_DATA.forEach(ev => {
    const opt = document.createElement('option');
    opt.value = ev.eventId;
    opt.textContent = `Event ${ev.eventId}: ${ev.name}`;
    select.appendChild(opt);
  });
}

// Render Full Meet Program (Requirement 4)
function renderFullProgram() {
  const container = document.getElementById('programListContainer');
  const sessionVal = document.getElementById('programSessionFilter')?.value || 'all';
  const eventVal = document.getElementById('programEventFilter')?.value || 'all';

  let filteredEvents = MEET_DATA;

  if (sessionVal !== 'all') {
    filteredEvents = filteredEvents.filter(ev => ev.session.toLowerCase().includes(sessionVal.toLowerCase()));
  }

  if (eventVal !== 'all') {
    filteredEvents = filteredEvents.filter(ev => ev.eventId === parseInt(eventVal));
  }

  if (filteredEvents.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        No events match the selected criteria.
      </div>
    `;
    return;
  }

  let html = '';

  filteredEvents.forEach(ev => {
    html += `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-fade-in print-break">
        <!-- Event Header -->
        <div class="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div class="text-xs uppercase tracking-wider text-sky-400 font-bold mb-0.5">
              ${ev.session} • ${ev.ageGroup}
            </div>
            <h3 class="text-lg sm:text-xl font-bold">
              Event ${ev.eventId} &nbsp; ${ev.name}
            </h3>
          </div>
          <div class="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300">
            ${ev.heats.length} Heat${ev.heats.length > 1 ? 's' : ''} Total
          </div>
        </div>

        <!-- Heats Container -->
        <div class="p-4 sm:p-6 space-y-6">
    `;

    ev.heats.forEach(heat => {
      html += `
        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <!-- Heat Title Bar (Like HY-TEK style) -->
          <div class="bg-slate-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 font-mono text-xs sm:text-sm font-bold text-slate-800">
            <div class="flex items-center gap-2">
              <span class="bg-sky-600 text-white px-2 py-0.5 rounded text-xs">Heat ${heat.heatNumber} of ${heat.totalHeats}</span>
              <span>${heat.type}</span>
            </div>
            <div class="text-sky-700 font-sans font-bold flex items-center gap-1">
              ⏰ Starts at ${heat.startTime}
            </div>
          </div>

          <!-- Heat Entries Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th class="py-2 px-3 w-12 text-center">Lane</th>
                  <th class="py-2 px-3">Name</th>
                  <th class="py-2 px-2 w-12 text-center">Age</th>
                  <th class="py-2 px-3">Team</th>
                  <th class="py-2 px-3 text-right">Seed Time</th>
                  <th class="py-2 px-3 w-20 text-center no-print">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-mono">
      `;

      heat.entries.sort((a, b) => a.lane - b.lane).forEach(entry => {
        html += `
          <tr class="hover:bg-sky-50/60 transition-colors">
            <td class="py-2 px-3 text-center font-bold text-slate-700">${entry.lane}</td>
            <td class="py-2 px-3 font-sans font-semibold text-slate-900 cursor-pointer hover:text-sky-600" 
                onclick="quickViewSwimmer('${escapeHtml(entry.name)}')">
              ${entry.name}
            </td>
            <td class="py-2 px-2 text-center text-slate-600 font-sans">${entry.age || '-'}</td>
            <td class="py-2 px-3 text-slate-600 font-sans text-xs">${entry.team}</td>
            <td class="py-2 px-3 text-right font-bold text-slate-800">${entry.seedTime}</td>
            <td class="py-2 px-3 text-center no-print font-sans">
              <button onclick="quickViewSwimmer('${escapeHtml(entry.name)}')" 
                      class="px-2.5 py-1 text-[11px] font-semibold bg-sky-100 text-sky-700 hover:bg-sky-200 rounded transition-colors">
                View
              </button>
            </td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Quick View Swimmer from table
function quickViewSwimmer(swimmerName) {
  switchTab('search');
  selectSwimmer(swimmerName);
}

// Render Teams Tab
function renderTeams() {
  const container = document.getElementById('teamsListContainer');
  let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';

  allTeams.forEach(teamName => {
    const teamSwimmers = allSwimmers.filter(s => s.team === teamName);
    html += `
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-fade-in">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h4 class="font-bold text-lg text-slate-900">${teamName}</h4>
            <p class="text-xs text-slate-500">${teamSwimmers.length} Athletes</p>
          </div>
          <span class="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm">
            ${teamName.substring(0, 2).toUpperCase()}
          </span>
        </div>
        <div class="max-h-60 overflow-y-auto space-y-1.5 pr-1">
    `;

    teamSwimmers.forEach(s => {
      html += `
        <div onclick="quickViewSwimmer('${escapeHtml(s.name)}')" 
             class="flex items-center justify-between p-2 rounded-lg hover:bg-sky-50 cursor-pointer transition-colors text-sm">
          <span class="font-medium text-slate-800">${s.name}</span>
          <span class="text-xs text-sky-600 font-semibold bg-sky-50 px-2 py-0.5 rounded-full">${s.events.length} Event${s.events.length > 1 ? 's' : ''}</span>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

// Render Favorites Tab
function renderFavorites() {
  const container = document.getElementById('favoritesListContainer');
  if (favoriteSwimmers.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <div class="text-4xl mb-3">⭐</div>
        <h4 class="text-lg font-bold text-slate-800 mb-1">No Starred Swimmers Yet</h4>
        <p class="text-xs text-slate-500 mb-4">Search for a swimmer and click the star (★) to bookmark them here for fast access.</p>
        <button onclick="switchTab('search')" class="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition-colors">
          Search Swimmers
        </button>
      </div>
    `;
    return;
  }

  let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
  favoriteSwimmers.forEach(name => {
    const s = allSwimmers.find(sw => sw.name === name);
    if (!s) return;

    html += `
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-sky-400 transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2">
            <h4 class="font-bold text-slate-900">${s.name}</h4>
            <button onclick="toggleFavorite('${escapeHtml(s.name)}'); renderFavorites();" class="text-amber-500 hover:opacity-75">★</button>
          </div>
          <div class="text-xs text-slate-500 mt-1">${s.team} (Age: ${s.age || '-'})</div>
          <div class="mt-3 text-xs bg-slate-50 rounded-lg p-2.5 space-y-1">
            <div class="font-semibold text-slate-700">Events Summary (${s.events.length}):</div>
            ${s.events.slice(0, 3).map(e => `
              <div class="truncate text-slate-600">• Event ${e.eventId} (${e.startTime}, Lane ${e.lane})</div>
            `).join('')}
            ${s.events.length > 3 ? `<div class="text-sky-600 font-semibold">+ ${s.events.length - 3} more event(s)</div>` : ''}
          </div>
        </div>
        <button onclick="quickViewSwimmer('${escapeHtml(s.name)}')" 
                class="mt-4 w-full py-2 bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white rounded-xl text-xs font-bold transition-all text-center">
          View Heat Schedule & Matchups
        </button>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

// Toggle Favorite Swimmer
function toggleFavorite(name) {
  const index = favoriteSwimmers.indexOf(name);
  if (index > -1) {
    favoriteSwimmers.splice(index, 1);
    showToast(`'${name}' removed from favorites.`);
  } else {
    favoriteSwimmers.push(name);
    showToast(`'${name}' added to favorites!`);
  }
  localStorage.setItem('eac_favorites', JSON.stringify(favoriteSwimmers));
  updateFavoritesCount();

  if (currentActiveSwimmer && currentActiveSwimmer.name === name) {
    renderSwimmerProfile(currentActiveSwimmer);
  }
}

// Update Favorites badge count
function updateFavoritesCount() {
  const badge = document.getElementById('favCountBadge');
  if (badge) {
    badge.textContent = favoriteSwimmers.length;
    if (favoriteSwimmers.length > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

// Copy Shareable URL Link
function copyShareLink(swimmerName) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('swimmer', swimmerName);
  
  navigator.clipboard.writeText(url.toString()).then(() => {
    showToast(`Direct link for '${swimmerName}' copied to clipboard!`);
  }).catch(() => {
    prompt('Copy this link:', url.toString());
  });
}

// Toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.remove('opacity-0');
  toast.classList.remove('translate-y-4');

  setTimeout(() => {
    toast.classList.add('opacity-0');
    toast.classList.add('translate-y-4');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2500);
}

// Helpers
function formatNameForDisplay(name) {
  if (name.includes(',')) {
    const parts = name.split(',');
    return `${parts[1].trim()} ${parts[0].trim()}`;
  }
  return name;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function highlightMatch(text, terms) {
  let result = text;
  terms.forEach(term => {
    if (!term) return;
    const regex = new RegExp(`(${term})`, 'gi');
    result = result.replace(regex, '<mark class="bg-amber-200 text-slate-900 rounded px-0.5">$1</mark>');
  });
  return result;
}
