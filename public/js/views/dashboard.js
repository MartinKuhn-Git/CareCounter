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
          ctx.font = 'bold 13px system-ui, sans-serif';
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
            data: user1Data.map(v => -v), // Negative Werte für links
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
          padding: { left: 10, right: 10 }
        },
        scales: {
          x: {
            stacked: false,
            min: -(maxVal * 1.2),
            max: maxVal * 1.2,
            ticks: {
              callback: (value) => Math.abs(value).toFixed(1) + ' Std',
              font: { size: 12 }
            },
            grid: {
              color: 'rgba(0,0,0,0.05)'
            },
            title: {
              display: true,
              text: 'Stunden pro Woche',
              font: { size: 13 }
            }
          },
          y: {
            stacked: false,
            ticks: {
              font: { size: 13 },
              padding: 50
            },
            grid: { display: false }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { size: 14 },
              padding: 20,
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
  }
};
