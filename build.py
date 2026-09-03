import re

with open('/tmp/qqq-greeks-logger/market-dash/dashboard.html', 'r') as f:
    dash = f.read()

with open('/home/claude/blank-updated.txt', 'r') as f:
    shell = f.read()

with open('/home/claude/gap_widgets.js', 'r') as f:
    gap_widgets_js = f.read()

# Extract pieces
dash_css_match = re.search(r'<style>(.*?)</style>', dash, re.DOTALL)
dash_css = dash_css_match.group(1).strip() if dash_css_match else ''

shell_css_match = re.search(r'<style>(.*?)</style>', shell, re.DOTALL)
shell_css = shell_css_match.group(1).strip() if shell_css_match else ''

shell_js_match = re.search(r'<script>(.*?)</script>', shell, re.DOTALL)
shell_js = shell_js_match.group(1).strip() if shell_js_match else ''

# Extract the dashboard IIFE body (between "use strict" and the final })(); )
iife_start = dash.find('"use strict"')
iife_end = dash.rfind('})();')
dash_js_raw = dash[iife_start:iife_end].strip() if iife_start > 0 else ''

# Remove "use strict"; from the start
dash_js_raw = dash_js_raw.replace('"use strict";', '', 1).strip()

# We need to modify the dashboard JS:
# 1. Remove the HTML rendering parts (render(), the event listeners, tab switching)
#    since the workspace shell handles that
# 2. Keep all utility functions, widget render functions, data structures
# 3. Keep startLivePrices() but modify it

# The dashboard render() function and event listeners start around line 5626
# Let's find and remove them, keeping only the widget functions and data layer

# Find key markers
# The last widget function before render setup
# We want everything UP TO the render() function definition,
# plus startLivePrices() without the DOM painting parts

# Actually, let's keep ALL the JS code and just wrap the render/event code
# in a flag check. The widget functions need the globals (H, FULL, etc.)

# Strategy: Extract everything and wrap in a namespace
# The workspace shell will call individual widget functions

# Convert shell's let/const to var to avoid TDZ issues with the IIFE running first
shell_js_modified = re.sub(r'\b(let|const)\s+', 'var ', shell_js)

# Rename references
shell_js_modified = shell_js_modified.replace("var STORAGE_KEY = 'blank-workspace'",
                                      "var STORAGE_KEY = 'gshinrje-workspace'")
shell_js_modified = shell_js_modified.replace("'Blank'", "'གཤིན་རྗེ'")
shell_js_modified = shell_js_modified.replace('"Blank"', '"གཤིན་རྗེ"')

# Also fix the title reference in renderTabs
shell_js_modified = shell_js_modified.replace("Blank</div>", "གཤིན་རྗེ</div>")
shell_js_modified = shell_js_modified.replace(">Blank<", ">གཤིན་རྗེ<")

# Modify shell CSS to scope dashboard styles
# The dashboard CSS uses :root vars that would conflict with the shell's vars
# Solution: put dashboard content CSS inside a .widget-body scope

# Dashboard CSS cleanup - remove body/html/layout styles, keep component styles
# We want: table styles, .up/.down/.flat, .row, .na, .read, .cat, .hi, etc.
# But NOT: body, header h1, .wrap, .grid, .band, header, select, .regime, etc.

# Let's scope the dashboard CSS under .dash-content
# First, remove layout-level rules
layout_rules = [
    r'body\s*\{[^}]+\}',
    r'\*\s*\{[^}]+\}', 
    r'\.scan\{[^}]+\}',
    r'\.wrap\s*\{[^}]+\}',
    r'header\s*\{[^}]+\}',
    r'h1\s*\{[^}]+\}',
    r'\.stamp\s*\{[^}]+\}',
    r'select\s*\{[^}]+\}',
    r'\.grid\s*\{[^}]+\}',
    r'\.grid > section\.wide\s*\{[^}]+\}',
    r'\.band\s*\{[^}]+\}',
    r'\.band span\s*\{[^}]+\}',
    r'\.band i\s*\{[^}]+\}',
    r'section\s*\{[^}]+\}',
    r'section h2\s*\{[^}]+\}',
    r'section\.wide\s*\{[^}]+\}',
    r'footer\s*\{[^}]+\}',
]

# Actually this is getting complex. Let me take a simpler approach:
# Keep ALL dashboard CSS but prefix widget-content-specific vars
# The shell uses --bg-widget, --text-primary etc.
# The dashboard uses --bg, --txt, --dim, --faint etc.
# I'll add the dashboard vars scoped to .widget-body

# Build the dashboard content CSS variables (scoped to widget body)
dash_vars = """
/* Dashboard content variables (scoped to widget bodies) — Yama palette */
.widget-body {
  --bg:#050000; --panel:#0d0305; --line:#2a0a0f;
  --txt:#e8d8d8; --dim:#8b3a3a; --faint:#4a1a1f;
  --up:#00e5cc; --down:#cc1111; --flat:#8b3a3a;
  --accent:#00e5cc; --warn:#cc1111;
  --purple:#8b3a3a; --magenta:#cc1111; --orange:#cc1111; --teal:#00e5cc;
  font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--txt);
  align-items: flex-start;
  justify-content: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
}
"""

# Content-level CSS from dashboard (tables, rows, etc.)
dash_content_css = """
/* Dashboard content styles */
.widget-body .row { display:flex; justify-content:space-between; gap:12px; padding:4px 0; font-size:13px; }
.widget-body .row .k { color:var(--dim); }
.widget-body .row .v { text-align:right; }
.widget-body .na { color:var(--faint); font-style:italic; }
.widget-body .up { color:var(--up); }
.widget-body .down { color:var(--down); }
.widget-body .flat { color:var(--flat); }
.widget-body .read { margin-top:12px; padding-top:10px; border-top:1px dashed var(--line); font-size:12.5px; color:var(--txt); }
.widget-body .read b { color:var(--dim); font-weight:400; letter-spacing:1px; font-size:10.5px; text-transform:uppercase; }
.widget-body details > summary { cursor:pointer; list-style:none; user-select:none; display:flex; align-items:center; gap:7px; }
.widget-body details > summary::-webkit-details-marker { display:none; }
.widget-body details > summary::before { content:"\\25BE"; color:var(--faint); font-size:10px; transition:transform .12s; flex:none; }
.widget-body details:not([open]) > summary::before { transform:rotate(-90deg); }
.widget-body table { width:100%; border-collapse:collapse; font-size:12px; }
.widget-body th { text-align:left; color:var(--dim); font-weight:400; font-size:10px; text-transform:uppercase; letter-spacing:1px; padding-bottom:6px; }
.widget-body td { padding:3px 0; }
.widget-body td.num { text-align:right; }
.widget-body .cat { padding:5px 0; border-bottom:1px solid var(--line); font-size:12px; }
.widget-body .cat:last-child { border-bottom:0; }
.widget-body .cat .when { color:var(--dim); font-size:11px; }
.widget-body .cat .fc { color:var(--dim); font-size:11px; }
.widget-body .hi { border-left:2px solid var(--warn); padding-left:8px; }
.widget-body .err { color:var(--down); font-size:12px; padding:8px 0; }
.widget-body table.wl tr:not(:first-child):hover { background:rgba(0,229,204,.05); }
.widget-body .smhide { }
.widget-body h2 { font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--dim); margin:0 0 12px; font-weight:600; }
.widget-body .regime { background:rgba(140,20,20,0.06); border:1px solid var(--line); border-left:3px solid var(--accent); border-radius:8px; padding:14px 16px; margin-bottom:12px; }
.widget-body .regime .label { color:var(--dim); font-size:11px; letter-spacing:1.5px; text-transform:uppercase; }
.widget-body .regime .call { font-size:19px; margin-top:6px; letter-spacing:1px; text-shadow:0 0 14px currentColor; }
.widget-body .regime .why { color:var(--dim); font-size:12px; margin-top:8px; }
.widget-body svg { max-width:100%; height:auto; }
.widget-body .slice:hover { opacity:0.85; filter:brightness(1.2); }
/* Live badge */
#livebadge { position:fixed; right:12px; bottom:12px; z-index:9999;
  font:11px ui-monospace,Menlo,monospace; padding:5px 9px; border-radius:14px;
  background:rgba(0,0,0,.72); border:1px solid var(--border); color:rgba(200,160,160,0.6);
  -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px); pointer-events:none; }
/* Data loading state */
.widget-body .loading { text-align:center; padding:20px; color:rgba(140,40,40,0.3); font-size:12px; }
"""

# Now build the JS that bridges the shell and dashboard code
# The shell's renderCanvas needs to call renderWidgetContent() for each widget
# The dashboard functions return HTML strings


# Read the embedded history data
with open('/tmp/history_data.js') as f:
    history_data_js = f.read()

bridge_js = """
// ═══════════════════════════════════════════════
// གཤིན་རྗེ — EARLY INIT (before IIFE)
// ═══════════════════════════════════════════════
var GRID = 20;
var STORAGE_KEY = 'gshinrje-workspace';
var state;
try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch(e) {}
if (!state || !state.layouts) {
  var _initLay = { id: 'L' + Date.now(), name: 'Layout 1', widgets: [] };
  state = { layouts: [_initLay], activeLayoutId: _initLay.id };
}
function activeLayout() {
  return state.layouts.find(function(l) { return l.id === state.activeLayoutId; }) || state.layouts[0];
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
}

// ═══════════════════════════════════════════════
// གཤིན་རྗེ — DATA LAYER
// ═══════════════════════════════════════════════

// Dashboard data globals
var H = [];           // all history entries
var FULL = [];        // non-partial entries
var DATA_LOADED = false;
var DATA_ERROR = null;
var LIVE = {};        // symbol -> {last, pct, srcTime}

// History data embedded inline (artifact CSP blocks fetch)
""" + history_data_js + """

// Load history data from embedded array
function loadHistoryData() {
  try {
    H = HISTORY_DATA || [];

    if (!H.length) {
      DATA_ERROR = 'History data is empty';
      renderAllWidgets();
      return;
    }

    // Sort entries
    function sortKey(x) {
      return String(x.entry_date || '') + '_' +
        (String(x.session || 'am').toLowerCase() === 'pm' ? '1' : '0');
    }
    H.sort(function(a, b) { return sortKey(a).localeCompare(sortKey(b)); });

    FULL = H.filter(function(x) { return !x.partial; });
    if (!FULL.length) FULL = H.slice();

    DATA_LOADED = true;
    DATA_ERROR = null;
    renderAllWidgets();
    // Note: startLivePrices() also blocked by artifact CSP (no WebSocket/fetch)
    // Live prices won't work in artifact mode - data is snapshot only
  } catch(err) {
    DATA_ERROR = 'Could not load history: ' + err;
    renderAllWidgets();
  }
}

function currentEntry() {
  return FULL.length ? FULL[FULL.length - 1] : null;
}

// Re-render all widget bodies with current data
function renderAllWidgets() {
  var lay = activeLayout();
  lay.widgets.forEach(function(w) {
    var el = document.querySelector('.widget[data-wid="' + w.id + '"] .widget-body');
    if (el) {
      el.innerHTML = renderWidgetContent(w.definitionId);
    }
  });
}

"""

# The widget content dispatcher maps widget IDs to render functions
dispatcher_js = """
// ═══════════════════════════════════════════════
// WIDGET CONTENT DISPATCHER
// ═══════════════════════════════════════════════

function renderWidgetContent(defId) {
  if (DATA_ERROR) {
    return '<div class="loading">' + esc(DATA_ERROR) + '</div>';
  }
  if (!DATA_LOADED) {
    return '<div class="loading">Loading data...</div>';
  }
  
  var e = currentEntry();
  if (!e) return '<div class="loading">No data available</div>';
  
  // Strip sec() wrapper and move READ sections to bottom
  function stripSec(html) {
    if (!html) return '<div class="loading">No data for this widget</div>';
    var s = html;
    s = s.replace(/^<section[^>]*>/, '');
    s = s.replace(/<\\/section>$/, '');
    // Move .read sections to bottom — they use <details class="read">
    var reads = [];
    s = s.replace(/<details class="read"[^>]*>[\\s\\S]*?<\\/details>/g, function(m) {
      reads.push(m);
      return '';
    });
    if (reads.length) {
      // Collapse them by default (remove 'open' attr) and group at bottom
      var collapsed = reads.map(function(r) {
        return r.replace('<details class="read" open>', '<details class="read">');
      }).join('');
      s += collapsed;
    }
    return s;
  }
  
  var align;
  
  switch(defId) {
    case 'macro-pressure':       return stripSec(secMacro(e));
    case 'next-catalyst':        return stripSec(secHeadlines(e));
    case 'buyer-seller-pressure':return stripSec(secPositioning(e));
    case 'stretch-exhaustion':   return moveWheel(e.watchlist || []) || '<div class="loading">No watchlist data</div>';
    case 'contract-concentration':
      var tf = e.time_footprint;
      var bars = secTimeFootprint(tf);
      var grid = secOptHeatmap(tf);
      return (grid || bars) || '<div class="loading">No time footprint data</div>';
    case 'breadth':              return stripSec(secInternals(e));
    case 'put-call-structure':   return stripSec(secOptions(e));
    case 'volume-pace':          return stripSec(secVenue(e));
    case 'cross-asset':          return stripSec(secStars(e));
    case 'watchlist':            return stripSec(secWatchlist(e));
    case 'economic-calendar':    return stripSec(secWeek(e));
    case 'bull-bear-neutral':
      align = secAlignment(e);
      return stripSec(finalRegime(e, align));
    case 'gex-profile':          return stripSec(secGex(e));
    case 'historical-percentile':return stripSec(secGeometry(e));
    case 'volatility-regime':    return stripSec(secQuant(e));
    case 'market-story':
      align = secAlignment(e);
      return stripSec(finalRegime(e, align));
    case 'range-position':       return stripSec(secTouchFlow(e));
    case 'momentum-state':       return stripSec(secFadeRegime(e));
    case 'range-used':           return stripSec(secRangeUsed(e));
    case 'thesis-builder':       return stripSec(secPlan(e));
    case 'gamma-regime':         return stripSec(secVanna(e));
    case 'evidence-board':       return stripSec(secSynthesis(e));
    case 'opportunity-map':      return stripSec(secCockpit(e));
    case 'sector-rotation':      return stripSec(secInternals(e));
    case 'risk-map':
      align = secAlignment(e);
      return stripSec(finalRegime(e, align));
    case 'relative-strength':    return starChart(e) + starCorrel(e);
    case 'rv-iv':                return stripSec(secQuant(e));
    case 'expected-range':       return stripSec(secQuant(e));
    case 'mtf-alignment':        return stripSec(typeof secNasdaqCommandCenter === 'function' ? secNasdaqCommandCenter(e) : '');
    case 'market-structure':     return renderMarketStructure(e);
    case 'acceptance-rejection': return renderAcceptanceRejection(e);
    case 'support-resistance':   return renderSupportResistance(e);
    case 'volume-profile':       return renderVolumeProfile(e);
    case 'tape-behavior':        return renderTapeBehavior(e);
    case 'implied-distribution': return renderImpliedDistribution(e);
    case 'similar-sessions':     return renderSimilarSessions(e);
    case 'regime-history':       return renderRegimeHistory(e);
    case 'observation-notes':    return renderObservationNotes(e);
    case 'trade-journal':        return renderTradeJournal(e);
    case 'process-scorecard':    return renderProcessScorecard(e);
    case 'alerts':               return renderAlerts(e);
    case 'clock-session':        return renderClockWidget();
    case 'notes':                return renderNotes(e);
    case 'gex-chart':            return renderGexChart(e);
    case 'earnings-events':      return stripSec(secWeek(e));
    default:
      return '<div class="loading">Widget: ' + esc(defId) + '</div>';
  }
}

// Simple clock widget
function renderClockWidget() {
  var now = new Date();
  var pt = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  var et = now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  var h = now.getHours();
  // Market session (ET)
  var etH = parseInt(now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }));
  var session = etH < 4 ? 'OVERNIGHT' : etH < 9.5 ? 'PRE-MARKET' : etH < 16 ? 'REGULAR' : etH < 20 ? 'AFTER-HOURS' : 'OVERNIGHT';
  var sessionCol = session === 'REGULAR' ? 'var(--up)' : session === 'OVERNIGHT' ? 'var(--faint)' : 'var(--warn)';
  return '<div style="text-align:center;padding:8px">' +
    '<div style="font-size:24px;color:var(--txt);letter-spacing:1px">' + pt + '</div>' +
    '<div style="font-size:10px;color:var(--dim);margin-top:2px">Pacific</div>' +
    '<div style="font-size:14px;color:var(--dim);margin-top:8px">' + et + ' ET</div>' +
    '<div style="margin-top:12px;font-size:11px;letter-spacing:2px;color:' + sessionCol + '">' + session + '</div></div>';
}
"""

# Modify the shell's renderCanvas to call renderWidgetContent
# Find the placeholder rendering in renderCanvas and replace it
old_body = '''html += `<div class="widget-body"><div class="placeholder"><div class="name">${esc(name)}</div><div class="question">${esc(question)}</div></div></div>`;'''

new_body = '''html += `<div class="widget-body">${renderWidgetContent(w.definitionId)}</div>`;'''

shell_js_modified = shell_js_modified.replace(old_body, new_body)

# Add data loading to init
old_init = '// ── Init ──\nrender();'
new_init = '''// ── Init ──
render();
loadHistoryData();

// Refresh clock widgets every second
setInterval(function() {
  document.querySelectorAll('.widget').forEach(function(el) {
    var wid = el.dataset.wid;
    var lay = activeLayout();
    var w = lay.widgets.find(function(w) { return w.id === wid; });
    if (w && w.definitionId === 'clock-session') {
      var body = el.querySelector('.widget-body');
      if (body) body.innerHTML = renderWidgetContent('clock-session');
    }
  });
}, 1000);'''

shell_js_modified = shell_js_modified.replace(old_init, new_init)

# Now we need to extract dashboard functions but adapt them
# The dashboard uses TAB variable — we'll set it to something neutral
# since each widget renders independently
# Also need to handle the sec() wrapper function

# For the dashboard JS, we need to:
# 1. Set TAB = "legacy" so pipeline rendering is skipped  
# 2. Keep all utility functions
# 3. Keep all widget render functions
# 4. Modify startLivePrices to work with our widget re-rendering

# The dashboard JS references `app` (document.getElementById('app'))
# and `idx` — we need to handle these

# Pre-modifications to dashboard JS
dash_js_modified = dash_js_raw

# Force legacy rendering (not pipeline v2)
dash_js_modified = 'var TAB = "legacy";\n' + dash_js_modified

# Remove the app reference since we don't use it
dash_js_modified = dash_js_modified.replace(
    'var app = document.getElementById("app");',
    '// var app = document.getElementById("app"); // not used in གཤིན་རྗེ'
)

# The render() function from dashboard would conflict — rename it
dash_js_modified = dash_js_modified.replace(
    'function render() {',
    'function dashboardRender_UNUSED() {'
)

# The startLivePrices needs modification — its cycle() calls render()
# We want it to call renderAllWidgets() instead
dash_js_modified = dash_js_modified.replace(
    'var y = window.scrollY; render(); window.scrollTo(0, y);',
    'renderAllWidgets();'
)

# The tabBar() function would conflict
dash_js_modified = dash_js_modified.replace(
    'function tabBar() {',
    'function dashTabBar_UNUSED() {'
)

# Remove dashboard event listeners that would conflict
# Find and comment out the document.addEventListener blocks at the end
# These are after startLivePrices

# Also remove the final render() and startLivePrices() calls from dashboard
# since our bridge code handles initialization
dash_js_modified = dash_js_modified.replace(
    'render();\n  startLivePrices();',
    '// render() and startLivePrices() called by གཤིན་རྗེ init'
)

# Handle the STAR_FALLBACK that might be missing
if 'STAR_FALLBACK' not in dash_js_modified:
    dash_js_modified = 'var STAR_FALLBACK = {};\n' + dash_js_modified

# Handle QQQ_VIEW_STATE and QQQ_TV references
if 'QQQ_VIEW_STATE' not in dash_js_modified:
    dash_js_modified = 'var QQQ_VIEW_STATE = { userAdjusted: false, logicalRange: null };\nvar QQQ_TV = null;\n' + dash_js_modified

# Remove the "no data yet" guard that overwrites app.innerHTML at IIFE top level
# This block runs immediately and kills the workspace shell before it loads
dash_js_modified = dash_js_modified.replace(
    '// ---------- no data yet ----------\n'
    '  if (window.__histMissing || !H.length) {\n'
    '    app.innerHTML =\n'
    '      \'<header><h1>ༀ</h1></header>\' +\n'
    '      \'<div class="empty">\' +\n'
    '      "<p>No history yet.</p>" +\n'
    '      "<p>Run <code>market_dash_fetch.py</code> once — it creates <code>history.js</code> " +\n'
    '      "next to this file, and this page will fill in.</p>" +\n'
    '      "<p>Once the GitHub Action is live it happens on its own each weekday.</p>" +\n'
    '      "</div>";\n'
    '    return;\n'
    '  }',
    '// ---------- no data yet ---------- (disabled in གཤིན་རྗེ — shell handles rendering)'
)

# Handle missing function refs gracefully — only at CALL SITES, not the definition
dash_js_modified = re.sub(
    r'(?<!function )(?<!function\s)updateMountedQqqQuote\(',
    '(typeof updateMountedQqqQuote === "function" ? updateMountedQqqQuote : function(){})(',
    dash_js_modified
)

# Build the final file
output = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>གཤིན་རྗེ</title>
<style>
''' + shell_css + '''

''' + dash_vars + '''
''' + dash_content_css + '''
</style>
</head>
<body>
<div class="app" id="app">
  <div class="tab-bar" id="tabBar"></div>
  <div class="canvas" id="canvas"></div>
</div>

<script>
// ═══════════════════════════════════════════════
// གཤིན་རྗེ — Lord of Death
// Market Intelligence Workspace
// The asset is the subject. The widget is the lens.
// ═══════════════════════════════════════════════

''' + bridge_js + '''

// ═══════════════════════════════════════════════
// DASHBOARD ENGINE — utilities + widget renderers
// ═══════════════════════════════════════════════
(function() {
  // All dashboard functions are exposed to global scope for widget dispatcher

''' + dash_js_modified + '''

  // Expose needed functions to global scope
  window.secMacro = typeof secMacro !== 'undefined' ? secMacro : function() { return ''; };
  window.secHeadlines = typeof secHeadlines !== 'undefined' ? secHeadlines : function() { return ''; };
  window.secPositioning = typeof secPositioning !== 'undefined' ? secPositioning : function() { return ''; };
  window.moveWheel = typeof moveWheel !== 'undefined' ? moveWheel : function() { return ''; };
  window.secTimeFootprint = typeof secTimeFootprint !== 'undefined' ? secTimeFootprint : function() { return ''; };
  window.secOptHeatmap = typeof secOptHeatmap !== 'undefined' ? secOptHeatmap : function() { return ''; };
  window.secInternals = typeof secInternals !== 'undefined' ? secInternals : function() { return ''; };
  window.secOptions = typeof secOptions !== 'undefined' ? secOptions : function() { return ''; };
  window.secVenue = typeof secVenue !== 'undefined' ? secVenue : function() { return ''; };
  window.secStars = typeof secStars !== 'undefined' ? secStars : function() { return ''; };
  window.secWatchlist = typeof secWatchlist !== 'undefined' ? secWatchlist : function() { return ''; };
  window.secWeek = typeof secWeek !== 'undefined' ? secWeek : function() { return ''; };
  window.secAlignment = typeof secAlignment !== 'undefined' ? secAlignment : function() { return { sum:0, live:0, votes:{} }; };
  window.secGex = typeof secGex !== 'undefined' ? secGex : function() { return ''; };
  window.secGeometry = typeof secGeometry !== 'undefined' ? secGeometry : function() { return ''; };
  window.secQuant = typeof secQuant !== 'undefined' ? secQuant : function() { return ''; };
  window.finalRegime = typeof finalRegime !== 'undefined' ? finalRegime : function() { return ''; };
  window.secTouchFlow = typeof secTouchFlow !== 'undefined' ? secTouchFlow : function() { return ''; };
  window.secFadeRegime = typeof secFadeRegime !== 'undefined' ? secFadeRegime : function() { return ''; };
  window.secRangeUsed = typeof secRangeUsed !== 'undefined' ? secRangeUsed : function() { return ''; };
  window.secPlan = typeof secPlan !== 'undefined' ? secPlan : function() { return ''; };
  window.secVanna = typeof secVanna !== 'undefined' ? secVanna : function() { return ''; };
  window.secSynthesis = typeof secSynthesis !== 'undefined' ? secSynthesis : function() { return ''; };
  window.secCockpit = typeof secCockpit !== 'undefined' ? secCockpit : function() { return ''; };
  window.secNasdaqCommandCenter = typeof secNasdaqCommandCenter !== 'undefined' ? secNasdaqCommandCenter : function() { return ''; };
  window.starChart = typeof starChart !== 'undefined' ? starChart : function() { return ''; };
  window.starCorrel = typeof starCorrel !== 'undefined' ? starCorrel : function() { return ''; };
  window.startLivePrices = typeof startLivePrices !== 'undefined' ? startLivePrices : function() {};
  // Expose helpers needed by dispatcher and gap widgets
  window.has = typeof has !== 'undefined' ? has : function() { return false; };
  window.ok = typeof ok !== 'undefined' ? ok : function() { return false; };
  window.get = typeof get !== 'undefined' ? get : function() { return undefined; };
  window.fmtBig = typeof fmtBig !== 'undefined' ? fmtBig : function() { return ''; };
  window.row = typeof row !== 'undefined' ? row : function(k,v) { return '<div class="row"><span class="k">'+k+'</span><span class="v">'+v+'</span></div>'; };
  window.num = typeof num !== 'undefined' ? num : function(v) { return Number(v||0).toFixed(2); };
  window.signed = typeof signed !== 'undefined' ? signed : function(v) { return (v>0?'+':'')+Number(v||0).toFixed(2); };
  window.commas = typeof commas !== 'undefined' ? commas : function(v) { return Number(v||0).toLocaleString(); };
  window.esc = typeof esc !== 'undefined' ? esc : function(s) { var d=document.createElement('div');d.textContent=String(s||'');return d.innerHTML; };
})();

''' + dispatcher_js + '''

// ═══════════════════════════════════════════════
// GAP WIDGETS (13 new widgets)
// ═══════════════════════════════════════════════
''' + gap_widgets_js + '''

// ═══════════════════════════════════════════════
// WORKSPACE SHELL
// ═══════════════════════════════════════════════

''' + shell_js_modified + '''

</script>
</body>
</html>'''

# Post-process: replace any remaining rgba(255,255,255,...) in dashboard inline styles
# These are inside render function string literals — swap white→crimson-tinted
import re as _re
def _yama_rgba(m):
    alpha = float(m.group(1))
    # Map white translucent → crimson-tinted translucent (slightly boosted opacity)
    new_alpha = min(alpha * 1.8, 0.4)
    return f'rgba(140,20,20,{new_alpha:.3f})'
output = _re.sub(r'rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)', _yama_rgba, output)

# Write output
with open('/home/claude/gshinrje.txt', 'w') as f:
    f.write(output)

print(f"Written {len(output)} chars ({len(output.split(chr(10)))} lines) to /home/claude/gshinrje.txt")
