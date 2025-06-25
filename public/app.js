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
    document.getElementById('searchBtn').addEventListener('click', searchBooks);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchBooks();
    });

    // Actualiser livres
    document.getElementById('refreshBooksBtn').addEventListener('click', loadBooks);
    // Ajouter livre
    document.getElementById('addBookBtn').addEventListener('click', showAddBookForm);

    // Actualiser auteurs
    document.getElementById('refreshAuthorsBtn').addEventListener('click', loadAuthors);
    // Ajouter auteur
    document.getElementById('addAuthorBtn').addEventListener('click', showAddAuthorForm);

    // Actualiser emprunts
    document.getElementById('refreshLoansBtn').addEventListener('click', loadLoans);
    // (Emprunter un livre via modal, à implémenter si besoin)

    // Tabs Auth
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            showAuthTab(this.getAttribute('data-auth'));
        });
    });

    // Formulaires Auth
    document.getElementById('loginFormEl').addEventListener('submit', login);
    document.getElementById('registerFormEl').addEventListener('submit', register);

    // Déconnexion
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Modal close
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);

    // Bouton Emprunter un livre redirige vers Livres
    document.getElementById('borrowBtn').addEventListener('click', function() {
        showSection('books');
    });
    
    // S'assurer que le bouton borrowBtn fonctionne même s'il est créé dynamiquement
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'borrowBtn') {
            showSection('books');
        }
    });
});

// Navigation
function showSection(sectionId) {
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
    
    // Charger les données selon la section
    switch(sectionId) {
        case 'home':
            loadHomeStats();
            break;
        case 'books':
            loadBooks();
            break;
        case 'authors':
            loadAuthors();
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
        // Si pas connecté ou pas admin, masquer les stats
        if (!currentUser || currentUser.role !== 'admin') {
            document.querySelector('.hero-stats').style.display = 'none';
            return;
        } else {
            document.querySelector('.hero-stats').style.display = 'grid';
        }
        const data = await graphqlRequest(`
            query {
                books { id }
                users { id }
                activeLoans { id }
            }
        `);
        document.getElementById('totalBooks').textContent = data.books.length;
        document.getElementById('totalUsers').textContent = data.users.length;
        document.getElementById('activeLoans').textContent = data.activeLoans.length;
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
                    <button class="btn btn-primary connect-btn" data-section="books">
                        <i class="fas fa-sign-in-alt"></i> Se connecter pour emprunter
                    </button>
                `}
            </div>
        </div>
    `).join('');
    // Ajout des listeners sur les boutons Se connecter
    document.querySelectorAll('.connect-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            redirectAfterLogin = 'books';
            showSection('login');
        });
    });
    // Ajout des listeners sur les boutons Emprunter
    document.querySelectorAll('.borrow-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const bookId = this.getAttribute('data-book-id');
            
            // Vérifier si le bouton est désactivé
            if (this.disabled) {
                showNotification('Ce livre n\'est pas disponible pour l\'emprunt', 'error');
                return;
            }
            
            // Désactiver le bouton immédiatement pour éviter les clics multiples
            this.disabled = true;
            this.textContent = 'Emprunt en cours...';
            
            // Récupérer les infos du livre pour le modal
            const book = books.find(b => b.id == bookId);
            if (!book) {
                this.disabled = false;
                this.textContent = 'Emprunter';
                return;
            }
            
            // Calculer la date d'aujourd'hui et la date de retour par défaut (14 jours)
            const today = new Date().toISOString().split('T')[0];
            const defaultReturn = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            // Afficher le modal de confirmation avec formulaire
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
            
            // Lier le formulaire de confirmation
            document.getElementById('borrowForm').onsubmit = async function(e) {
                e.preventDefault();
                const dateEmprunt = this.dateEmprunt.value;
                const dateRetour = this.dateRetour.value;
                closeModal();
                
                try {
                    await borrowBook(bookId, dateEmprunt, dateRetour);
                    // Le bouton sera mis à jour par loadBooks()
                } catch (error) {
                    // Réactiver le bouton en cas d'erreur
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
                showSection('login');
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
        loansList.innerHTML = '<div class="no-data">Aucun emprunt trouvé</div>';
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
            </div>
        </div>
    `).join('');
    
    // Ajouter les listeners pour les boutons retourner
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
                <h3>Profil de ${currentUser.username}</h3>
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>Rôle:</strong> ${currentUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p>
                <button id="logoutBtn" class="btn btn-danger">Se déconnecter</button>
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
        const borrowBtn = document.getElementById('borrowBtn');
        
        if (currentUser.role === 'admin') {
            if (addBookBtn) addBookBtn.style.display = 'inline-block';
            if (addAuthorBtn) addAuthorBtn.style.display = 'inline-block';
        } else {
            if (addBookBtn) addBookBtn.style.display = 'none';
            if (addAuthorBtn) addAuthorBtn.style.display = 'none';
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
        const borrowBtn = document.getElementById('borrowBtn');
        
        if (addBookBtn) addBookBtn.style.display = 'none';
        if (addAuthorBtn) addAuthorBtn.style.display = 'none';
        if (borrowBtn) borrowBtn.style.display = 'none';
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