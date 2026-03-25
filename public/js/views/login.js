// Login View
const LoginView = {
  async render() {
    const users = await UserService.getAll();

    const container = document.getElementById('app');
    container.innerHTML = `
      <div class="login-page">
        <div class="login-header">
          <h1>CareCounter</h1>
          <p class="subtitle">Carearbeit fair verteilen</p>
        </div>

        <div class="user-selection">
          <h2>Wer bist du?</h2>
          <div class="user-cards" id="userCards">
            ${users.map(user => `
              <button class="user-card" data-user-id="${user.id}" data-user-name="${user.name}">
                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <span class="user-name">${user.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="new-user-section">
          <button class="btn btn-secondary" id="toggleNewUser">+ Neuen User erstellen</button>
          <div class="new-user-form hidden" id="newUserForm">
            <input type="text" id="newUserName" placeholder="Name eingeben..." maxlength="30">
            <button class="btn btn-primary" id="createUserBtn">Erstellen</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    // User auswählen
    document.querySelectorAll('.user-card').forEach(card => {
      card.addEventListener('click', () => {
        const userId = card.dataset.userId;
        const userName = card.dataset.userName;
        App.login(userId, userName);
      });
    });

    // Neuen User Form togglen
    document.getElementById('toggleNewUser').addEventListener('click', () => {
      document.getElementById('newUserForm').classList.toggle('hidden');
      document.getElementById('newUserName').focus();
    });

    // Neuen User erstellen
    document.getElementById('createUserBtn').addEventListener('click', () => this.createUser());
    document.getElementById('newUserName').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.createUser();
    });
  },

  async createUser() {
    const nameInput = document.getElementById('newUserName');
    const name = nameInput.value.trim();
    if (!name) return;

    try {
      await UserService.create(name);
      await this.render();
    } catch (error) {
      console.error('Fehler beim Erstellen des Users:', error);
      alert('Fehler beim Erstellen des Users.');
    }
  }
};
