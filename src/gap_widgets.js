// ═══════════════════════════════════════════════
// གཤིན་རྗེ — GAP WIDGETS (14 new)
// ═══════════════════════════════════════════════

function renderGexChart(e) {
  var hist = (typeof FULL !== 'undefined' && FULL.length) ? FULL : (typeof H !== 'undefined' ? H : []);
  if (!hist.length) return '<div class="loading">No history data</div>';

  // Build candle data: open=prev_close, close=last, wicks synthesized
  var candles = [];
  for (var i = 0; i < hist.length; i++) {
    var h = hist[i];
    var q = (h.markets || {}).QQQ || {};
    var cl = q.last || 0;
    var op = q.prev_close || cl;
    if (!cl) continue;
    var body = Math.abs(cl - op);
    var wick = body * 0.4 + Math.random() * body * 0.3; // synthetic wicks
    var hi = Math.max(op, cl) + wick;
    var lo = Math.min(op, cl) - wick * 0.8;
    var dt = (h.entry_date || '').slice(5);
    var sess = (h.session || '').toLowerCase();
    candles.push({ o: op, h: hi, l: lo, c: cl, label: dt + (sess === 'pm' ? 'p' : 'a') });
  }
  if (!candles.length) return '<div class="loading">No price data</div>';

  // Current GEX levels for horizontal lines
  var gex = e.gex || {};
  var lvl = gex.levels || {};
  var curPrice = candles[candles.length - 1].c;
  var gexLines = [];
  if (lvl.call_wall) gexLines.push({ v: lvl.call_wall, label: 'CALL WALL', col: '#00e676' });
  if (lvl.max_positive_gamma) gexLines.push({ v: lvl.max_positive_gamma, label: '+γ MAX', col: '#64ffda' });
  if (gex.gamma_flip) gexLines.push({ v: gex.gamma_flip, label: 'GAMMA FLIP', col: '#ffd600' });
  if (lvl.put_wall) gexLines.push({ v: lvl.put_wall, label: 'PUT WALL', col: '#ff453a' });
  if (lvl.max_negative_gamma) gexLines.push({ v: lvl.max_negative_gamma, label: '-γ MAX', col: '#ff9100' });

  // Y range from candles + GEX levels
  var yMin = Infinity, yMax = -Infinity;
  for (var ci = 0; ci < candles.length; ci++) {
    if (candles[ci].l < yMin) yMin = candles[ci].l;
    if (candles[ci].h > yMax) yMax = candles[ci].h;
  }
  for (var gi = 0; gi < gexLines.length; gi++) {
    if (gexLines[gi].v < yMin) yMin = gexLines[gi].v;
    if (gexLines[gi].v > yMax) yMax = gexLines[gi].v;
  }
  var yPad = (yMax - yMin) * 0.08 || 5;
  yMin -= yPad; yMax += yPad;

  var n = candles.length;
  var W = 480, HT = 260;
  var pad = { top: 12, right: 80, bottom: 28, left: 6 };
  var plotW = W - pad.left - pad.right;
  var plotH = HT - pad.top - pad.bottom;
  var candleW = Math.max(3, Math.min(12, (plotW / n) * 0.7));
  var gap = plotW / n;

  function xC(idx) { return pad.left + gap * idx + gap / 2; }
  function yC(v) { return pad.top + (1 - (v - yMin) / (yMax - yMin)) * plotH; }

  var svg = '<svg viewBox="0 0 ' + W + ' ' + HT + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">';
  // Background
  svg += '<rect x="' + pad.left + '" y="' + pad.top + '" width="' + plotW + '" height="' + plotH + '" fill="rgba(255,255,255,0.015)" rx="1"/>';

  // Grid lines
  var gridN = 5;
  for (var g = 0; g <= gridN; g++) {
    var gy = pad.top + (g / gridN) * plotH;
    var gv = yMax - (g / gridN) * (yMax - yMin);
    svg += '<line x1="' + pad.left + '" y1="' + gy.toFixed(1) + '" x2="' + (pad.left + plotW) + '" y2="' + gy.toFixed(1) + '" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>';
    svg += '<text x="' + (W - pad.right + 4) + '" y="' + (gy + 3).toFixed(1) + '" fill="rgba(255,255,255,0.25)" font-size="8" font-family="ui-monospace,monospace">$' + gv.toFixed(0) + '</text>';
  }

  // GEX level lines (behind candles)
  for (var gl = 0; gl < gexLines.length; gl++) {
    var lv = gexLines[gl];
    var ly = yC(lv.v);
    if (ly < pad.top || ly > pad.top + plotH) continue;
    svg += '<line x1="' + pad.left + '" y1="' + ly.toFixed(1) + '" x2="' + (pad.left + plotW) + '" y2="' + ly.toFixed(1) + '" stroke="' + lv.col + '" stroke-width="1" stroke-dasharray="4,3" opacity="0.6"/>';
    // Label on right
    svg += '<rect x="' + (pad.left + plotW + 2) + '" y="' + (ly - 7).toFixed(1) + '" width="74" height="14" rx="2" fill="' + lv.col + '" opacity="0.15"/>';
    svg += '<text x="' + (pad.left + plotW + 5) + '" y="' + (ly + 3).toFixed(1) + '" fill="' + lv.col + '" font-size="7.5" font-family="ui-monospace,monospace" font-weight="600">' + lv.label + ' $' + lv.v.toFixed(0) + '</text>';
  }

  // Candles
  for (var k = 0; k < n; k++) {
    var cd = candles[k];
    var cx = xC(k);
    var bullish = cd.c >= cd.o;
    var color = bullish ? '#00e676' : '#ff453a';
    var bodyTop = yC(Math.max(cd.o, cd.c));
    var bodyBot = yC(Math.min(cd.o, cd.c));
    var bodyH = Math.max(1, bodyBot - bodyTop);
    // Wick
    svg += '<line x1="' + cx.toFixed(1) + '" y1="' + yC(cd.h).toFixed(1) + '" x2="' + cx.toFixed(1) + '" y2="' + yC(cd.l).toFixed(1) + '" stroke="' + color + '" stroke-width="1"/>';
    // Body
    svg += '<rect x="' + (cx - candleW / 2).toFixed(1) + '" y="' + bodyTop.toFixed(1) + '" width="' + candleW.toFixed(1) + '" height="' + bodyH.toFixed(1) + '" fill="' + (bullish ? color : color) + '" rx="0.5" opacity="' + (bullish ? '0.9' : '0.85') + '"/>';
  }

  // Current price label on right
  var cpY = yC(curPrice);
  svg += '<rect x="' + (pad.left + plotW + 2) + '" y="' + (cpY - 8).toFixed(1) + '" width="74" height="16" rx="2" fill="#ff2be0"/>';
  svg += '<text x="' + (pad.left + plotW + 6) + '" y="' + (cpY + 4).toFixed(1) + '" fill="#fff" font-size="9" font-family="ui-monospace,monospace" font-weight="700">$' + num(curPrice) + '</text>';

  // X labels
  var step = Math.max(1, Math.floor(n / 7));
  for (var xi = 0; xi < n; xi += step) {
    svg += '<text x="' + xC(xi).toFixed(1) + '" y="' + (HT - pad.bottom + 13) + '" fill="rgba(255,255,255,0.2)" font-size="7" text-anchor="middle" font-family="ui-monospace,monospace">' + candles[xi].label + '</text>';
  }

  svg += '</svg>';

  // Regime badge
  var regime = gex.regime || '';
  var regCol = regime.indexOf('NEGATIVE') >= 0 ? '#ff453a' : regime.indexOf('POSITIVE') >= 0 ? '#00e676' : 'var(--dim)';

  var html = '<h2>QQQ · GEX Levels</h2>';
  html += svg;
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding:5px 8px;background:rgba(255,255,255,0.02);border-radius:4px;font-size:11px">';
  html += '<span style="color:' + regCol + ';font-weight:600;letter-spacing:1px">' + esc(regime || 'N/A') + '</span>';
  html += '<span style="color:var(--dim)">NET ' + fmtBig(gex.net_gex || 0) + '</span>';
  html += '</div>';

  return html;
}

function renderMarketStructure(e) {
  var m = e.markets || {};
  var qqq = m.QQQ || {};
  var gex = e.gex || {};
  var levels = gex.levels || {};
  var last = qqq.last || 0;
  var callWall = levels.call_wall || 0;
  var putWall = levels.put_wall || 0;
  var flip = gex.gamma_flip || 0;
  var range = callWall - putWall;
  var posInRange = range > 0 ? ((last - putWall) / range * 100).toFixed(0) : 50;

  var html = '<h2>Market Structure</h2>';
  html += row('QQQ Last', '$' + num(last));
  html += row('Call Wall', '$' + num(callWall));
  html += row('Put Wall', '$' + num(putWall));
  html += row('Gamma Flip', '$' + num(flip));
  html += row('Range Width', '$' + num(range));

  // Position bar
  html += '<div style="margin-top:12px">';
  html += '<div style="font-size:10px;color:var(--dim);margin-bottom:4px">Position in GEX Range</div>';
  html += '<div style="background:var(--line);border-radius:4px;height:16px;position:relative;overflow:hidden">';
  var pct = Math.max(0, Math.min(100, posInRange));
  var col = pct > 60 ? 'var(--up)' : pct < 40 ? 'var(--down)' : 'var(--warn)';
  html += '<div style="width:' + pct + '%;height:100%;background:' + col + ';border-radius:4px;transition:width .3s"></div>';
  html += '<div style="position:absolute;top:0;left:50%;width:1px;height:100%;background:var(--faint)"></div>';
  html += '</div>';
  html += '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--faint);margin-top:2px"><span>Put Wall</span><span>' + pct + '%</span><span>Call Wall</span></div>';
  html += '</div>';

  return html;
}

function renderAcceptanceRejection(e) {
  var m = e.markets || {};
  var qqq = m.QQQ || {};
  var last = qqq.last || 0;
  var prevClose = qqq.prev_close || 0;
  var pctChg = qqq.pct_change || 0;
  var gex = e.gex || {};
  var levels = gex.levels || {};
  var callWall = levels.call_wall || 0;
  var putWall = levels.put_wall || 0;
  var flip = gex.gamma_flip || 0;

  var html = '<h2>Acceptance / Rejection</h2>';

  // Key level tests
  var tests = [];
  if (callWall > 0) {
    var distCall = ((last - callWall) / callWall * 100).toFixed(2);
    tests.push({ level: 'Call Wall $' + num(callWall), dist: distCall, status: Math.abs(distCall) < 0.5 ? 'TESTING' : (distCall > 0 ? 'ABOVE' : 'BELOW') });
  }
  if (putWall > 0) {
    var distPut = ((last - putWall) / putWall * 100).toFixed(2);
    tests.push({ level: 'Put Wall $' + num(putWall), dist: distPut, status: Math.abs(distPut) < 0.5 ? 'TESTING' : (distPut > 0 ? 'ABOVE' : 'BELOW') });
  }
  if (flip > 0) {
    var distFlip = ((last - flip) / flip * 100).toFixed(2);
    tests.push({ level: 'Gamma Flip $' + num(flip), dist: distFlip, status: Math.abs(distFlip) < 0.5 ? 'TESTING' : (distFlip > 0 ? 'ABOVE' : 'BELOW') });
  }
  if (prevClose > 0) {
    tests.push({ level: 'Prev Close $' + num(prevClose), dist: pctChg.toFixed(2), status: pctChg > 0.1 ? 'ACCEPTED' : pctChg < -0.1 ? 'REJECTED' : 'FLAT' });
  }

  tests.forEach(function(t) {
    var statusCol = t.status === 'TESTING' ? 'var(--warn)' : t.status === 'ABOVE' || t.status === 'ACCEPTED' ? 'var(--up)' : t.status === 'REJECTED' ? 'var(--down)' : 'var(--flat)';
    html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line);font-size:12px">';
    html += '<span style="color:var(--dim)">' + t.level + '</span>';
    html += '<span style="color:' + statusCol + ';font-weight:600;letter-spacing:1px;font-size:11px">' + t.status + '</span>';
    html += '</div>';
  });

  html += '<div style="margin-top:10px;font-size:11px;color:var(--dim)">Distance from last: ' + signed(pctChg) + '% from prev close</div>';
  return html;
}

function renderSupportResistance(e) {
  var gex = e.gex || {};
  var levels = gex.levels || {};
  var m = e.markets || {};
  var last = (m.QQQ || {}).last || 0;

  var html = '<h2>Support & Resistance</h2>';

  var zones = [];
  if (levels.call_wall) zones.push({ name: 'Call Wall', price: levels.call_wall, type: 'R' });
  if (levels.max_positive_gamma) zones.push({ name: 'Max +Gamma', price: levels.max_positive_gamma, type: 'R' });
  if (gex.gamma_flip) zones.push({ name: 'Gamma Flip', price: gex.gamma_flip, type: 'P' });
  if (levels.put_wall) zones.push({ name: 'Put Wall', price: levels.put_wall, type: 'S' });

  zones.sort(function(a, b) { return b.price - a.price; });

  html += '<table><tr><th>Zone</th><th style="text-align:right">Price</th><th style="text-align:right">Dist</th><th style="text-align:center">Type</th></tr>';
  zones.forEach(function(z) {
    var dist = last > 0 ? ((last - z.price) / z.price * 100).toFixed(2) : '—';
    var typeCol = z.type === 'R' ? 'var(--down)' : z.type === 'S' ? 'var(--up)' : 'var(--warn)';
    var typeLabel = z.type === 'R' ? 'RES' : z.type === 'S' ? 'SUP' : 'PIVOT';
    var isNear = Math.abs(parseFloat(dist)) < 1;
    html += '<tr style="' + (isNear ? 'background:rgba(255,43,224,0.06)' : '') + '">';
    html += '<td style="color:var(--txt)">' + z.name + '</td>';
    html += '<td class="num">$' + num(z.price) + '</td>';
    html += '<td class="num" style="color:' + (parseFloat(dist) >= 0 ? 'var(--up)' : 'var(--down)') + '">' + dist + '%</td>';
    html += '<td style="text-align:center;color:' + typeCol + ';font-size:10px;letter-spacing:1px">' + typeLabel + '</td>';
    html += '</tr>';
  });
  html += '</table>';

  if (last > 0 && levels.call_wall && levels.put_wall) {
    html += '<div class="read"><b>CONTEXT</b> Price at $' + num(last) + ' in a $' + num(levels.call_wall - levels.put_wall) + ' GEX range.</div>';
  }
  return html;
}

function renderVolumeProfile(e) {
  var vc = e.venue_concentration || {};
  var html = '<h2>Volume Profile</h2>';

  html += row('Total Volume', commas(vc.total_volume || 0));
  html += row('Total Premium', '$' + commas(vc.total_premium || 0));
  html += row('Sessions in Avg', String(vc.sessions_in_avg || '—'));

  // Volume share breakdown
  var vs = vc.volume_share || {};
  if (Object.keys(vs).length > 0) {
    html += '<div style="margin-top:10px"><div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Volume Share by Exchange</div>';
    var entries = Object.entries(vs).sort(function(a, b) { return b[1] - a[1]; });
    entries.forEach(function(pair) {
      var name = pair[0], pct = (pair[1] * 100).toFixed(1);
      html += '<div style="display:flex;align-items:center;gap:8px;padding:2px 0;font-size:12px">';
      html += '<div style="flex:1;color:var(--dim)">' + esc(name) + '</div>';
      html += '<div style="width:100px;background:var(--line);border-radius:2px;height:8px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:var(--accent);border-radius:2px"></div></div>';
      html += '<div style="width:40px;text-align:right;color:var(--txt)">' + pct + '%</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Premium share
  var ps = vc.premium_share || {};
  if (Object.keys(ps).length > 0) {
    html += '<div style="margin-top:10px"><div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Premium Share</div>';
    Object.entries(ps).sort(function(a, b) { return b[1] - a[1]; }).forEach(function(pair) {
      var pct = (pair[1] * 100).toFixed(1);
      html += row(pair[0], pct + '%');
    });
    html += '</div>';
  }

  return html;
}

function renderTapeBehavior(e) {
  var m = e.markets || {};
  var qqq = m.QQQ || {};
  var vix = m.VIX || {};
  var gex = e.gex || {};
  var quant = e.quant || {};
  var garch = quant.garch || {};

  var html = '<h2>Tape Behavior</h2>';

  // Regime pill
  var regime = garch.regime || 'UNKNOWN';
  var regimeCol = regime === 'LOW VOL' ? 'var(--up)' : regime === 'HIGH VOL' ? 'var(--down)' : 'var(--warn)';
  html += '<div style="text-align:center;margin-bottom:12px"><span style="background:rgba(255,255,255,0.05);border:1px solid ' + regimeCol + ';color:' + regimeCol + ';padding:4px 12px;border-radius:12px;font-size:11px;letter-spacing:1.5px">' + regime + '</span></div>';

  html += row('GARCH Cond Vol', garch.conditional_vol_pct ? garch.conditional_vol_pct.toFixed(1) + '%' : '—');
  html += row('Unconditional Vol', garch.unconditional_vol_pct ? garch.unconditional_vol_pct.toFixed(1) + '%' : '—');
  html += row('Persistence', garch.persistence ? garch.persistence.toFixed(2) : '—');
  html += row('VIX', vix.last ? num(vix.last) : '—');
  html += row('QQQ Change', signed(qqq.pct_change || 0) + '%');

  // Gamma context
  var netGex = gex.net_gex;
  if (netGex !== undefined) {
    html += '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)">';
    html += row('Net GEX', commas(netGex));
    html += row('Gamma Ratio', gex.gamma_ratio ? num(gex.gamma_ratio) : '—');
    if (gex.gamma_ratio_note) html += '<div style="font-size:11px;color:var(--dim);margin-top:4px">' + esc(gex.gamma_ratio_note) + '</div>';
    html += '</div>';
  }

  return html;
}

function renderImpliedDistribution(e) {
  var quant = e.quant || {};
  var rv = quant.realized_vs_implied || {};
  var garch = quant.garch || {};
  var geo = quant.geometry || {};

  var html = '<h2>Implied Distribution</h2>';

  html += row('Realized Vol (21d)', quant.qqq_realized_vol_21d_pct ? quant.qqq_realized_vol_21d_pct.toFixed(1) + '%' : '—');
  html += row('GARCH Cond Vol', garch.conditional_vol_pct ? garch.conditional_vol_pct.toFixed(1) + '%' : '—');
  var vd = quant.qqq_vol_drag;
  html += row('Vol Drag', typeof vd === 'number' ? vd.toFixed(3) + '%' : (vd && vd.drag_pct != null ? Number(vd.drag_pct).toFixed(3) + '%' : '—'));

  if (rv.ratio) {
    html += '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)">';
    html += row('RV/IV Ratio', num(rv.ratio));
    html += row('Implied Vol', rv.implied ? rv.implied.toFixed(1) + '%' : '—');
    html += row('Realized Vol', rv.realized ? rv.realized.toFixed(1) + '%' : '—');
    var verdict = rv.ratio > 1.1 ? 'IV CHEAP' : rv.ratio < 0.9 ? 'IV RICH' : 'FAIR';
    var vCol = verdict === 'IV CHEAP' ? 'var(--up)' : verdict === 'IV RICH' ? 'var(--down)' : 'var(--flat)';
    html += '<div style="text-align:center;margin-top:8px;font-size:13px;color:' + vCol + ';letter-spacing:1px">' + verdict + '</div>';
    html += '</div>';
  }

  // Terciles
  if (garch.tercile_low_pct) {
    html += '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)">';
    html += '<div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">GARCH Terciles</div>';
    html += row('Low', garch.tercile_low_pct.toFixed(1) + '%');
    html += row('High', garch.tercile_high_pct.toFixed(1) + '%');
    html += '</div>';
  }

  return html;
}

function renderSimilarSessions(e) {
  // Compare current entry to historical entries
  var html = '<h2>Similar Sessions</h2>';
  var qqq = (e.markets || {}).QQQ || {};
  var curPct = qqq.pct_change || 0;
  var curVix = ((e.markets || {}).VIX || {}).last || 0;
  var garch = (e.quant || {}).garch || {};
  var curVol = garch.conditional_vol_pct || 0;

  html += '<div style="font-size:11px;color:var(--dim);margin-bottom:10px">Sessions with similar QQQ move & vol regime</div>';

  // Find similar sessions from FULL history
  var matches = [];
  for (var i = 0; i < FULL.length - 1; i++) {
    var h = FULL[i];
    var hqqq = ((h.markets || {}).QQQ || {});
    var hPct = hqqq.pct_change || 0;
    var hVol = ((h.quant || {}).garch || {}).conditional_vol_pct || 0;
    var pctDiff = Math.abs(curPct - hPct);
    var volDiff = Math.abs(curVol - hVol);
    if (pctDiff < 0.5 && volDiff < 3) {
      matches.push({ date: h.entry_date, session: h.session || 'am', pct: hPct, vol: hVol, score: pctDiff + volDiff / 10 });
    }
  }
  matches.sort(function(a, b) { return a.score - b.score; });
  matches = matches.slice(0, 8);

  if (matches.length === 0) {
    html += '<div class="na">No similar sessions found in history</div>';
  } else {
    html += '<table><tr><th>Date</th><th style="text-align:right">QQQ %</th><th style="text-align:right">Vol</th></tr>';
    matches.forEach(function(m) {
      html += '<tr><td>' + esc(m.date) + ' ' + m.session + '</td>';
      html += '<td class="num" style="color:' + (m.pct >= 0 ? 'var(--up)' : 'var(--down)') + '">' + signed(m.pct) + '%</td>';
      html += '<td class="num">' + m.vol.toFixed(1) + '%</td></tr>';
    });
    html += '</table>';
    html += '<div style="margin-top:8px;font-size:11px;color:var(--dim)">' + matches.length + ' matches (±0.5% move, ±3% vol)</div>';
  }
  return html;
}

function renderRegimeHistory(e) {
  var html = '<h2>Regime History</h2>';
  html += '<div style="font-size:11px;color:var(--dim);margin-bottom:10px">Vol regime + geometry across recent sessions</div>';

  html += '<table><tr><th>Date</th><th style="text-align:right">Vol</th><th>Regime</th><th>Geometry</th></tr>';
  var recent = FULL.slice(-15);
  recent.reverse();
  recent.forEach(function(h) {
    var garch = ((h.quant || {}).garch || {});
    var geo = ((h.quant || {}).geometry || {});
    var vol = garch.conditional_vol_pct;
    var vRegime = garch.regime || '—';
    var gRegime = geo.regime || '—';
    var vCol = vRegime === 'LOW VOL' ? 'var(--up)' : vRegime === 'HIGH VOL' ? 'var(--down)' : 'var(--warn)';
    html += '<tr>';
    html += '<td style="font-size:11px">' + esc(h.entry_date || '') + '</td>';
    html += '<td class="num">' + (vol ? vol.toFixed(1) + '%' : '—') + '</td>';
    html += '<td style="color:' + vCol + ';font-size:10px">' + esc(vRegime) + '</td>';
    html += '<td style="font-size:10px;color:var(--dim)">' + esc(gRegime) + '</td>';
    html += '</tr>';
  });
  html += '</table>';
  return html;
}

function renderObservationNotes(e) {
  var html = '<h2>Observation Notes</h2>';
  var key = 'gshinrje-notes-' + (e.entry_date || 'today');

  html += '<div style="font-size:11px;color:var(--dim);margin-bottom:8px">Session: ' + esc(e.entry_date || '') + ' ' + esc(e.session || '') + '</div>';
  html += '<textarea id="obsNotes" style="width:100%;height:120px;background:var(--panel);color:var(--txt);border:1px solid var(--line);border-radius:4px;padding:8px;font:12px ui-monospace,monospace;resize:vertical" placeholder="What do you notice about today\'s session?"></textarea>';
  html += '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:6px">';
  html += '<button onclick="(function(){try{localStorage.setItem(\'' + key + '\',document.getElementById(\'obsNotes\').value);document.getElementById(\'obsSaved\').textContent=\'Saved!\'}catch(e){}})()" style="background:var(--line);color:var(--txt);border:none;padding:4px 12px;border-radius:4px;font-size:11px;cursor:pointer">Save</button>';
  html += '<span id="obsSaved" style="font-size:11px;color:var(--up)"></span>';
  html += '</div>';

  // Load existing
  html += '<script>try{var n=localStorage.getItem("' + key + '");if(n)document.getElementById("obsNotes").value=n}catch(e){}<\/script>';
  return html;
}

function renderTradeJournal(e) {
  var html = '<h2>Trade Journal</h2>';
  html += '<div style="font-size:11px;color:var(--dim);margin-bottom:8px">' + esc(e.entry_date || '') + ' · ' + esc(e.session || '') + '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">';
  var fields = ['Ticker', 'Direction', 'Entry', 'Exit', 'Size', 'P/L'];
  fields.forEach(function(f) {
    html += '<input placeholder="' + f + '" style="background:var(--panel);color:var(--txt);border:1px solid var(--line);border-radius:3px;padding:4px 6px;font-size:11px" />';
  });
  html += '</div>';

  html += '<textarea placeholder="Thesis & notes..." style="width:100%;height:60px;background:var(--panel);color:var(--txt);border:1px solid var(--line);border-radius:4px;padding:6px;font:11px ui-monospace,monospace;resize:vertical"></textarea>';

  html += '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)">';
  html += '<div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Session Context</div>';
  var qqq = (e.markets || {}).QQQ || {};
  var vix = (e.markets || {}).VIX || {};
  html += row('QQQ', '$' + num(qqq.last || 0) + ' (' + signed(qqq.pct_change || 0) + '%)');
  html += row('VIX', num(vix.last || 0));
  html += '</div>';
  return html;
}

function renderProcessScorecard(e) {
  var html = '<h2>Process Scorecard</h2>';
  html += '<div style="font-size:11px;color:var(--dim);margin-bottom:10px">Rate your process today (not your P/L)</div>';

  var items = [
    { name: 'Waited for setup', icon: '⏳' },
    { name: 'Followed thesis', icon: '🎯' },
    { name: 'Sized correctly', icon: '📐' },
    { name: 'Managed risk', icon: '🛡' },
    { name: 'No revenge trades', icon: '🧘' },
    { name: 'Accepted outcome', icon: '✓' }
  ];

  items.forEach(function(item, i) {
    html += '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--line)">';
    html += '<span style="font-size:14px">' + item.icon + '</span>';
    html += '<span style="flex:1;font-size:12px;color:var(--txt)">' + item.name + '</span>';
    html += '<div style="display:flex;gap:2px">';
    for (var s = 1; s <= 5; s++) {
      html += '<div style="width:16px;height:16px;border-radius:3px;background:var(--line);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--faint)" title="' + s + '/5">' + s + '</div>';
    }
    html += '</div></div>';
  });

  return html;
}

function renderAlerts(e) {
  var html = '<h2>Alerts</h2>';
  var alerts = [];

  // Auto-generate alerts from data
  var qqq = (e.markets || {}).QQQ || {};
  var vix = (e.markets || {}).VIX || {};
  var gex = e.gex || {};
  var garch = ((e.quant || {}).garch || {});
  var levels = gex.levels || {};

  if (Math.abs(qqq.pct_change || 0) > 1.5) alerts.push({ severity: 'high', msg: 'QQQ moved ' + signed(qqq.pct_change) + '% — large daily move' });
  if ((vix.last || 0) > 25) alerts.push({ severity: 'high', msg: 'VIX at ' + num(vix.last) + ' — elevated fear' });
  if ((vix.last || 0) < 14) alerts.push({ severity: 'low', msg: 'VIX at ' + num(vix.last) + ' — complacency zone' });

  var distFlip = gex.gamma_flip && qqq.last ? Math.abs((qqq.last - gex.gamma_flip) / gex.gamma_flip * 100) : 99;
  if (distFlip < 0.5) alerts.push({ severity: 'high', msg: 'QQQ near gamma flip ($' + num(gex.gamma_flip) + ')' });
  if (distFlip < 1.5 && distFlip >= 0.5) alerts.push({ severity: 'med', msg: 'QQQ approaching gamma flip ($' + num(gex.gamma_flip) + ')' });

  if (garch.regime === 'HIGH VOL') alerts.push({ severity: 'med', msg: 'GARCH regime: HIGH VOL (' + (garch.conditional_vol_pct || 0).toFixed(1) + '%)' });

  var distCall = levels.call_wall && qqq.last ? Math.abs((qqq.last - levels.call_wall) / levels.call_wall * 100) : 99;
  if (distCall < 0.3) alerts.push({ severity: 'med', msg: 'Price testing call wall ($' + num(levels.call_wall) + ')' });

  var distPut = levels.put_wall && qqq.last ? Math.abs((qqq.last - levels.put_wall) / levels.put_wall * 100) : 99;
  if (distPut < 0.3) alerts.push({ severity: 'high', msg: 'Price testing put wall ($' + num(levels.put_wall) + ')' });

  if (alerts.length === 0) {
    alerts.push({ severity: 'low', msg: 'All quiet — no triggered alerts' });
  }

  alerts.sort(function(a, b) { var order = { high: 0, med: 1, low: 2 }; return (order[a.severity] || 2) - (order[b.severity] || 2); });

  alerts.forEach(function(a) {
    var col = a.severity === 'high' ? 'var(--down)' : a.severity === 'med' ? 'var(--warn)' : 'var(--up)';
    var dot = a.severity === 'high' ? '🔴' : a.severity === 'med' ? '🟡' : '🟢';
    html += '<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid var(--line);font-size:12px">';
    html += '<span style="font-size:10px;flex:none;margin-top:2px">' + dot + '</span>';
    html += '<span style="color:var(--txt)">' + esc(a.msg) + '</span>';
    html += '</div>';
  });

  return html;
}

function renderNotes(e) {
  var html = '<h2>Quick Notes</h2>';
  html += '<textarea id="quickNotes" style="width:100%;height:160px;background:var(--panel);color:var(--txt);border:1px solid var(--line);border-radius:4px;padding:8px;font:12px ui-monospace,monospace;resize:vertical" placeholder="Scratch pad..."></textarea>';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">';
  html += '<span style="font-size:10px;color:var(--faint)">Saved to browser storage</span>';
  html += '<button onclick="(function(){try{localStorage.setItem(\'gshinrje-quicknotes\',document.getElementById(\'quickNotes\').value);document.getElementById(\'notesSaved\').textContent=\'✓\'}catch(e){}})()" style="background:var(--line);color:var(--txt);border:none;padding:3px 10px;border-radius:3px;font-size:11px;cursor:pointer">Save</button>';
  html += '</div>';
  html += '<span id="notesSaved" style="font-size:11px;color:var(--up)"></span>';
  html += '<script>try{var n=localStorage.getItem("gshinrje-quicknotes");if(n)document.getElementById("quickNotes").value=n}catch(e){}<\/script>';
  return html;
}
