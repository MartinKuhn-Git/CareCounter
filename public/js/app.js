// App - Router und State Management
const App = {
  currentUser: null,

  init() {
    // User aus sessionStorage wiederherstellen
    const saved = sessionStorage.getItem('currentUser');
    if (saved) {
      this.currentUser = JSON.parse(saved);
    }

    // Router
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  login(userId, userName) {
    this.currentUser = { id: userId, name: userName };
    sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    window.location.hash = '#dashboard';
  },

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('currentUser');
    window.location.hash = '';
  },

  route() {
    const hash = window.location.hash;

    if (!this.currentUser && hash !== '') {
      window.location.hash = '';
      return;
    }

    switch (hash) {
      case '#dashboard':
        DashboardView.render();
        break;
      case '#activities':
        ActivitiesView.render();
        break;
      default:
        LoginView.render();
        break;
    }
  }
};

// App starten wenn DOM bereit
document.addEventListener('DOMContentLoaded', () => App.init());
