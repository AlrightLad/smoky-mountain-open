/* ═══════════════════════════════════════════════════════════════════════════
   CHARTS — Vanilla SVG chart generators for analytics dashboards
   Zero dependencies. Theme-aware via CSS variables. Inline SVG output.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Bar Chart ──
// data: [{label, value, color?}], options: {width, height, barGap, showLabels, showValues, baseline?}
function svgBarChart(data, options) {
  var o = Object.assign({width:320, height:140, barGap:4, showLabels:true, showValues:true, baseline:null}, options || {});
  if (!data || !data.length) return '';
  var maxVal = Math.max.apply(null, data.map(function(d){return Math.abs(d.value)}));
  if (maxVal === 0) maxVal = 1;
  var barW = Math.floor((o.width - (data.length - 1) * o.barGap) / data.length);
  var chartH = o.height - (o.showLabels ? 20 : 0) - (o.showValues ? 16 : 0);
  var hasNeg = data.some(function(d){return d.value < 0});
  var zeroY = hasNeg ? chartH / 2 + (o.showValues ? 16 : 0) : chartH + (o.showValues ? 16 : 0);

  var svg = '<svg width="' + o.width + '" height="' + o.height + '" viewBox="0 0 ' + o.width + ' ' + o.height + '" style="display:block">';

  // Baseline
  if (o.baseline !== null || hasNeg) {
    svg += '<line x1="0" y1="' + zeroY + '" x2="' + o.width + '" y2="' + zeroY + '" stroke="var(--border)" stroke-width="1" stroke-dasharray="2,2"/>';
  }

  data.forEach(function(d, i) {
    var x = i * (barW + o.barGap);
    var barH = Math.abs(d.value) / maxVal * (hasNeg ? chartH / 2 : chartH);
    var color = d.color || (d.value >= 0 ? 'var(--birdie)' : 'var(--red)');
    var y = d.value >= 0 ? zeroY - barH : zeroY;
    var radius = Math.min(3, barW / 4);

    svg += '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + Math.max(barH, 1) + '" rx="' + radius + '" fill="' + color + '" opacity=".85"/>';

    if (o.showValues) {
      var valY = d.value >= 0 ? y - 4 : y + barH + 12;
      var valStr = d.value > 0 ? '+' + (Math.round(d.value * 10) / 10) : (Math.round(d.value * 10) / 10);
      svg += '<text x="' + (x + barW / 2) + '" y="' + valY + '" text-anchor="middle" fill="' + color + '" font-size="9" font-weight="600" font-family="Inter,sans-serif">' + valStr + '</text>';
    }

    if (o.showLabels) {
      svg += '<text x="' + (x + barW / 2) + '" y="' + (o.height - 2) + '" text-anchor="middle" fill="var(--muted)" font-size="8" font-family="Inter,sans-serif">' + (d.label || '') + '</text>';
    }
  });

  svg += '</svg>';
  return svg;
}

// ── Line Chart ──
// data: [{label, value}], options: {width, height, color, showDots, showArea, yMin?, yMax?}
function svgLineChart(data, options) {
  var o = Object.assign({width:320, height:120, color:'var(--gold)', showDots:true, showArea:true}, options || {});
  if (!data || data.length < 2) return '';
  var values = data.map(function(d){return d.value});
  var yMin = o.yMin !== undefined ? o.yMin : Math.min.apply(null, values) - 2;
  var yMax = o.yMax !== undefined ? o.yMax : Math.max.apply(null, values) + 2;
  var range = yMax - yMin || 1;
  var padTop = 12, padBot = 20, padLeft = 0, padRight = 0;
  var chartW = o.width - padLeft - padRight;
  var chartH = o.height - padTop - padBot;

  function px(i) { return padLeft + (i / (data.length - 1)) * chartW; }
  function py(v) { return padTop + (1 - (v - yMin) / range) * chartH; }

  var svg = '<svg width="' + o.width + '" height="' + o.height + '" viewBox="0 0 ' + o.width + ' ' + o.height + '" style="display:block">';

  // Grid lines
  for (var gi = 0; gi <= 3; gi++) {
    var gy = padTop + (gi / 3) * chartH;
    svg += '<line x1="' + padLeft + '" y1="' + gy + '" x2="' + (o.width - padRight) + '" y2="' + gy + '" stroke="var(--border)" stroke-width=".5" opacity=".3"/>';
  }

  // Area fill
  if (o.showArea) {
    var areaPath = 'M' + px(0) + ',' + py(data[0].value);
    for (var ai = 1; ai < data.length; ai++) areaPath += 'L' + px(ai) + ',' + py(data[ai].value);
    areaPath += 'L' + px(data.length-1) + ',' + (padTop + chartH) + 'L' + px(0) + ',' + (padTop + chartH) + 'Z';
    svg += '<path d="' + areaPath + '" fill="' + o.color + '" opacity=".08"/>';
  }

  // Line
  var linePath = 'M' + px(0) + ',' + py(data[0].value);
  for (var li = 1; li < data.length; li++) linePath += 'L' + px(li) + ',' + py(data[li].value);
  svg += '<path d="' + linePath + '" fill="none" stroke="' + o.color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

  // Dots
  if (o.showDots) {
    data.forEach(function(d, i) {
      svg += '<circle cx="' + px(i) + '" cy="' + py(d.value) + '" r="3" fill="' + o.color + '" stroke="var(--bg)" stroke-width="1.5"/>';
    });
  }

  // X labels (first, middle, last)
  if (data.length >= 3) {
    [0, Math.floor(data.length/2), data.length-1].forEach(function(idx) {
      if (data[idx].label) svg += '<text x="' + px(idx) + '" y="' + (o.height - 2) + '" text-anchor="middle" fill="var(--muted)" font-size="8" font-family="Inter,sans-serif">' + data[idx].label + '</text>';
    });
  }

  svg += '</svg>';
  return svg;
}

// ── Horizontal Bar Chart (for stat comparisons) ──
// data: [{label, value, maxValue?, color?}]
function svgHorizontalBars(data, options) {
  var o = Object.assign({width:280, barHeight:18, gap:8, showValues:true}, options || {});
  if (!data || !data.length) return '';
  var maxVal = Math.max.apply(null, data.map(function(d){return d.maxValue || d.value}));
  if (maxVal === 0) maxVal = 1;
  var totalH = data.length * (o.barHeight + o.gap) - o.gap;

  var svg = '<svg width="' + o.width + '" height="' + totalH + '" viewBox="0 0 ' + o.width + ' ' + totalH + '" style="display:block">';
  var labelW = 50;
  var barAreaW = o.width - labelW - (o.showValues ? 40 : 0);

  data.forEach(function(d, i) {
    var y = i * (o.barHeight + o.gap);
    var barW = (d.value / maxVal) * barAreaW;
    var color = d.color || 'var(--gold)';
    svg += '<text x="' + (labelW - 4) + '" y="' + (y + o.barHeight / 2 + 4) + '" text-anchor="end" fill="var(--muted)" font-size="9" font-family="Inter,sans-serif">' + (d.label || '') + '</text>';
    svg += '<rect x="' + labelW + '" y="' + y + '" width="' + barAreaW + '" height="' + o.barHeight + '" rx="3" fill="var(--bg3)" opacity=".5"/>';
    svg += '<rect x="' + labelW + '" y="' + y + '" width="' + Math.max(barW, 2) + '" height="' + o.barHeight + '" rx="3" fill="' + color + '" opacity=".8"/>';
    if (o.showValues) {
      svg += '<text x="' + (labelW + barAreaW + 4) + '" y="' + (y + o.barHeight / 2 + 4) + '" fill="var(--cream)" font-size="10" font-weight="600" font-family="Inter,sans-serif">' + (Math.round(d.value * 10) / 10) + (d.suffix || '') + '</text>';
    }
  });

  svg += '</svg>';
  return svg;
}
