// Configuration
const GRAPHQL_URL = '/graphql';
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let redirectAfterLogin = null;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    loadHomeStats();
    checkAuthStatus();
    
    // Navigation dynamique
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(this.getAttribute('data-section'));
        });
    });

    // Recherche
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', searchBooks);
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchBooks();
    });

    // Actualiser livres
    const refreshBooksBtn = document.getElementById('refreshBooksBtn');
    if (refreshBooksBtn) refreshBooksBtn.addEventListener('click', loadBooks);
    // Ajouter livre
    const addBookBtn = document.getElementById('addBookBtn');
    if (addBookBtn) addBookBtn.addEventListener('click', showAddBookForm);

    // Actualiser auteurs
    const refreshAuthorsBtn = document.getElementById('refreshAuthorsBtn');
    if (refreshAuthorsBtn) refreshAuthorsBtn.addEventListener('click', loadAuthors);
    // Ajouter auteur
    const addAuthorBtn = document.getElementById('addAuthorBtn');
    if (addAuthorBtn) addAuthorBtn.addEventListener('click', showAddAuthorForm);

    // Actualiser utilisateurs
    const refreshUsersBtn = document.getElementById('refreshUsersBtn');
    if (refreshUsersBtn) refreshUsersBtn.addEventListener('click', loadUsers);
    // Ajouter utilisateur
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) addUserBtn.addEventListener('click', showAddUserForm);

    // Actualiser emprunts
    const refreshLoansBtn = document.getElementById('refreshLoansBtn');
    if (refreshLoansBtn) refreshLoansBtn.addEventListener('click', loadLoans);
    // (Emprunter un livre via modal, à implémenter si besoin)

    // Tabs Auth
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            showAuthTab(this.getAttribute('data-auth'));
        });
    });

    // Formulaires Auth
    const loginFormEl = document.getElementById('loginFormEl');
    if (loginFormEl) loginFormEl.addEventListener('submit', login);
    const registerFormEl = document.getElementById('registerFormEl');
    if (registerFormEl) registerFormEl.addEventListener('submit', register);

    // Déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Modal close
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    // Bouton Emprunter un livre redirige vers Livres
    const borrowBtn = document.getElementById('borrowBtn');
    if (borrowBtn) borrowBtn.addEventListener('click', function() {
        showSection('books');
    });
    
    // S'assurer que le bouton borrowBtn fonctionne même s'il est créé dynamiquement
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'borrowBtn') {
            showSection('books');
        }
    });

    // Stats admin cliquables sur l'accueil
    const statBooks = document.querySelector('.stat-books');
    if (statBooks) statBooks.addEventListener('click', function() {
        showSection('books');
    });
    const statUsers = document.querySelector('.stat-users');
    if (statUsers) statUsers.addEventListener('click', function() {
        showSection('users');
    });
    const statLoans = document.querySelector('.stat-loans');
    if (statLoans) statLoans.addEventListener('click', function() {
        showSection('loans');
    });

    // Boutons accueil visiteurs
    setTimeout(() => {
        const btnConnect = document.getElementById('visitorConnectBtn');
        if (btnConnect) btnConnect.addEventListener('click', () => showSection('auth'));
        const btnCatalogue = document.getElementById('visitorCatalogueBtn');
        if (btnCatalogue) btnCatalogue.addEventListener('click', () => showSection('books'));
    }, 0);

    // Accueil visiteur
    const btnVisitor = document.getElementById('visitorConnectBtn');
    if (btnVisitor) btnVisitor.addEventListener('click', () => showSection('auth'));

    // Livres (pour les non connectés)
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'booksConnectBtn') {
            showSection('auth');
        }
    });

    // Emprunts (pour les non connectés)
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'loansConnectBtn') {
            showSection('auth');
        }
    });

    // Actions rapides accueil
    const quickBooks = document.getElementById('quickBooksCard');
    if (quickBooks) quickBooks.addEventListener('click', () => showSection('books'));
    const quickLoans = document.getElementById('quickLoansCard');
    if (quickLoans) quickLoans.addEventListener('click', () => showSection('loans'));
    const quickProfile = document.getElementById('quickProfileCard');
    if (quickProfile) quickProfile.addEventListener('click', () => showSection('profile'));

    // Redirection globale sur les boutons .connect-btn
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('connect-btn')) {
            // Masquer toutes les sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });
            // Afficher la section auth
            var authSection = document.getElementById('auth');
            if (authSection) {
                authSection.classList.add('active');
                authSection.style.display = 'block';
            }
            // Désactiver tous les liens actifs
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            // Activer le lien Connexion si présent
            var navLink = document.querySelector('.nav-link[data-section="auth"]');
            if (navLink) navLink.classList.add('active');
            // Toujours appeler showSection('auth') pour garantir la logique
            showSection('auth');
        }
    });
});

// Navigation
function showSection(sectionId) {
    // Correction : forcer l'affichage de la section auth si demandée
    if (sectionId === 'auth') {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
            section.style.display = 'none';
        });
        const section = document.getElementById('auth');
        if (section) {
            section.classList.add('active');
            section.style.display = 'block';
        }
        // Activer le lien correspondant si besoin
        const navLink = document.querySelector(`.nav-link[data-section="auth"]`);
        if (navLink) navLink.classList.add('active');
        return;
    }
    // Masquer toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    // Masquer tous les liens
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Afficher la section demandée
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        section.style.display = 'block';
        
        // Debug pour la section auth
        if (sectionId === 'auth') {
            console.log('Affichage de la section auth');
            console.log('Section trouvée:', section);
            console.log('Display style:', section.style.display);
        }
    }
    
    // Activer le lien correspondant
    const navLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
    if (navLink) navLink.classList.add('active');
    
    // Gestion spéciale pour auth/profile
    if (sectionId === 'auth' && currentUser) {
        // Si connecté et qu'on essaie d'accéder à auth, rediriger vers profile
        showSection('profile');
        return;
    }
    
    if (sectionId === 'profile' && !currentUser) {
        // Si pas connecté et qu'on essaie d'accéder à profile, rediriger vers auth
        showSection('auth');
        return;
    }
    
    // Protection pour la section utilisateurs (admin seulement)
    if (sectionId === 'users' && (!currentUser || currentUser.role !== 'admin')) {
        showNotification('Accès non autorisé. Seuls les administrateurs peuvent accéder à cette section.', 'error');
        showSection('home');
        return;
    }
    
    // Charger les données selon la section
    switch(sectionId) {
        case 'home':
            loadHomeStats();
            attachHomeStatsListeners();
            break;
        case 'books':
            loadBooks();
            break;
        case 'authors':
            loadAuthors();
            break;
        case 'users':
            loadUsers();
            break;
        case 'loans':
            loadLoans();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Fonctions GraphQL
async function graphqlRequest(query, variables = {}) {
    try {
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` })
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        });

        const data = await response.json();
        
        if (data.errors) {
            throw new Error(data.errors[0].message);
        }
        
        return data.data;
    } catch (error) {
        console.error('GraphQL Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Statistiques de la page d'accueil
async function loadHomeStats() {
    try {
        const adminStats = document.getElementById('adminStats');
        const userContent = document.getElementById('userContent');
        const visitorContent = document.getElementById('visitorContent');
        
        if (!currentUser) {
            // Visiteur non connecté
            if (adminStats) adminStats.style.display = 'none';
            if (userContent) userContent.style.display = 'none';
            if (visitorContent) visitorContent.style.display = 'block';
            
            // Charger les stats publiques
            const data = await graphqlRequest(`
                query {
                    books { id }
                    authors { id }
                }
            `);
            document.getElementById('visitorTotalBooks').textContent = data.books.length;
            document.getElementById('visitorTotalAuthors').textContent = data.authors.length;
            
            // Ajouter les event listeners pour les stats des visiteurs
            document.querySelectorAll('.visitor-stat').forEach(stat => {
                stat.style.cursor = 'pointer';
                stat.addEventListener('click', function() {
                    if (this.querySelector('i').classList.contains('fa-book')) {
                        showSection('books');
                    } else if (this.querySelector('i').classList.contains('fa-pen-fancy')) {
                        showSection('authors');
                    }
                });
            });
            
        } else if (currentUser.role === 'admin') {
            // Administrateur
            if (adminStats) adminStats.style.display = 'grid';
            if (userContent) userContent.style.display = 'none';
            if (visitorContent) visitorContent.style.display = 'none';
            
            // Charger les stats admin
            const data = await graphqlRequest(`
                query {
                    books { id }
                    users { id }
                    activeLoans { id }
                    authors { id }
                }
            `);
            document.getElementById('totalBooks').textContent = data.books.length;
            document.getElementById('totalUsers').textContent = data.users.length;
            document.getElementById('activeLoans').textContent = data.activeLoans.length;
            document.getElementById('totalAuthors').textContent = data.authors.length;
            
        } else {
            // Utilisateur simple
            if (adminStats) adminStats.style.display = 'none';
            if (userContent) userContent.style.display = 'block';
            if (visitorContent) visitorContent.style.display = 'none';
            
            // Mettre à jour le nom d'utilisateur
            document.getElementById('userName').textContent = currentUser.username;
            
            // Charger les stats utilisateur
            const data = await graphqlRequest(`
                query($userId: ID!) {
                    userLoans(userId: $userId) {
                        id
                        loan_date
                        return_date
                        status
                        book { title }
                    }
                }
            `, { userId: currentUser.id });
            
            const loans = data.userLoans;
            const totalLoans = loans.length;
            const activeLoans = loans.filter(loan => loan.status === 'active').length;
            const returnedLoans = loans.filter(loan => loan.status === 'returned').length;
            
            document.getElementById('userTotalLoans').textContent = totalLoans;
            document.getElementById('userActiveLoans').textContent = activeLoans;
            document.getElementById('userReturnedLoans').textContent = returnedLoans;
            
            // Afficher les derniers emprunts
            const recentLoansList = document.getElementById('userRecentLoansList');
            if (loans.length === 0) {
                recentLoansList.innerHTML = '<p>Aucun emprunt récent</p>';
            } else {
                const recentLoans = loans.slice(0, 5); // Afficher les 5 derniers
                recentLoansList.innerHTML = recentLoans.map(loan => `
                    <div class="recent-loan-item">
                        <h5>${loan.book.title}</h5>
                        <p>Emprunté le: ${new Date(loan.loan_date).toLocaleDateString()}</p>
                        <p>Statut: <span class="${loan.status === 'active' ? 'available' : 'unavailable'}">${loan.status === 'active' ? 'En cours' : 'Retourné'}</span></p>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

// Charger les livres
async function loadBooks() {
    const booksList = document.getElementById('booksList');
    booksList.innerHTML = '<div class="loading">Chargement des livres...</div>';
    
    try {
        const data = await graphqlRequest(`
            query {
                books {
                    id
                    title
                    isbn
                    publication_year
                    genre
                    description
                    available_copies
                    total_copies
                    author {
                        name
                    }
                }
            }
        `);
        
        displayBooks(data.books);
    } catch (error) {
        booksList.innerHTML = '<div class="error">Erreur lors du chargement des livres</div>';
    }
}

// Afficher les livres
function displayBooks(books) {
    const booksList = document.getElementById('booksList');
    
    if (books.length === 0) {
        booksList.innerHTML = '<div class="no-data">Aucun livre trouvé</div>';
        return;
    }
    
    let firstConnectBtn = true;
    booksList.innerHTML = books.map(book => `
        <div class="book-card">
            <h3>${book.title}</h3>
            <p><strong>Auteur:</strong> ${book.author ? book.author.name : 'Inconnu'}</p>
            <p><strong>ISBN:</strong> ${book.isbn || 'Non disponible'}</p>
            <p><strong>Année:</strong> ${book.publication_year || 'Non disponible'}</p>
            <p><strong>Genre:</strong> ${book.genre || 'Non spécifié'}</p>
            <p><strong>Description:</strong> ${book.description || 'Aucune description'}</p>
            <p><strong>Disponibilité:</strong> 
                <span class="${book.available_copies > 0 ? 'available' : 'unavailable'}">
                    ${book.available_copies}/${book.total_copies} exemplaires
                    ${book.available_copies <= 0 ? ' (Indisponible)' : ' (Disponible)'}
                </span>
            </p>
            <div class="book-actions">
                ${currentUser && currentUser.role === 'admin' ? `
                    <button class="btn btn-warning edit-book-btn" data-book-id="${book.id}"><i class="fas fa-edit"></i> Modifier</button>
                    <button class="btn btn-danger delete-book-btn" data-book-id="${book.id}"><i class="fas fa-trash"></i> Supprimer</button>
                ` : ''}
                ${currentUser ? `
                    <button class="btn ${book.available_copies <= 0 ? 'btn-unavailable' : 'btn-primary'} borrow-btn" data-book-id="${book.id}" ${book.available_copies <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-hand-holding"></i> ${book.available_copies <= 0 ? 'Indisponible' : 'Emprunter'}
                    </button>
                ` : `
                    <button class="btn btn-primary connect-btn" ${firstConnectBtn ? 'id="booksConnectBtn"' : ''} data-section="books">
                        <i class="fas fa-sign-in-alt"></i> Se connecter pour emprunter
                    </button>
                `}
            </div>
        </div>
    `).join('');
    firstConnectBtn = false;
    // Ajout des listeners sur les boutons Se connecter
    document.querySelectorAll('.connect-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            showSection('auth');
        });
    });
    // Ajout des listeners sur les boutons Emprunter
    document.querySelectorAll('.borrow-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const bookId = this.getAttribute('data-book-id');
            if (this.disabled) {
                showNotification('Ce livre n\'est pas disponible pour l\'emprunt', 'error');
                return;
            }
            this.disabled = true;
            this.textContent = 'Emprunt en cours...';
            const book = books.find(b => b.id == bookId);
            if (!book) {
                this.disabled = false;
                this.textContent = 'Emprunter';
                return;
            }
            const today = new Date().toISOString().split('T')[0];
            const defaultReturn = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            showModal(`
                <h3>Confirmer l'emprunt</h3>
                <p><strong>Livre :</strong> ${book.title}</p>
                <p><strong>Auteur :</strong> ${book.author ? book.author.name : 'Inconnu'}</p>
                <form id="borrowForm">
                  <label>Date d'emprunt :
                    <input type="date" name="dateEmprunt" value="${today}" required>
                  </label><br>
                  <label>Date de retour prévue :
                    <input type="date" name="dateRetour" value="${defaultReturn}" required>
                  </label><br>
                  <button type="submit" class="btn btn-success">Confirmer l'emprunt</button>
                </form>
            `);
            document.getElementById('borrowForm').onsubmit = async function(e) {
                e.preventDefault();
                const dateEmprunt = this.dateEmprunt.value;
                const dateRetour = this.dateRetour.value;
                closeModal();
                try {
                    await borrowBook(bookId, dateEmprunt, dateRetour);
                } catch (error) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-hand-holding"></i> Emprunter';
                }
            };
        });
    });
    // Listeners pour admin (modifier/supprimer)
    document.querySelectorAll('.edit-book-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookId = this.getAttribute('data-book-id');
            showEditBookForm(bookId);
        });
    });
    document.querySelectorAll('.delete-book-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookId = this.getAttribute('data-book-id');
            const bookTitle = this.closest('.book-card').querySelector('h3').textContent;
            deleteBook(bookId, bookTitle);
        });
    });
}

// Rechercher des livres
async function searchBooks() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        loadBooks();
        return;
    }
    
    const booksList = document.getElementById('booksList');
    booksList.innerHTML = '<div class="loading">Recherche en cours...</div>';
    
    try {
        const data = await graphqlRequest(`
            query SearchBooks($query: String!) {
                searchBooks(query: $query) {
                    id
                    title
                    isbn
                    publication_year
                    genre
                    description
                    available_copies
                    total_copies
                    author {
                        name
                    }
                }
            }
        `, { query });
        
        displayBooks(data.searchBooks);
    } catch (error) {
        booksList.innerHTML = '<div class="error">Erreur lors de la recherche</div>';
    }
}

// Charger les auteurs
async function loadAuthors() {
    const authorsList = document.getElementById('authorsList');
    authorsList.innerHTML = '<div class="loading">Chargement des auteurs...</div>';
    
    try {
        const data = await graphqlRequest(`
            query {
                authors {
                    id
                    name
                    biography
                    birth_date
                    created_at
                }
            }
        `);
        
        displayAuthors(data.authors);
    } catch (error) {
        authorsList.innerHTML = '<div class="error">Erreur lors du chargement des auteurs</div>';
    }
}

// Afficher les auteurs
function displayAuthors(authors) {
    const authorsList = document.getElementById('authorsList');
    
    if (authors.length === 0) {
        authorsList.innerHTML = '<div class="no-data">Aucun auteur trouvé</div>';
        return;
    }
    
    authorsList.innerHTML = authors.map(author => `
        <div class="author-card">
            <h3>${author.name}</h3>
            <p><strong>Biographie:</strong> ${author.biography || 'Aucune biographie disponible'}</p>
            <p><strong>Date de naissance:</strong> ${author.birth_date || 'Non disponible'}</p>
            <div class="author-actions">
                ${currentUser && currentUser.role === 'admin' ? `
                    <button class="btn btn-warning edit-author-btn" data-author-id="${author.id}"><i class="fas fa-edit"></i> Modifier</button>
                    <button class="btn btn-danger delete-author-btn" data-author-id="${author.id}"><i class="fas fa-trash"></i> Supprimer</button>
                ` : ''}
            </div>
        </div>
    `).join('');
    // Listeners pour admin (modifier/supprimer)
    document.querySelectorAll('.edit-author-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const authorId = this.getAttribute('data-author-id');
            showEditAuthorForm(authorId);
        });
    });
    document.querySelectorAll('.delete-author-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const authorId = this.getAttribute('data-author-id');
            const authorName = this.closest('.author-card').querySelector('h3').textContent;
            deleteAuthor(authorId, authorName);
        });
    });
}

// Charger les utilisateurs
async function loadUsers() {
    // Vérifier que l'utilisateur est admin
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification('Accès non autorisé. Seuls les administrateurs peuvent voir cette section.', 'error');
        showSection('home');
        return;
    }
    
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '<div class="loading">Chargement des utilisateurs...</div>';
    
    try {
        const data = await graphqlRequest(`
            query {
                users {
                    id
                    username
                    email
                    role
                    created_at
                }
            }
        `);
        
        displayUsers(data.users);
    } catch (error) {
        usersList.innerHTML = '<div class="error">Erreur lors du chargement des utilisateurs</div>';
    }
}

// Afficher les utilisateurs
function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    
    if (users.length === 0) {
        usersList.innerHTML = '<div class="no-data">Aucun utilisateur trouvé</div>';
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <div class="user-card">
            <h3>${user.username}</h3>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Rôle:</strong> <span class="role-badge ${user.role}">${user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span></p>
            <p><strong>Date d'inscription:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
            <div class="user-actions">
                ${currentUser && currentUser.role === 'admin' ? `
                    <button class="btn btn-warning edit-user-btn" data-user-id="${user.id}"><i class="fas fa-edit"></i> Modifier</button>
                    <button class="btn btn-danger delete-user-btn" data-user-id="${user.id}"><i class="fas fa-trash"></i> Supprimer</button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    // Listeners pour admin (modifier/supprimer)
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            showEditUserForm(userId);
        });
    });
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const userName = this.closest('.user-card').querySelector('h3').textContent;
            deleteUser(userId, userName);
        });
    });
}

// Charger les emprunts
async function loadLoans() {
    const loansList = document.getElementById('loansList');
    // Si pas connecté, afficher un message + bouton Se connecter
    if (!currentUser) {
        loansList.innerHTML = `
            <div class="no-data">
                Veuillez vous connecter pour voir vos emprunts.<br><br>
                <button id="goToLoginBtn" class="btn btn-primary">Se connecter</button>
            </div>
        `;
        // Ajouter l'action sur le bouton
        const btn = document.getElementById('goToLoginBtn');
        if (btn) {
            btn.addEventListener('click', function() {
                showSection('auth'); // Correction ici, passer à 'auth' au lieu de 'login'
            });
        }
        return;
    }
    loansList.innerHTML = '<div class="loading">Chargement des emprunts...</div>';
    try {
        let data;
        if (currentUser && currentUser.role !== 'admin') {
            data = await graphqlRequest(`
                query($userId: ID!) {
                    userLoans(userId: $userId) {
                        id
                        loan_date
                        return_date
                        due_date
                        status
                        user { username }
                        book { title }
                    }
                }
            `, { userId: currentUser.id });
            displayLoans(data.userLoans);
        } else {
            data = await graphqlRequest(`
                query {
                    loans {
                        id
                        loan_date
                        return_date
                        due_date
                        status
                        user { username }
                        book { title }
                    }
                }
            `);
            displayLoans(data.loans);
        }
    } catch (error) {
        loansList.innerHTML = '<div class="error">Erreur lors du chargement des emprunts</div>';
    }
}

// Afficher les emprunts
function displayLoans(loans) {
    const loansList = document.getElementById('loansList');
    if (loans.length === 0) {
        if (!currentUser) {
            loansList.innerHTML = `
                <div class="no-data">
                    Veuillez vous connecter pour voir vos emprunts.<br><br>
                    <button class="btn btn-primary connect-btn">
                        <i class="fas fa-sign-in-alt"></i> Se connecter
                    </button>
                </div>
            `;
        } else {
            loansList.innerHTML = '<div class="no-data">Aucun emprunt trouvé</div>';
        }
        return;
    }
    loansList.innerHTML = loans.map(loan => `
        <div class="loan-item">
            <div class="loan-info">
                <h4>${loan.book.title}</h4>
                <p><strong>Emprunté par:</strong> ${loan.user.username}</p>
                <p><strong>Date d'emprunt:</strong> ${new Date(loan.loan_date).toLocaleDateString()}</p>
                <p><strong>Date de retour prévue:</strong> ${loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'Non définie'}</p>
                ${loan.return_date ? `<p><strong>Date de retour:</strong> ${new Date(loan.return_date).toLocaleDateString()}</p>` : ''}
            </div>
            <div class="loan-actions">
                <span class="loan-status ${loan.status}">${loan.status === 'active' ? 'En cours' : 'Retourné'}</span>
                ${loan.status === 'active' && currentUser && loan.user.username === currentUser.username ? `
                    <button class="btn btn-success return-btn" data-loan-id="${loan.id}">
                        <i class="fas fa-undo"></i> Retourner
                    </button>
                ` : ''}
                ${!currentUser ? `
                    <button class="btn btn-primary connect-btn">
                        <i class="fas fa-sign-in-alt"></i> Se connecter
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    // Ajout des listeners pour les boutons retourner
    document.querySelectorAll('.return-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const loanId = this.getAttribute('data-loan-id');
            returnBook(loanId);
        });
    });
}

// Auth
function showAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
    
    document.querySelector(`[data-auth="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}Form`).style.display = 'block';
}

async function register(event) {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const data = await graphqlRequest(`
            mutation Register($input: UserInput!) {
                register(input: $input) {
                    token
                    user {
                        id
                        username
                        email
                        role
                    }
                }
            }
        `, {
            input: { username, email, password }
        });
        
        authToken = data.register.token;
        currentUser = data.register.user;
        localStorage.setItem('authToken', authToken);
        
        showNotification('Inscription réussie !', 'success');
        checkAuthStatus();
        
        // Rediriger si nécessaire
        if (redirectAfterLogin) {
            showSection(redirectAfterLogin);
            redirectAfterLogin = null;
        } else {
            showSection('home');
        }
    } catch (error) {
        showNotification('Erreur lors de l\'inscription: ' + error.message, 'error');
    }
}

async function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const data = await graphqlRequest(`
            mutation Login($input: LoginInput!) {
                login(input: $input) {
                    token
                    user {
                        id
                        username
                        email
                        role
                    }
                }
            }
        `, {
            input: { email, password }
        });
        
        authToken = data.login.token;
        currentUser = data.login.user;
        localStorage.setItem('authToken', authToken);
        
        showNotification('Connexion réussie !', 'success');
        checkAuthStatus();
        
        // Rediriger si nécessaire
        if (redirectAfterLogin) {
            showSection(redirectAfterLogin);
            redirectAfterLogin = null;
        } else {
            showSection('home');
        }
    } catch (error) {
        showNotification('Erreur lors de la connexion: ' + error.message, 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    showNotification('Déconnexion réussie', 'info');
    checkAuthStatus();
    showSection('home');
}

function checkAuthStatus() {
    const authSection = document.getElementById('auth');
    const profileSection = document.getElementById('profile');
    const userInfo = document.getElementById('userInfo');
    const loginBtn = document.getElementById('loginBtn');
    const profileBtn = document.getElementById('profileBtn');
    
    // Vérifier si on a un token stocké
    if (authToken && !currentUser) {
        // Tenter de restaurer la session
        validateAndRestoreSession();
        return;
    }
    
    if (currentUser) {
        // Masquer la section auth et afficher le profil
        if (authSection) authSection.style.display = 'none';
        if (profileSection) profileSection.style.display = 'block';
        
        // Gérer les liens de navigation
        if (loginBtn) loginBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'inline-block';
        
        if (userInfo) {
            userInfo.innerHTML = `
                <div style="max-width:420px;margin:40px auto 0 auto;background:#fafbfc;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 28px 24px 28px;">
                    <h3 style='margin-bottom:18px;font-size:1.35rem;color:#222;font-weight:600;letter-spacing:0.5px;'>${currentUser.username}</h3>
                    <p style='margin-bottom:12px;color:#333;font-size:1.08rem;'><i class='fas fa-envelope' style='color:#667eea;margin-right:8px;'></i>${currentUser.email}</p>
                    <p style='margin-bottom:18px;color:#333;font-size:1.08rem;'><i class='fas fa-user-tag' style='color:#667eea;margin-right:8px;'></i>${currentUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p>
                    <div style='margin-top:10px;text-align:right;'>
                        <button id="logoutBtn" class="btn btn-danger" style="min-width:140px;font-size:1rem;">Se déconnecter</button>
                    </div>
                </div>
            `;
            // Ajouter l'event listener pour le bouton de déconnexion
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
            }
        }
        
        // Afficher/masquer les boutons selon le rôle
        const addBookBtn = document.getElementById('addBookBtn');
        const addAuthorBtn = document.getElementById('addAuthorBtn');
        const addUserBtn = document.getElementById('addUserBtn');
        const borrowBtn = document.getElementById('borrowBtn');
        const usersNavLink = document.getElementById('usersNavLink');
        
        if (currentUser.role === 'admin') {
            if (addBookBtn) addBookBtn.style.display = 'inline-block';
            if (addAuthorBtn) addAuthorBtn.style.display = 'inline-block';
            if (addUserBtn) addUserBtn.style.display = 'inline-block';
            if (usersNavLink) usersNavLink.style.display = 'inline-block';
        } else {
            if (addBookBtn) addBookBtn.style.display = 'none';
            if (addAuthorBtn) addAuthorBtn.style.display = 'none';
            if (addUserBtn) addUserBtn.style.display = 'none';
            if (usersNavLink) usersNavLink.style.display = 'none';
        }
        
        if (borrowBtn) {
            borrowBtn.style.display = 'inline-block';
            // S'assurer que l'event listener est attaché
            borrowBtn.onclick = function() {
                showSection('books');
            };
        }
        
    } else {
        // Afficher la section auth et masquer le profil
        if (authSection) authSection.style.display = 'block';
        if (profileSection) profileSection.style.display = 'none';
        
        // Gérer les liens de navigation
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (profileBtn) profileBtn.style.display = 'none';
        
        // Masquer les boutons d'action
        const addBookBtn = document.getElementById('addBookBtn');
        const addAuthorBtn = document.getElementById('addAuthorBtn');
        const addUserBtn = document.getElementById('addUserBtn');
        const borrowBtn = document.getElementById('borrowBtn');
        const usersNavLink = document.getElementById('usersNavLink');
        
        if (addBookBtn) addBookBtn.style.display = 'none';
        if (addAuthorBtn) addAuthorBtn.style.display = 'none';
        if (addUserBtn) addUserBtn.style.display = 'none';
        if (borrowBtn) borrowBtn.style.display = 'none';
        if (usersNavLink) usersNavLink.style.display = 'none';
    }
}

// Valider et restaurer la session utilisateur
async function validateAndRestoreSession() {
    try {
        // Vérifier le token avec la route /api/me
        const response = await fetch('/api/me', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Récupérer les détails de l'utilisateur
            const userData = await graphqlRequest(`
                query GetUser($id: ID!) {
                    user(id: $id) {
                        id
                        username
                        email
                        role
                    }
                }
            `, { id: data.userId });
            
            if (userData.user) {
                currentUser = userData.user;
                showNotification(`Bienvenue ${currentUser.username} !`, 'success');
                checkAuthStatus();
            } else {
                throw new Error('Utilisateur non trouvé');
            }
        } else {
            throw new Error('Token invalide');
        }
    } catch (error) {
        console.log('Token invalide ou expiré, déconnexion...', error.message);
        localStorage.removeItem('authToken');
        authToken = null;
        currentUser = null;
        checkAuthStatus();
    }
}

async function loadProfile() {
    if (!currentUser) {
        showSection('auth');
        return;
    }
    // Le profil est déjà affiché dans checkAuthStatus()
}

async function borrowBook(bookId, dateEmprunt, dateRetour) {
    try {
        const data = await graphqlRequest(`
            mutation BorrowBook($userId: ID!, $bookId: ID!, $loanDate: String, $dueDate: String) {
                borrowBook(userId: $userId, bookId: $bookId, loanDate: $loanDate, dueDate: $dueDate) {
                    id
                    book {
                        title
                    }
                    loan_date
                    due_date
                }
            }
        `, {
            userId: currentUser.id,
            bookId: bookId,
            loanDate: dateEmprunt,
            dueDate: dateRetour
        });
        
        const dueDate = new Date(data.borrowBook.due_date).toLocaleDateString();
        showNotification(`Livre "${data.borrowBook.book.title}" emprunté avec succès ! Date de retour : ${dueDate}`, 'success');
        
        // Recharger les données
        await Promise.all([
            loadBooks(), // Recharger la liste des livres
            loadLoans()  // Recharger la liste des emprunts
        ]);
        
    } catch (error) {
        showNotification('Erreur lors de l\'emprunt: ' + error.message, 'error');
        throw error; // Propager l'erreur pour la gestion dans le listener
    }
}

// Retourner un livre
async function returnBook(loanId) {
    try {
        const data = await graphqlRequest(`
            mutation ReturnBook($loanId: ID!) {
                returnBook(loanId: $loanId) {
                    id
                    book {
                        title
                    }
                    return_date
                    status
                }
            }
        `, {
            loanId: loanId
        });
        
        showNotification(`Livre "${data.returnBook.book.title}" retourné avec succès !`, 'success');
        loadBooks(); // Recharger la liste des livres
        loadLoans(); // Recharger la liste des emprunts
    } catch (error) {
        showNotification('Erreur lors du retour: ' + error.message, 'error');
    }
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Modals
function showModal(content) {
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Fermer le modal en cliquant à l'extérieur
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        closeModal();
    }
}

// Formulaires modaux (pour ajouter des livres/auteurs)
function showAddBookForm() {
    // Charger dynamiquement la liste des auteurs pour le select
    graphqlRequest(`query { authors { id name } }`).then(data => {
        const authors = data.authors || [];
        const authorOptions = authors.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
        const content = `
            <h3>Ajouter un livre</h3>
            <form id="addBookForm">
                <div class="form-group">
                    <label>Titre</label>
                    <input type="text" id="bookTitle" required>
                </div>
                <div class="form-group">
                    <label>ISBN</label>
                    <input type="text" id="bookIsbn">
                </div>
                <div class="form-group">
                    <label>Auteur</label>
                    <select id="bookAuthor" required>${authorOptions}</select>
                </div>
                <div class="form-group">
                    <label>Année de publication</label>
                    <input type="number" id="bookYear">
                </div>
                <div class="form-group">
                    <label>Genre</label>
                    <input type="text" id="bookGenre">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="bookDescription" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Nombre d'exemplaires</label>
                    <input type="number" id="bookCopies" value="1" min="1" required>
                </div>
                <button type="submit" class="btn btn-success">Ajouter</button>
            </form>
        `;
        showModal(content);
        document.getElementById('addBookForm').onsubmit = addBook;
    });
}

function showAddAuthorForm() {
    const content = `
        <h3>Ajouter un auteur</h3>
        <form id="addAuthorForm">
            <div class="form-group">
                <label>Nom</label>
                <input type="text" id="authorName" required>
            </div>
            <div class="form-group">
                <label>Biographie</label>
                <textarea id="authorBio" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Date de naissance</label>
                <input type="date" id="authorBirth">
            </div>
            <button type="submit" class="btn btn-success">Ajouter</button>
        </form>
    `;
    showModal(content);
    document.getElementById('addAuthorForm').onsubmit = addAuthor;
}

// Ajouter un livre
async function addBook(event) {
    event.preventDefault();
    const title = document.getElementById('bookTitle').value;
    const isbn = document.getElementById('bookIsbn').value;
    const author_id = parseInt(document.getElementById('bookAuthor').value);
    const year = document.getElementById('bookYear').value;
    const genre = document.getElementById('bookGenre').value;
    const description = document.getElementById('bookDescription').value;
    const copies = document.getElementById('bookCopies').value;
    try {
        const data = await graphqlRequest(`
            mutation CreateBook($input: BookInput!) {
                createBook(input: $input) {
                    id
                    title
                }
            }
        `, {
            input: {
                title,
                isbn: isbn || null,
                author_id,
                publication_year: year ? parseInt(year) : null,
                genre: genre || null,
                description: description || null,
                total_copies: parseInt(copies)
            }
        });
        showNotification(`Livre "${data.createBook.title}" ajouté avec succès !`, 'success');
        closeModal();
        loadBooks();
    } catch (error) {
        showNotification('Erreur lors de l\'ajout: ' + error.message, 'error');
    }
}

// Ajouter un auteur
async function addAuthor(event) {
    event.preventDefault();
    
    const name = document.getElementById('authorName').value;
    const bio = document.getElementById('authorBio').value;
    const birth = document.getElementById('authorBirth').value;
    
    try {
        const data = await graphqlRequest(`
            mutation CreateAuthor($input: AuthorInput!) {
                createAuthor(input: $input) {
                    id
                    name
                }
            }
        `, {
            input: {
                name,
                biography: bio || null,
                birth_date: birth || null
            }
        });
        
        showNotification(`Auteur "${data.createAuthor.name}" ajouté avec succès !`, 'success');
        closeModal();
        
        // Recharger la liste des auteurs et rester sur la page auteurs
        await loadAuthors();
        
        // S'assurer qu'on reste sur la page auteurs
        showSection('authors');
        
    } catch (error) {
        showNotification('Erreur lors de l\'ajout: ' + error.message, 'error');
    }
}

// Modifier un livre
function showEditBookForm(bookId) {
    // Récupérer les données du livre
    graphqlRequest(`
        query GetBook($id: ID!) {
            book(id: $id) {
                id
                title
                isbn
                publication_year
                genre
                description
                total_copies
                author_id
            }
        }
    `, { id: bookId }).then(bookData => {
        const book = bookData.book;
        
        // Charger la liste des auteurs
        graphqlRequest(`query { authors { id name } }`).then(authorsData => {
            const authors = authorsData.authors || [];
            const authorOptions = authors.map(a => 
                `<option value="${a.id}" ${a.id === book.author_id ? 'selected' : ''}>${a.name}</option>`
            ).join('');
            
            const content = `
                <h3>Modifier le livre</h3>
                <form id="editBookForm">
                    <div class="form-group">
                        <label>Titre</label>
                        <input type="text" id="editBookTitle" value="${book.title}" required>
                    </div>
                    <div class="form-group">
                        <label>ISBN</label>
                        <input type="text" id="editBookIsbn" value="${book.isbn || ''}">
                    </div>
                    <div class="form-group">
                        <label>Auteur</label>
                        <select id="editBookAuthor" required>${authorOptions}</select>
                    </div>
                    <div class="form-group">
                        <label>Année de publication</label>
                        <input type="number" id="editBookYear" value="${book.publication_year || ''}">
                    </div>
                    <div class="form-group">
                        <label>Genre</label>
                        <input type="text" id="editBookGenre" value="${book.genre || ''}">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="editBookDescription" rows="3">${book.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Nombre d'exemplaires</label>
                        <input type="number" id="editBookCopies" value="${book.total_copies}" min="1" required>
                    </div>
                    <button type="submit" class="btn btn-warning">Modifier</button>
                </form>
            `;
            showModal(content);
            document.getElementById('editBookForm').onsubmit = (e) => updateBook(e, bookId);
        });
    });
}

// Mettre à jour un livre
async function updateBook(event, bookId) {
    event.preventDefault();
    
    const title = document.getElementById('editBookTitle').value;
    const isbn = document.getElementById('editBookIsbn').value;
    const author_id = parseInt(document.getElementById('editBookAuthor').value);
    const year = document.getElementById('editBookYear').value;
    const genre = document.getElementById('editBookGenre').value;
    const description = document.getElementById('editBookDescription').value;
    const copies = document.getElementById('editBookCopies').value;
    
    try {
        const data = await graphqlRequest(`
            mutation UpdateBook($id: ID!, $input: BookInput!) {
                updateBook(id: $id, input: $input) {
                    id
                    title
                }
            }
        `, {
            id: bookId,
            input: {
                title,
                isbn: isbn || null,
                author_id,
                publication_year: year ? parseInt(year) : null,
                genre: genre || null,
                description: description || null,
                total_copies: parseInt(copies)
            }
        });
        
        showNotification(`Livre "${data.updateBook.title}" modifié avec succès !`, 'success');
        closeModal();
        loadBooks();
    } catch (error) {
        showNotification('Erreur lors de la modification: ' + error.message, 'error');
    }
}

// Supprimer un livre
async function deleteBook(bookId, bookTitle) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le livre "${bookTitle}" ?`)) {
        return;
    }
    
    try {
        const data = await graphqlRequest(`
            mutation DeleteBook($id: ID!) {
                deleteBook(id: $id)
            }
        `, {
            id: bookId
        });
        
        if (data.deleteBook) {
            showNotification(`Livre "${bookTitle}" supprimé avec succès !`, 'success');
            loadBooks();
        } else {
            showNotification('Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        showNotification('Erreur lors de la suppression: ' + error.message, 'error');
    }
}

// Modifier un auteur
function showEditAuthorForm(authorId) {
    // Récupérer les données de l'auteur
    graphqlRequest(`
        query GetAuthor($id: ID!) {
            author(id: $id) {
                id
                name
                biography
                birth_date
            }
        }
    `, { id: authorId }).then(authorData => {
        const author = authorData.author;
        const birthDate = author.birth_date ? author.birth_date.split('T')[0] : '';
        
        const content = `
            <h3>Modifier l'auteur</h3>
            <form id="editAuthorForm">
                <div class="form-group">
                    <label>Nom</label>
                    <input type="text" id="editAuthorName" value="${author.name}" required>
                </div>
                <div class="form-group">
                    <label>Biographie</label>
                    <textarea id="editAuthorBio" rows="3">${author.biography || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Date de naissance</label>
                    <input type="date" id="editAuthorBirth" value="${birthDate}">
                </div>
                <button type="submit" class="btn btn-warning">Modifier</button>
            </form>
        `;
        showModal(content);
        document.getElementById('editAuthorForm').onsubmit = (e) => updateAuthor(e, authorId);
    });
}

// Mettre à jour un auteur
async function updateAuthor(event, authorId) {
    event.preventDefault();
    
    const name = document.getElementById('editAuthorName').value;
    const bio = document.getElementById('editAuthorBio').value;
    const birth = document.getElementById('editAuthorBirth').value;
    
    try {
        const data = await graphqlRequest(`
            mutation UpdateAuthor($id: ID!, $input: AuthorInput!) {
                updateAuthor(id: $id, input: $input) {
                    id
                    name
                }
            }
        `, {
            id: authorId,
            input: {
                name,
                biography: bio || null,
                birth_date: birth || null
            }
        });
        
        showNotification(`Auteur "${data.updateAuthor.name}" modifié avec succès !`, 'success');
        closeModal();
        loadAuthors();
    } catch (error) {
        showNotification('Erreur lors de la modification: ' + error.message, 'error');
    }
}

// Supprimer un auteur
async function deleteAuthor(authorId, authorName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'auteur "${authorName}" ?`)) {
        return;
    }
    
    try {
        const data = await graphqlRequest(`
            mutation DeleteAuthor($id: ID!) {
                deleteAuthor(id: $id)
            }
        `, {
            id: authorId
        });
        
        if (data.deleteAuthor) {
            showNotification(`Auteur "${authorName}" supprimé avec succès !`, 'success');
            loadAuthors();
        } else {
            showNotification('Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        showNotification('Erreur lors de la suppression: ' + error.message, 'error');
    }
}

// Ajouter un utilisateur
function showAddUserForm() {
    const content = `
        <h3>Ajouter un utilisateur</h3>
        <form id="addUserForm">
            <div class="form-group">
                <label>Nom d'utilisateur</label>
                <input type="text" id="addUserUsername" required>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="addUserEmail" required>
            </div>
            <div class="form-group">
                <label>Mot de passe</label>
                <input type="password" id="addUserPassword" required>
            </div>
            <div class="form-group">
                <label>Rôle</label>
                <select id="addUserRole" required>
                    <option value="user">Utilisateur</option>
                    <option value="admin">Administrateur</option>
                </select>
            </div>
            <button type="submit" class="btn btn-success">Ajouter</button>
        </form>
    `;
    showModal(content);
    document.getElementById('addUserForm').onsubmit = addUser;
}

// Créer un utilisateur
async function addUser(event) {
    event.preventDefault();
    
    const username = document.getElementById('addUserUsername').value;
    const email = document.getElementById('addUserEmail').value;
    const password = document.getElementById('addUserPassword').value;
    const role = document.getElementById('addUserRole').value;
    
    try {
        const data = await graphqlRequest(`
            mutation CreateUser($input: UserCreateInput!) {
                createUser(input: $input) {
                    id
                    username
                    email
                    role
                }
            }
        `, {
            input: { username, email, password, role }
        });
        
        showNotification(`Utilisateur "${data.createUser.username}" créé avec succès !`, 'success');
        closeModal();
        loadUsers();
    } catch (error) {
        showNotification('Erreur lors de la création: ' + error.message, 'error');
    }
}

// Modifier un utilisateur
function showEditUserForm(userId) {
    // Récupérer les données de l'utilisateur
    graphqlRequest(`
        query GetUser($id: ID!) {
            user(id: $id) {
                id
                username
                email
                role
            }
        }
    `, { id: userId }).then(userData => {
        const user = userData.user;
        
        const content = `
            <h3>Modifier l'utilisateur</h3>
            <form id="editUserForm">
                <div class="form-group">
                    <label>Nom d'utilisateur</label>
                    <input type="text" id="editUserUsername" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="editUserEmail" value="${user.email}" required>
                </div>
                <div class="form-group">
                    <label>Rôle</label>
                    <select id="editUserRole" required>
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>Utilisateur</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrateur</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                    <input type="password" id="editUserPassword">
                </div>
                <button type="submit" class="btn btn-warning">Modifier</button>
            </form>
        `;
        showModal(content);
        document.getElementById('editUserForm').onsubmit = (e) => updateUser(e, userId);
    });
}

// Mettre à jour un utilisateur
async function updateUser(event, userId) {
    event.preventDefault();
    
    const username = document.getElementById('editUserUsername').value;
    const email = document.getElementById('editUserEmail').value;
    const role = document.getElementById('editUserRole').value;
    const password = document.getElementById('editUserPassword').value;
    
    try {
        const input = {
            username,
            email,
            role
        };
        
        // Ajouter le mot de passe seulement s'il est fourni
        if (password.trim()) {
            input.password = password;
        }
        
        const data = await graphqlRequest(`
            mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
                updateUser(id: $id, input: $input) {
                    id
                    username
                    email
                    role
                }
            }
        `, {
            id: userId,
            input: input
        });
        
        showNotification(`Utilisateur "${data.updateUser.username}" modifié avec succès !`, 'success');
        closeModal();
        loadUsers();
    } catch (error) {
        showNotification('Erreur lors de la modification: ' + error.message, 'error');
    }
}

// Supprimer un utilisateur
async function deleteUser(userId, userName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ?`)) {
        return;
    }
    
    try {
        const data = await graphqlRequest(`
            mutation DeleteUser($id: ID!) {
                deleteUser(id: $id)
            }
        `, {
            id: userId
        });
        
        if (data.deleteUser) {
            showNotification(`Utilisateur "${userName}" supprimé avec succès !`, 'success');
            loadUsers();
        } else {
            showNotification('Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        showNotification('Erreur lors de la suppression: ' + error.message, 'error');
    }
}

function attachHomeStatsListeners() {
    const statBooks = document.querySelector('.stat-books');
    const statUsers = document.querySelector('.stat-users');
    const statLoans = document.querySelector('.stat-loans');
    const statAuthors = document.querySelector('.stat-authors');
    
    if (statBooks) statBooks.onclick = () => showSection('books');
    if (statUsers) statUsers.onclick = () => showSection('users');
    if (statLoans) statLoans.onclick = () => showSection('loans');
    if (statAuthors) statAuthors.onclick = () => showSection('authors');
}