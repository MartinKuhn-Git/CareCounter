// Activities View - Tätigkeiten verwalten
const ActivitiesView = {
  async render() {
    const activities = await ActivityService.getByUser(App.currentUser.id);
    const activityNames = await ActivityService.getAllActivityNames();

    const container = document.getElementById('app');
    container.innerHTML = `
      <div class="activities-page">
        <nav class="top-nav">
          <button class="btn btn-back" id="backToDashboard">← Dashboard</button>
          <h2>Tätigkeiten von ${App.currentUser.name}</h2>
          <button class="btn btn-logout" id="logoutBtn">Abmelden</button>
        </nav>

        <div class="add-activity-form">
          <h3>Neue Tätigkeit erfassen</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="activitySelect">Tätigkeit</label>
              <select id="activitySelect">
                <option value="">-- Tätigkeit wählen --</option>
                ${activityNames.map(name => `<option value="${name}">${name}</option>`).join('')}
                <option value="__new__">+ Neue Tätigkeit erstellen...</option>
              </select>
            </div>
            <div class="form-group new-activity-input hidden" id="newActivityGroup">
              <label for="newActivityName">Neue Tätigkeit</label>
              <input type="text" id="newActivityName" placeholder="Name der Tätigkeit...">
            </div>
            <div class="form-group">
              <label for="durationInput">Zeitdauer (Stunden)</label>
              <input type="number" id="durationInput" min="0.25" step="0.25" placeholder="z.B. 1.5">
            </div>
            <div class="form-group">
              <label for="unitSelect">Einheit</label>
              <select id="unitSelect">
                <option value="hours_per_week">Stunden / Woche</option>
                <option value="hours_per_day">Stunden / Tag</option>
              </select>
            </div>
            <div class="form-group form-action">
              <button class="btn btn-primary" id="addActivityBtn">Hinzufügen</button>
            </div>
          </div>
        </div>

        <div class="activities-list">
          <h3>Meine Tätigkeiten</h3>
          ${activities.length === 0
            ? '<p class="empty-state">Noch keine Tätigkeiten erfasst.</p>'
            : `<div class="activity-items">
                ${activities.map(a => this.renderActivityItem(a)).join('')}
              </div>`
          }
        </div>
      </div>
    `;

    this.bindEvents();
  },

  renderActivityItem(activity) {
    const unitLabel = activity.unit === 'hours_per_day' ? 'Std/Tag' : 'Std/Woche';
    const weeklyHours = ActivityService.toWeeklyHours(activity.duration, activity.unit);

    return `
      <div class="activity-item" data-id="${activity.id}">
        <div class="activity-info">
          <span class="activity-name">${activity.activityName}</span>
          <span class="activity-duration">${activity.duration} ${unitLabel}</span>
          <span class="activity-weekly">(${weeklyHours.toFixed(1)} Std/Woche)</span>
        </div>
        <div class="activity-actions">
          <button class="btn btn-sm btn-edit" data-id="${activity.id}" data-name="${activity.activityName}" data-duration="${activity.duration}" data-unit="${activity.unit}">Bearbeiten</button>
          <button class="btn btn-sm btn-delete" data-id="${activity.id}">Löschen</button>
        </div>
      </div>
    `;
  },

  bindEvents() {
    // Zurück zum Dashboard
    document.getElementById('backToDashboard').addEventListener('click', () => {
      window.location.hash = '#dashboard';
    });

    // Abmelden
    document.getElementById('logoutBtn').addEventListener('click', () => {
      App.logout();
    });

    // Neue Tätigkeit Dropdown
    document.getElementById('activitySelect').addEventListener('change', (e) => {
      const newGroup = document.getElementById('newActivityGroup');
      if (e.target.value === '__new__') {
        newGroup.classList.remove('hidden');
        document.getElementById('newActivityName').focus();
      } else {
        newGroup.classList.add('hidden');
      }
    });

    // Hinzufügen
    document.getElementById('addActivityBtn').addEventListener('click', () => this.addActivity());

    // Edit/Delete Buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => this.editActivity(btn.dataset));
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => this.deleteActivity(btn.dataset.id));
    });
  },

  async addActivity() {
    const select = document.getElementById('activitySelect');
    let activityName = select.value;

    if (activityName === '__new__') {
      activityName = document.getElementById('newActivityName').value.trim();
      if (!activityName) {
        alert('Bitte gib einen Namen für die neue Tätigkeit ein.');
        return;
      }
    }

    if (!activityName) {
      alert('Bitte wähle eine Tätigkeit aus.');
      return;
    }

    const duration = document.getElementById('durationInput').value;
    if (!duration || parseFloat(duration) <= 0) {
      alert('Bitte gib eine gültige Zeitdauer ein.');
      return;
    }

    const unit = document.getElementById('unitSelect').value;

    try {
      await ActivityService.create(App.currentUser.id, activityName, duration, unit);
      await this.render();
    } catch (error) {
      console.error('Fehler beim Erstellen der Tätigkeit:', error);
      alert('Fehler beim Speichern.');
    }
  },

  async editActivity(data) {
    const newDuration = prompt(`Neue Zeitdauer für "${data.name}" (aktuell: ${data.duration}):`, data.duration);
    if (newDuration === null) return;

    const parsed = parseFloat(newDuration);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Bitte gib eine gültige Zahl ein.');
      return;
    }

    const newUnit = prompt(
      `Einheit wählen:\n1 = Stunden/Tag\n2 = Stunden/Woche\n(aktuell: ${data.unit === 'hours_per_day' ? '1' : '2'})`,
      data.unit === 'hours_per_day' ? '1' : '2'
    );
    if (newUnit === null) return;

    const unit = newUnit === '1' ? 'hours_per_day' : 'hours_per_week';

    try {
      await ActivityService.update(data.id, { duration: parsed, unit });
      await this.render();
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
      alert('Fehler beim Aktualisieren.');
    }
  },

  async deleteActivity(activityId) {
    if (!confirm('Tätigkeit wirklich löschen?')) return;

    try {
      await ActivityService.delete(activityId);
      await this.render();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen.');
    }
  }
};
