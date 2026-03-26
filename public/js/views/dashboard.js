// Dashboard View - Butterfly Chart
const DashboardView = {
  chart: null,

  async render() {
    const users = await UserService.getAll();
    const allActivities = await ActivityService.getAll();

    const container = document.getElementById('app');
    container.innerHTML = `
      <div class="dashboard-page">
        <nav class="top-nav">
          <div class="nav-left">
            <h1>CareCounter</h1>
          </div>
          <div class="nav-right">
            <span class="current-user">Eingeloggt als: <strong>${App.currentUser.name}</strong></span>
            <button class="btn btn-primary" id="manageActivities">Tätigkeiten verwalten</button>
            <button class="btn btn-logout" id="logoutBtn">Abmelden</button>
          </div>
        </nav>

        <div class="dashboard-content">
          <h2>Verteilung der Carearbeit</h2>

          ${users.length < 2
            ? '<p class="empty-state">Es werden mindestens 2 User benötigt für den Vergleich.</p>'
            : `
              <div class="chart-controls">
                <div class="user-select-group">
                  <label for="user1Select">Links:</label>
                  <select id="user1Select">
                    ${users.map(u => `<option value="${u.id}" ${u.name === 'Martin' ? 'selected' : ''}>${u.name}</option>`).join('')}
                  </select>
                </div>
                <div class="user-select-group">
                  <label for="user2Select">Rechts:</label>
                  <select id="user2Select">
                    ${users.map(u => `<option value="${u.id}" ${u.name === 'Verena' ? 'selected' : ''}>${u.name}</option>`).join('')}
                  </select>
                </div>
                <button class="btn btn-primary" id="refreshChart">Aktualisieren</button>
              </div>
              <div class="chart-container">
                <canvas id="butterflyChart"></canvas>
              </div>
              <div id="summaryTable"></div>
              <div id="heartIndicator" class="heart-indicator">
                <div class="heart-container">
                  <div class="heart-particles"></div>
                  <svg class="heart-svg" viewBox="-10 -10 120 110" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <!-- Basis-Gradient: Tiefes 3D-Rot -->
                      <radialGradient id="heartBase" cx="45%" cy="40%" r="55%" fx="35%" fy="30%">
                        <stop offset="0%" class="heart-base-highlight"/>
                        <stop offset="40%" class="heart-base-mid"/>
                        <stop offset="100%" class="heart-base-shadow"/>
                      </radialGradient>
                      <!-- Glanzlicht oben-links -->
                      <radialGradient id="heartShine" cx="32%" cy="28%" r="30%">
                        <stop offset="0%" stop-color="rgba(255,255,255,0.55)"/>
                        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
                      </radialGradient>
                      <!-- Zweites subtiles Glanzlicht rechts -->
                      <radialGradient id="heartShine2" cx="68%" cy="35%" r="20%">
                        <stop offset="0%" stop-color="rgba(255,255,255,0.2)"/>
                        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
                      </radialGradient>
                      <!-- Eis-Overlay (wird per Opacity gesteuert) -->
                      <radialGradient id="iceOverlay" cx="50%" cy="45%" r="60%">
                        <stop offset="0%" stop-color="rgba(200,220,240,0.3)"/>
                        <stop offset="50%" stop-color="rgba(160,200,230,0.5)"/>
                        <stop offset="100%" stop-color="rgba(100,150,200,0.7)"/>
                      </radialGradient>
                      <!-- Feuer-Glow Overlay -->
                      <radialGradient id="fireOverlay" cx="50%" cy="60%" r="60%">
                        <stop offset="0%" stop-color="rgba(255,200,50,0.3)"/>
                        <stop offset="60%" stop-color="rgba(255,80,0,0.15)"/>
                        <stop offset="100%" stop-color="rgba(180,0,0,0.1)"/>
                      </radialGradient>
                      <!-- 3D Schatten -->
                      <filter id="heart3d">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/>
                        <feOffset in="blur" dx="3" dy="6" result="shadow"/>
                        <feFlood flood-color="rgba(0,0,0,0.35)" result="color"/>
                        <feComposite in="color" in2="shadow" operator="in" result="shadow"/>
                        <feMerge>
                          <feMergeNode in="shadow"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <!-- Eis-Risse Textur (clipped to heart shape) -->
                      <clipPath id="heartClip">
                        <path d="M50 85 C50 85, 5 55, 5 30 C5 12, 20 0, 35 0 C42 0, 48 4, 50 10 C52 4, 58 0, 65 0 C80 0, 95 12, 95 30 C95 55, 50 85, 50 85Z"/>
                      </clipPath>
                      <filter id="iceCracks">
                        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="2" result="noise"/>
                        <feColorMatrix type="saturate" values="0" in="noise" result="gray"/>
                        <feBlend in="SourceGraphic" in2="gray" mode="overlay" result="cracked"/>
                      </filter>
                    </defs>
                    <g filter="url(#heart3d)">
                      <!-- Basis-Herz -->
                      <path class="heart-path" d="M50 85 C50 85, 5 55, 5 30 C5 12, 20 0, 35 0 C42 0, 48 4, 50 10 C52 4, 58 0, 65 0 C80 0, 95 12, 95 30 C95 55, 50 85, 50 85Z" fill="url(#heartBase)"/>
                      <!-- Feuer-Overlay -->
                      <path class="heart-fire-overlay" d="M50 85 C50 85, 5 55, 5 30 C5 12, 20 0, 35 0 C42 0, 48 4, 50 10 C52 4, 58 0, 65 0 C80 0, 95 12, 95 30 C95 55, 50 85, 50 85Z" fill="url(#fireOverlay)" opacity="0"/>
                      <!-- Eis-Overlay -->
                      <path class="heart-ice-overlay" d="M50 85 C50 85, 5 55, 5 30 C5 12, 20 0, 35 0 C42 0, 48 4, 50 10 C52 4, 58 0, 65 0 C80 0, 95 12, 95 30 C95 55, 50 85, 50 85Z" fill="url(#iceOverlay)" opacity="0"/>
                      <!-- Eis-Risse -->
                      <g clip-path="url(#heartClip)">
                        <rect class="heart-ice-cracks" x="0" y="0" width="100" height="90" fill="rgba(180,210,240,0.15)" filter="url(#iceCracks)" opacity="0"/>
                      </g>
                      <!-- Glanzlichter -->
                      <path d="M50 85 C50 85, 5 55, 5 30 C5 12, 20 0, 35 0 C42 0, 48 4, 50 10 C52 4, 58 0, 65 0 C80 0, 95 12, 95 30 C95 55, 50 85, 50 85Z" fill="url(#heartShine)"/>
                      <path d="M50 85 C50 85, 5 55, 5 30 C5 12, 20 0, 35 0 C42 0, 48 4, 50 10 C52 4, 58 0, 65 0 C80 0, 95 12, 95 30 C95 55, 50 85, 50 85Z" fill="url(#heartShine2)"/>
                    </g>
                  </svg>
                  <div class="heart-label"></div>
                </div>
              </div>
            `
          }
        </div>
      </div>
    `;

    this.bindEvents();

    if (users.length >= 2) {
      this.updateChart(users, allActivities);
    }
  },

  bindEvents() {
    document.getElementById('manageActivities').addEventListener('click', () => {
      window.location.hash = '#activities';
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
      App.logout();
    });

    const refreshBtn = document.getElementById('refreshChart');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        const users = await UserService.getAll();
        const allActivities = await ActivityService.getAll();
        this.updateChart(users, allActivities);
      });
    }
  },

  updateChart(users, allActivities) {
    const user1Id = document.getElementById('user1Select').value;
    const user2Id = document.getElementById('user2Select').value;
    const user1 = users.find(u => u.id === user1Id);
    const user2 = users.find(u => u.id === user2Id);

    if (!user1 || !user2 || user1Id === user2Id) {
      alert('Bitte wähle zwei verschiedene User aus.');
      return;
    }

    // Alle einzigartigen Tätigkeiten sammeln
    const activityNames = [...new Set(allActivities.map(a => a.activityName))].sort();

    // Daten berechnen
    const labels = [];
    const user1Data = [];
    const user2Data = [];
    const percentages = [];

    activityNames.forEach(name => {
      const user1Activities = allActivities.filter(a => a.userId === user1Id && a.activityName === name);
      const user2Activities = allActivities.filter(a => a.userId === user2Id && a.activityName === name);

      // Wöchentliche Stunden summieren
      const user1Weekly = user1Activities.reduce((sum, a) =>
        sum + ActivityService.toWeeklyHours(a.duration, a.unit), 0);
      const user2Weekly = user2Activities.reduce((sum, a) =>
        sum + ActivityService.toWeeklyHours(a.duration, a.unit), 0);

      const total = user1Weekly + user2Weekly;
      if (total === 0) return;

      labels.push(name);
      user1Data.push(user1Weekly);
      user2Data.push(user2Weekly);

      const pct1 = Math.round((user1Weekly / total) * 100);
      const pct2 = 100 - pct1;
      percentages.push(`${pct1}/${pct2}`);
    });

    if (labels.length === 0) {
      document.querySelector('.chart-container').innerHTML =
        '<p class="empty-state">Keine Tätigkeiten vorhanden. Erstelle zuerst Einträge.</p>';
      return;
    }

    this.renderButterflyChart(labels, user1Data, user2Data, percentages, user1.name, user2.name);
    this.renderSummaryTable(labels, user1Data, user2Data, percentages, user1.name, user2.name);
  },

  renderButterflyChart(labels, user1Data, user2Data, percentages, user1Name, user2Name) {
    const canvas = document.getElementById('butterflyChart');
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const maxVal = Math.max(...user1Data, ...user2Data);
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 768;

    // Percentage labels als Plugin
    const percentagePlugin = {
      id: 'percentageLabels',
      afterDraw(chart) {
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);

        meta.data.forEach((bar, index) => {
          const y = bar.y;
          const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;

          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `bold ${isMobile ? 10 : 13}px system-ui, sans-serif`;
          ctx.fillStyle = '#334155';
          ctx.fillText(percentages[index], centerX, y);
          ctx.restore();
        });
      }
    };

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: user1Name,
            data: user1Data.map(v => -v),
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: user2Name,
            data: user2Data,
            backgroundColor: 'rgba(236, 72, 153, 0.7)',
            borderColor: 'rgba(236, 72, 153, 1)',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { left: isMobile ? 2 : 10, right: isMobile ? 2 : 10 }
        },
        scales: {
          x: {
            stacked: false,
            min: -(maxVal * 1.2),
            max: maxVal * 1.2,
            ticks: {
              callback: (value) => Math.abs(value).toFixed(isMobile ? 0 : 1) + (isMobile ? 'h' : ' Std'),
              font: { size: isMobile ? 9 : 12 },
              maxTicksLimit: isMobile ? 5 : 10
            },
            grid: {
              color: 'rgba(0,0,0,0.05)'
            },
            title: {
              display: !isMobile,
              text: 'Stunden pro Woche',
              font: { size: 13 }
            }
          },
          y: {
            stacked: false,
            ticks: {
              font: { size: isMobile ? 10 : 13 },
              padding: isMobile ? 20 : 50
            },
            grid: { display: false }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { size: isMobile ? 11 : 14 },
              padding: isMobile ? 10 : 20,
              usePointStyle: true,
              pointStyle: 'rectRounded'
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = Math.abs(context.raw).toFixed(1);
                return `${context.dataset.label}: ${val} Std/Woche`;
              }
            }
          }
        }
      },
      plugins: [percentagePlugin]
    });
  },

  renderSummaryTable(labels, user1Data, user2Data, percentages, user1Name, user2Name) {
    const totalUser1 = user1Data.reduce((s, v) => s + v, 0);
    const totalUser2 = user2Data.reduce((s, v) => s + v, 0);
    const grandTotal = totalUser1 + totalUser2;
    const totalPct1 = grandTotal > 0 ? Math.round((totalUser1 / grandTotal) * 100) : 0;
    const totalPct2 = grandTotal > 0 ? 100 - totalPct1 : 0;

    document.getElementById('summaryTable').innerHTML = `
      <div class="summary">
        <h3>Zusammenfassung (Stunden pro Woche)</h3>
        <table>
          <thead>
            <tr>
              <th>Tätigkeit</th>
              <th>${user1Name}</th>
              <th>Verteilung</th>
              <th>${user2Name}</th>
            </tr>
          </thead>
          <tbody>
            ${labels.map((name, i) => `
              <tr>
                <td>${name}</td>
                <td class="num">${user1Data[i].toFixed(1)}</td>
                <td class="pct">${percentages[i]}</td>
                <td class="num">${user2Data[i].toFixed(1)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td><strong>Gesamt</strong></td>
              <td class="num"><strong>${totalUser1.toFixed(1)}</strong></td>
              <td class="pct"><strong>${totalPct1}/${totalPct2}</strong></td>
              <td class="num"><strong>${totalUser2.toFixed(1)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    this.updateHeart(totalPct1, totalPct2);
  },

  particleInterval: null,

  updateHeart(pct1, pct2) {
    const heart = document.getElementById('heartIndicator');
    if (!heart) return;

    const heartPath = heart.querySelector('.heart-path');
    const heartLabel = heart.querySelector('.heart-label');
    const particleBox = heart.querySelector('.heart-particles');

    // Wie nah an 50/50? 0 = perfekt gleich, 50 = komplett ungleich
    const deviation = Math.abs(pct1 - 50);
    // 0..50 -> 1..0 (1 = 50/50, 0 = 0/100)
    const balance = 1 - (deviation / 50);

    // balance: 0 = komplett ungleich (eisblau), 1 = 50/50 (feurig rot)
    // RGB-Interpolation für sauberen Blau->Violett->Rot Übergang
    const lerp = (a, b, t) => Math.round(a + (b - a) * t);
    const rgb = (r, g, b) => `rgb(${r}, ${g}, ${b})`;

    // === HERZFARBE: Blau -> Rot via RGB ===
    // Hauptfarbe direkt auf den Pfad setzen (SVG-Gradients cachen im Browser)
    const mainColor = rgb(lerp(80, 210, balance), lerp(150, 30, balance), lerp(210, 20, balance));
    heartPath.setAttribute('fill', mainColor);

    // === OVERLAYS ===
    const fireOverlay = heart.querySelector('.heart-fire-overlay');
    const iceOverlay = heart.querySelector('.heart-ice-overlay');
    const iceCracks = heart.querySelector('.heart-ice-cracks');

    // Feuer-Overlay: ab balance > 0.4
    const fireIntensity = Math.max(0, (balance - 0.4) / 0.6);
    fireOverlay.setAttribute('opacity', fireIntensity * 0.8);

    // Eis-Overlay & Risse: ab balance < 0.6
    const iceIntensity = Math.max(0, (0.6 - balance) / 0.6);
    iceOverlay.setAttribute('opacity', iceIntensity * 0.6);
    iceCracks.setAttribute('opacity', iceIntensity * 0.7);

    // === GLOW ===
    const glowSize = 15 + balance * 20;
    const glowR = lerp(100, 239, balance);
    const glowG = lerp(180, 68, balance);
    const glowB = lerp(255, 68, balance);
    const glowOpacity = 0.35 + Math.abs(balance - 0.5) * 0.5;
    const glowColor = `rgba(${glowR}, ${glowG}, ${glowB}, ${glowOpacity.toFixed(2)})`;

    heart.querySelector('.heart-svg').style.filter = `drop-shadow(0 0 ${glowSize}px ${glowColor})`;
    heart.querySelector('.heart-svg').style.animation = 'none';

    // === LABEL ===
    heartLabel.textContent = `${pct1}/${pct2}`;
    heartLabel.style.color = rgb(
      lerp(70, 200, balance), lerp(130, 30, balance), lerp(200, 20, balance)
    );

    // Partikel starten
    this.startParticles(particleBox, balance);
  },

  startParticles(container, balance) {
    // Vorherige Partikel stoppen
    if (this.particleInterval) {
      clearInterval(this.particleInterval);
      this.particleInterval = null;
    }
    container.innerHTML = '';

    const isFlame = balance > 0.5;
    const intensity = isFlame ? balance : (1 - balance);
    // Partikel-Rate: mehr Partikel bei höherer Intensität
    const interval = Math.max(80, 300 - intensity * 250);
    const maxParticles = Math.floor(8 + intensity * 15);

    this.particleInterval = setInterval(() => {
      if (container.children.length >= maxParticles) {
        container.removeChild(container.firstChild);
      }

      const p = document.createElement('span');

      if (isFlame) {
        // Flammen: glühende Partikel die aufsteigen
        p.className = 'particle flame';
        const size = 4 + Math.random() * 10;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.borderRadius = '50%';
        // Flammen-Farben: gelb, orange, rot
        const colors = ['#ff6600', '#ff4400', '#ffaa00', '#ff2200', '#ffcc00', '#ff8800'];
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.boxShadow = `0 0 ${size}px ${size/2}px ${p.style.background}`;
        p.style.left = (15 + Math.random() * 70) + '%';
        p.style.bottom = '15%';
        const dur = 0.6 + Math.random() * 1.2;
        p.style.animationDuration = dur + 's';
        p.style.setProperty('--drift', (Math.random() * 40 - 20) + 'px');
      } else {
        // Eiskristalle: fallen nach unten
        p.className = 'particle ice';
        if (Math.random() > 0.4) {
          // Schneeflocken-Zeichen
          const crystals = ['\u2744', '\u2745', '\u2746'];
          p.textContent = crystals[Math.floor(Math.random() * crystals.length)];
          p.style.fontSize = (10 + Math.random() * 14) + 'px';
        } else {
          // Kleine glitzernde Eispunkte
          const size = 2 + Math.random() * 5;
          p.style.width = size + 'px';
          p.style.height = size + 'px';
          p.style.borderRadius = '50%';
          p.style.background = 'rgba(200, 230, 255, 0.8)';
          p.style.boxShadow = `0 0 ${size + 2}px rgba(150, 200, 255, 0.6)`;
        }
        p.style.left = (5 + Math.random() * 90) + '%';
        p.style.top = '0%';
        const dur = 2 + Math.random() * 3;
        p.style.animationDuration = dur + 's';
        p.style.setProperty('--drift', (Math.random() * 40 - 20) + 'px');
      }

      container.appendChild(p);
      // Partikel nach Animation entfernen
      p.addEventListener('animationend', () => p.remove());
    }, interval);
  }
};
