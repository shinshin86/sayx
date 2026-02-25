import fs from "node:fs";
import path from "node:path";
import type { BenchReport, BenchItem } from "./bench.js";

export function writeJsonReport(report: BenchReport, outdir: string): string {
  const reportPath = path.join(outdir, "report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  return reportPath;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateTableRows(items: BenchItem[]): string {
  return items
    .map((item) => {
      const statusClass = item.ok ? "status-ok" : "status-failed";
      const statusText = item.ok ? "OK" : "Failed";
      const audioPlayer = item.ok && item.file
        ? `<audio controls preload="none"><source src="${escapeHtml(item.file)}" type="audio/${item.format === "mp3" ? "mpeg" : item.format}"></audio>`
        : "";
      const fileLink = item.ok && item.file
        ? `<a href="${escapeHtml(item.file)}" download>${escapeHtml(item.file)}</a>`
        : "-";
      const errorMsg = item.error ? `<span class="error-msg">${escapeHtml(item.error)}</span>` : "";
      const bytesDisplay = item.ok ? item.bytes.toLocaleString() : "-";

      return `
        <tr data-engine="${escapeHtml(item.engineType)}" data-preset="${escapeHtml(item.preset)}">
          <td>${escapeHtml(item.engineType)}</td>
          <td>${escapeHtml(item.preset)}</td>
          <td>${escapeHtml(item.speaker)}</td>
          <td class="${statusClass}">${statusText}${errorMsg}</td>
          <td>${bytesDisplay}</td>
          <td>${item.format ?? "-"}</td>
          <td>${audioPlayer}</td>
          <td>${fileLink}</td>
        </tr>
      `;
    })
    .join("\n");
}

function generateFilterOptions(items: BenchItem[]): { engines: string[]; presets: string[] } {
  const engines = [...new Set(items.map((i) => i.engineType))].sort();
  const presets = [...new Set(items.map((i) => i.preset))].sort();
  return { engines, presets };
}

export function generateHtmlReport(report: BenchReport): string {
  const { engines, presets } = generateFilterOptions(report.items);

  const engineOptions = engines
    .map((e) => `<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`)
    .join("\n");

  const presetOptions = presets
    .map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`)
    .join("\n");

  const tableRows = generateTableRows(report.items);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>sayx Benchmark Report</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      margin-top: 0;
      color: #2c3e50;
    }
    .meta {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .meta-item {
      margin: 5px 0;
    }
    .meta-label {
      font-weight: 600;
      color: #666;
    }
    .text-display {
      background: #fff3cd;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      border-left: 4px solid #ffc107;
    }
    .text-display strong {
      display: block;
      margin-bottom: 5px;
      color: #856404;
    }
    .summary {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    .summary-item {
      padding: 15px 25px;
      border-radius: 4px;
      text-align: center;
    }
    .summary-total {
      background: #e3f2fd;
      color: #1565c0;
    }
    .summary-ok {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .summary-failed {
      background: #ffebee;
      color: #c62828;
    }
    .summary-item .number {
      font-size: 24px;
      font-weight: bold;
    }
    .summary-item .label {
      font-size: 12px;
      text-transform: uppercase;
    }
    .filters {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      align-items: center;
    }
    .filters label {
      font-weight: 600;
      color: #666;
    }
    .filters select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #666;
      position: sticky;
      top: 0;
    }
    tr:hover {
      background: #f8f9fa;
    }
    .status-ok {
      color: #2e7d32;
      font-weight: 600;
    }
    .status-failed {
      color: #c62828;
      font-weight: 600;
    }
    .error-msg {
      display: block;
      font-size: 12px;
      font-weight: normal;
      color: #c62828;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    audio {
      height: 32px;
      width: 200px;
    }
    a {
      color: #1976d2;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .hidden {
      display: none !important;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
    }
    .footer code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
    .copy-btn {
      background: #e3f2fd;
      border: none;
      padding: 4px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      color: #1565c0;
    }
    .copy-btn:hover {
      background: #bbdefb;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>sayx Benchmark Report</h1>

    <div class="meta">
      <div class="meta-item"><span class="meta-label">Version:</span> ${escapeHtml(report.version)}</div>
      <div class="meta-item"><span class="meta-label">Generated:</span> ${escapeHtml(report.timestamp)}</div>
      <div class="meta-item"><span class="meta-label">Node:</span> ${escapeHtml(report.node)}</div>
      <div class="meta-item"><span class="meta-label">Platform:</span> ${escapeHtml(report.platform)}</div>
      <div class="meta-item"><span class="meta-label">Output:</span> ${escapeHtml(report.outdir)}</div>
    </div>

    <div class="text-display">
      <strong>Input Text:</strong>
      ${escapeHtml(report.text)}
    </div>

    <div class="summary">
      <div class="summary-item summary-total">
        <div class="number">${report.summary.total}</div>
        <div class="label">Total</div>
      </div>
      <div class="summary-item summary-ok">
        <div class="number">${report.summary.ok}</div>
        <div class="label">Success</div>
      </div>
      <div class="summary-item summary-failed">
        <div class="number">${report.summary.failed}</div>
        <div class="label">Failed</div>
      </div>
    </div>

    <div class="filters">
      <label for="engine-filter">Engine:</label>
      <select id="engine-filter">
        <option value="">All</option>
        ${engineOptions}
      </select>

      <label for="preset-filter">Preset:</label>
      <select id="preset-filter">
        <option value="">All</option>
        ${presetOptions}
      </select>

      <button class="copy-btn" id="copy-cmd-btn">Copy reproduction command</button>
    </div>

    <table id="results-table">
      <thead>
        <tr>
          <th>Engine</th>
          <th>Preset</th>
          <th>Speaker</th>
          <th>Status</th>
          <th>Bytes</th>
          <th>Format</th>
          <th>Audio</th>
          <th>File</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div class="footer">
      <p><strong>Note:</strong> If audio does not play, browsers may block local file access. Run a local server:</p>
      <p><code>npx serve ${escapeHtml(report.outdir)}</code></p>
      <p>Then open <code>http://localhost:3000/index.html</code></p>
    </div>
  </div>

  <script>
    (function() {
      const engineFilter = document.getElementById('engine-filter');
      const presetFilter = document.getElementById('preset-filter');
      const copyBtn = document.getElementById('copy-cmd-btn');
      const rows = document.querySelectorAll('#results-table tbody tr');

      function applyFilters() {
        const engine = engineFilter.value;
        const preset = presetFilter.value;

        rows.forEach(row => {
          const rowEngine = row.getAttribute('data-engine');
          const rowPreset = row.getAttribute('data-preset');
          const matchEngine = !engine || rowEngine === engine;
          const matchPreset = !preset || rowPreset === preset;
          row.classList.toggle('hidden', !(matchEngine && matchPreset));
        });
      }

      engineFilter.addEventListener('change', applyFilters);
      presetFilter.addEventListener('change', applyFilters);

      copyBtn.addEventListener('click', () => {
        const engine = engineFilter.value || 'voicevox';
        const preset = presetFilter.value || 'default';
        const text = ${JSON.stringify(report.text)};
        const cmd = 'sayx "' + text.replace(/"/g, '\\\\"') + '" --engine ' + engine + ' --preset ' + preset;

        navigator.clipboard.writeText(cmd).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = 'Copy reproduction command';
          }, 2000);
        }).catch(() => {
          alert('Failed to copy. Command: ' + cmd);
        });
      });
    })();
  </script>
</body>
</html>`;
}

export function writeHtmlReport(report: BenchReport, outdir: string): string {
  const html = generateHtmlReport(report);
  const htmlPath = path.join(outdir, "index.html");
  fs.writeFileSync(htmlPath, html);
  return htmlPath;
}
