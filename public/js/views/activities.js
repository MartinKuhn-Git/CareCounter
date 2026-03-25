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

    // Remove previous error
    document.querySelector('.form-error')?.remove();

    if (activityName === '__new__') {
      activityName = document.getElementById('newActivityName').value.trim();
      if (!activityName) {
        this.showFormError('Bitte gib einen Namen für die neue Tätigkeit ein.');
        return;
      }
    }

    if (!activityName) {
      this.showFormError('Bitte wähle eine Tätigkeit aus.');
      return;
    }

    const duration = document.getElementById('durationInput').value;
    if (!duration || parseFloat(duration) <= 0) {
      this.showFormError('Bitte gib eine gültige Zeitdauer ein.');
      return;
    }

    const unit = document.getElementById('unitSelect').value;

    try {
      await ActivityService.create(App.currentUser.id, activityName, duration, unit);
      await this.render();
    } catch (error) {
      console.error('Fehler beim Erstellen der Tätigkeit:', error);
      this.showFormError('Fehler beim Speichern.');
    }
  },

  editActivity(data) {
    const item = document.querySelector(`.activity-item[data-id="${data.id}"]`);
    if (!item) return;

    item.innerHTML = `
      <div class="edit-form">
        <span class="activity-name">${data.name}</span>
        <input type="number" class="edit-duration" value="${data.duration}" min="0.25" step="0.25">
        <select class="edit-unit">
          <option value="hours_per_week" ${data.unit === 'hours_per_week' ? 'selected' : ''}>Std/Woche</option>
          <option value="hours_per_day" ${data.unit === 'hours_per_day' ? 'selected' : ''}>Std/Tag</option>
        </select>
        <button class="btn btn-sm btn-save" data-id="${data.id}">Speichern</button>
        <button class="btn btn-sm btn-cancel">Abbrechen</button>
      </div>
    `;

    item.querySelector('.btn-save').addEventListener('click', async () => {
      const duration = parseFloat(item.querySelector('.edit-duration').value);
      const unit = item.querySelector('.edit-unit').value;
      if (isNaN(duration) || duration <= 0) return;
      try {
        await ActivityService.update(data.id, { duration, unit });
        await this.render();
      } catch (error) {
        console.error('Fehler beim Aktualisieren:', error);
      }
    });

    item.querySelector('.btn-cancel').addEventListener('click', () => this.render());
  },

  async deleteActivity(activityId) {
    const item = document.querySelector(`.activity-item[data-id="${activityId}"]`);
    if (!item) return;

    const name = item.querySelector('.activity-name')?.textContent || 'Tätigkeit';
    item.innerHTML = `
      <div class="delete-confirm">
        <span>"${name}" wirklich löschen?</span>
        <button class="btn btn-sm btn-delete-confirm">Ja, löschen</button>
        <button class="btn btn-sm btn-cancel">Abbrechen</button>
      </div>
    `;

    item.querySelector('.btn-delete-confirm').addEventListener('click', async () => {
      try {
        await ActivityService.delete(activityId);
        await this.render();
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
      }
    });

    item.querySelector('.btn-cancel').addEventListener('click', () => this.render());
  },

  showFormError(message) {
    document.querySelector('.form-error')?.remove();
    const errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    errorEl.textContent = message;
    document.querySelector('.add-activity-form .form-row').appendChild(errorEl);
  }
};
