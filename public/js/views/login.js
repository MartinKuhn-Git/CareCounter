// Login View
const LoginView = {
  selectedUserId: null,
  selectedUserName: null,

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
          <div class="password-section hidden" id="passwordSection">
            <div class="password-form">
              <p class="password-label">Passwort für <strong id="selectedUserLabel"></strong>:</p>
              <div class="password-row">
                <input type="password" id="passwordInput" placeholder="Passwort eingeben...">
                <button class="btn btn-primary" id="loginBtn">Einloggen</button>
              </div>
              <div class="login-error hidden" id="loginError">Falsches Passwort.</div>
            </div>
          </div>
        </div>

        <div class="new-user-section">
          <button class="btn btn-secondary" id="toggleNewUser">+ Neuen User erstellen</button>
          <div class="new-user-form hidden" id="newUserForm">
            <input type="text" id="newUserName" placeholder="Name eingeben..." maxlength="30">
            <input type="password" id="newUserPassword" placeholder="Passwort eingeben...">
            <button class="btn btn-primary" id="createUserBtn">Erstellen</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    // User auswählen → Passwort-Feld zeigen
    document.querySelectorAll('.user-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectedUserId = card.dataset.userId;
        this.selectedUserName = card.dataset.userName;

        // Aktive Karte markieren
        document.querySelectorAll('.user-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        // Passwort-Bereich zeigen
        document.getElementById('selectedUserLabel').textContent = this.selectedUserName;
        document.getElementById('passwordSection').classList.remove('hidden');
        document.getElementById('loginError').classList.add('hidden');
        const pwInput = document.getElementById('passwordInput');
        pwInput.value = '';
        pwInput.focus();
      });
    });

    // Login-Button
    document.getElementById('loginBtn').addEventListener('click', () => this.login());
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.login();
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
    document.getElementById('newUserPassword').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.createUser();
    });
  },

  async login() {
    const password = document.getElementById('passwordInput').value;
    if (!password) return;

    try {
      const valid = await UserService.verifyPassword(this.selectedUserId, password);
      if (valid) {
        App.login(this.selectedUserId, this.selectedUserName);
      } else {
        document.getElementById('loginError').classList.remove('hidden');
      }
    } catch (error) {
      console.error('Login-Fehler:', error);
      document.getElementById('loginError').classList.remove('hidden');
    }
  },

  async createUser() {
    const nameInput = document.getElementById('newUserName');
    const passwordInput = document.getElementById('newUserPassword');
    const name = nameInput.value.trim();
    const password = passwordInput.value;

    if (!name || !password) return;

    try {
      await UserService.create(name, password);
      await this.render();
    } catch (error) {
      console.error('Fehler beim Erstellen des Users:', error);
    }
  }
};
