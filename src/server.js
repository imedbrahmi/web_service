const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const jwt = require('jsonwebtoken');

const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const { initDatabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware de sécurité
app.use(helmet());
app.use(cors());
app.use(express.json());

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next();
  }

  jwt.verify(token, 'votre-secret-jwt-super-securise', (err, user) => {
    if (err) {
      console.log('Token invalide:', err.message);
      return next();
    }
    req.user = user;
    next();
  });
};

app.use(authenticateToken);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// Route de test pour vérifier l'authentification
app.get('/api/me', (req, res) => {
  if (req.user) {
    res.json({ 
      authenticated: true, 
      userId: req.user.userId,
      message: 'Token valide'
    });
  } else {
    res.status(401).json({ 
      authenticated: false, 
      message: 'Token manquant ou invalide' 
    });
  }
});

// Créer le serveur Apollo
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Ajouter l'utilisateur au contexte si authentifié
    return {
      user: req.user,
      isAuthenticated: !!req.user
    };
  },
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return {
      message: error.message,
      path: error.path
    };
  }
});

// Fonction pour démarrer le serveur
async function startServer() {
  try {
    // Initialiser la base de données
    await initDatabase();
    console.log('✅ Base de données initialisée');

    // Démarrer Apollo Server
    await server.start();
    server.applyMiddleware({ app });

    // Démarrer le serveur Express
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📚 GraphQL Playground: http://localhost:${PORT}${server.graphqlPath}`);
      console.log(`🌐 Interface web: http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Route de base
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bibliothèque GraphQL</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 15px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            h1 {
                text-align: center;
                margin-bottom: 30px;
                font-size: 2.5em;
            }
            .links {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            .link-card {
                background: rgba(255, 255, 255, 0.2);
                padding: 20px;
                border-radius: 10px;
                text-decoration: none;
                color: white;
                transition: transform 0.3s ease;
            }
            .link-card:hover {
                transform: translateY(-5px);
                background: rgba(255, 255, 255, 0.3);
            }
            .link-card h3 {
                margin: 0 0 10px 0;
            }
            .link-card p {
                margin: 0;
                opacity: 0.9;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📚 Bibliothèque GraphQL</h1>
            <p style="text-align: center; font-size: 1.2em; margin-bottom: 30px;">
                Application de gestion de bibliothèque avec API GraphQL
            </p>
            
            <div class="links">
                <a href="/graphql" class="link-card">
                    <h3>🔧 GraphQL Playground</h3>
                    <p>Interface interactive pour tester l'API GraphQL</p>
                </a>
                
                <a href="/api" class="link-card">
                    <h3>📖 Documentation API</h3>
                    <p>Guide d'utilisation des requêtes et mutations</p>
                </a>
            </div>
            
            <div style="margin-top: 40px; text-align: center;">
                <h3>🚀 Fonctionnalités disponibles :</h3>
                <ul style="text-align: left; display: inline-block;">
                    <li>Gestion des auteurs et livres</li>
                    <li>Système d'emprunts et retours</li>
                    <li>Authentification des utilisateurs</li>
                    <li>Recherche de livres</li>
                    <li>Suivi des emprunts actifs</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Route pour la documentation API
app.get('/api', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Documentation API - Bibliothèque GraphQL</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 1000px;
                margin: 0 auto;
                padding: 20px;
                background: #f5f5f5;
                color: #333;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1, h2, h3 {
                color: #2c3e50;
            }
            .query, .mutation {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin: 10px 0;
                border-left: 4px solid #007bff;
            }
            .mutation {
                border-left-color: #28a745;
            }
            code {
                background: #2d3748;
                color: #fff;
                padding: 2px 5px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
            }
            pre {
                background: #2d3748;
                color: #fff;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📚 Documentation API GraphQL</h1>
            
            <!-- Section d'introduction -->
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="margin-top: 0; color: #1976d2;">ℹ️ Guide d'utilisation</h3>
                <p>Cette API GraphQL permet de gérer une bibliothèque complète avec des livres, auteurs, utilisateurs et emprunts. 
                Utilisez GraphQL Playground pour tester les requêtes et mutations interactivement.</p>
                <p><strong>Endpoint GraphQL :</strong> <code>/graphql</code></p>
            </div>
            
            <h2>🔍 Queries disponibles</h2>
            <p style="color: #666; margin-bottom: 20px;">Les queries permettent de récupérer des données sans les modifier.</p>
            
            <!-- Query: Récupérer tous les livres -->
            <div class="query">
                <h3>📖 Récupérer tous les livres</h3>
                <p style="color: #666; font-size: 0.9em;">Récupère la liste complète des livres avec leurs informations de base et l'auteur associé.</p>
                <pre><code>query {
  books {
    id
    title
    isbn
    author {
      name
    }
    available_copies
  }
}</code></pre>
            </div>
            
            <!-- Query: Rechercher des livres -->
            <div class="query">
                <h3>🔎 Rechercher des livres</h3>
                <p style="color: #666; font-size: 0.9em;">Recherche des livres par titre ou nom d'auteur. La recherche est insensible à la casse.</p>
                <pre><code>query {
  searchBooks(query: "Harry Potter") {
    id
    title
    author {
      name
    }
  }
}</code></pre>
            </div>
            
            <!-- Query: Emprunts actifs -->
            <div class="query">
                <h3>📋 Récupérer les emprunts actifs</h3>
                <p style="color: #666; font-size: 0.9em;">Liste tous les emprunts en cours (non retournés) avec les détails de l'utilisateur et du livre.</p>
                <pre><code>query {
  activeLoans {
    id
    user {
      username
    }
    book {
      title
    }
    loan_date
    due_date
  }
}</code></pre>
            </div>
            
            <!-- Query: Liste des auteurs -->
            <div class="query">
                <h3>✍️ Liste de tous les auteurs</h3>
                <p style="color: #666; font-size: 0.9em;">Récupère tous les auteurs avec leurs informations biographiques.</p>
                <pre><code>query {
  authors {
    id
    name
    biography
    birth_date
    created_at
  }
}</code></pre>
            </div>
            
            <!-- Query: Détail d'un auteur -->
            <div class="query">
                <h3>👤 Détail d'un auteur</h3>
                <p style="color: #666; font-size: 0.9em;">Récupère les détails d'un auteur spécifique avec la liste de tous ses livres.</p>
                <pre><code>query {
  author(id: 1) {
    id
    name
    biography
    birth_date
    created_at
    books {
      id
      title
    }
  }
}</code></pre>
            </div>
            
            <!-- Query: Détail d'un livre -->
            <div class="query">
                <h3>📚 Détail d'un livre</h3>
                <p style="color: #666; font-size: 0.9em;">Récupère toutes les informations d'un livre spécifique avec son auteur.</p>
                <pre><code>query {
  book(id: 1) {
    id
    title
    isbn
    author {
      name
    }
    publication_year
    genre
    description
    available_copies
    total_copies
    created_at
  }
}</code></pre>
            </div>
            
            <!-- Query: Livres d'un auteur -->
            <div class="query">
                <h3>📚 Livres d'un auteur</h3>
                <p style="color: #666; font-size: 0.9em;">Récupère tous les livres écrits par un auteur spécifique.</p>
                <pre><code>query {
  booksByAuthor(authorId: 1) {
    id
    title
    genre
    available_copies
  }
}</code></pre>
            </div>
            
            <!-- Query: Liste des utilisateurs (Admin) -->
            <div class="query" style="border-left: 4px solid #ff9800; background: #fff8e1;">
                <h3>👥 Liste de tous les utilisateurs</h3>
                <p style="color: #666; font-size: 0.9em;">⚠️ <strong>Réservé aux administrateurs</strong> - Récupère la liste de tous les utilisateurs inscrits.</p>
                <pre><code>query {
  users {
    id
    username
    email
    role
    created_at
  }
}</code></pre>
            </div>
            
            <!-- Query: Détail d'un utilisateur (Admin) -->
            <div class="query" style="border-left: 4px solid #ff9800; background: #fff8e1;">
                <h3>👤 Détail d'un utilisateur</h3>
                <p style="color: #666; font-size: 0.9em;">⚠️ <strong>Réservé aux administrateurs</strong> - Récupère les détails d'un utilisateur spécifique.</p>
                <pre><code>query {
  user(id: 1) {
    id
    username
    email
    role
    created_at
  }
}</code></pre>
            </div>
            
            <!-- Query: Liste des emprunts -->
            <div class="query">
                <h3>📋 Liste de tous les emprunts</h3>
                <p style="color: #666; font-size: 0.9em;">Récupère l'historique complet des emprunts avec les détails des utilisateurs et livres.</p>
                <pre><code>query {
  loans {
    id
    loan_date
    return_date
    due_date
    status
    user { username }
    book { title }
  }
}</code></pre>
            </div>
            
            <!-- Query: Détail d'un emprunt -->
            <div class="query">
                <h3>📋 Détail d'un emprunt</h3>
                <p style="color: #666; font-size: 0.9em;">Récupère les détails complets d'un emprunt spécifique.</p>
                <pre><code>query {
  loan(id: 1) {
    id
    loan_date
    return_date
    due_date
    status
    user { username }
    book { title }
  }
}</code></pre>
            </div>
            
            <!-- Query: Emprunts d'un utilisateur -->
            <div class="query">
                <h3>📋 Emprunts d'un utilisateur</h3>
                <p style="color: #666; font-size: 0.9em;">Récupère l'historique des emprunts d'un utilisateur spécifique.</p>
                <pre><code>query {
  userLoans(userId: 1) {
    id
    loan_date
    return_date
    due_date
    status
    book { title }
  }
}</code></pre>
            </div>
            
            <h2>✏️ Mutations disponibles</h2>
            <p style="color: #666; margin-bottom: 20px;">Les mutations permettent de créer, modifier ou supprimer des données dans la base de données.</p>
            
            <!-- Section Authentification Admin -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #007bff;">
                <h3 style="color: #007bff; margin-top: 0;">🔐 Authentification Admin</h3>
                <p><strong>Certaines mutations nécessitent une authentification admin :</strong></p>
                <ul>
                    <li><code>createUser</code> - Créer un nouvel utilisateur</li>
                    <li><code>updateUser</code> - Modifier un utilisateur existant</li>
                    <li><code>deleteUser</code> - Supprimer un utilisateur</li>
                </ul>
                
                <h4>Comment obtenir un token admin :</h4>
                <pre><code>mutation {
  login(input: {
    email: "admin@bibliotheque.com"
    password: "password123"
  }) {
    token
    user {
      id
      username
      role
    }
  }
}</code></pre>
                
                <h4>Utiliser le token dans les en-têtes :</h4>
                <pre><code>Headers: {
  "Authorization": "Bearer <votre-token-jwt>"
}</code></pre>
                
                <p style="margin-bottom: 0;"><strong>Utilisateurs de test :</strong></p>
                <ul style="margin-bottom: 0;">
                    <li>Admin : <code>admin@bibliotheque.com</code> / <code>password123</code></li>
                    <li>Utilisateur : <code>john@example.com</code> / <code>password123</code></li>
                </ul>
            </div>
            
            <!-- Mutation: Créer un auteur -->
            <div class="mutation">
                <h3>✍️ Créer un auteur</h3>
                <p style="color: #666; font-size: 0.9em;">Ajoute un nouvel auteur à la base de données. Tous les champs sont obligatoires sauf biography et birth_date.</p>
                <pre><code>mutation {
  createAuthor(input: {
    name: "J.K. Rowling"
    biography: "Auteur de Harry Potter"
    birth_date: "1965-07-31"
  }) {
    id
    name
  }
}</code></pre>
            </div>
            
            <!-- Mutation: Créer un livre -->
            <div class="mutation">
                <h3>📖 Créer un livre</h3>
                <p style="color: #666; font-size: 0.9em;">Ajoute un nouveau livre à la bibliothèque. L'auteur doit exister dans la base de données.</p>
                <pre><code>mutation {
  createBook(input: {
    title: "Harry Potter à l'école des sorciers"
    isbn: "9782070541270"
    author_id: 1
    publication_year: 1997
    genre: "Fantasy"
    description: "Le premier tome de la série Harry Potter"
    total_copies: 3
  }) {
    id
    title
    available_copies
  }
}</code></pre>
            </div>
            
            <!-- Mutation: Emprunter un livre -->
            <div class="mutation">
                <h3>📚 Emprunter un livre</h3>
                <p style="color: #666; font-size: 0.9em;">Crée un nouvel emprunt. Vérifie automatiquement la disponibilité du livre et met à jour le stock.</p>
                <pre><code>mutation {
  borrowBook(userId: "1", bookId: "1") {
    id
    book {
      title
    }
    due_date
  }
}</code></pre>
            </div>
            
            <!-- Mutation: Retourner un livre -->
            <div class="mutation">
                <h3>📚 Retourner un livre</h3>
                <p style="color: #666; font-size: 0.9em;">Marque un emprunt comme retourné et incrémente le nombre de copies disponibles.</p>
                <pre><code>mutation {
  returnBook(loanId: "1") {
    id
    return_date
    status
  }
}</code></pre>
            </div>
            
            <!-- Mutation: S'inscrire -->
            <div class="mutation">
                <h3>👤 S'inscrire</h3>
                <p style="color: #666; font-size: 0.9em;">Crée un nouveau compte utilisateur et retourne un token JWT pour l'authentification automatique.</p>
                <pre><code>mutation {
  register(input: {
    username: "john_doe"
    email: "john@example.com"
    password: "password123"
  }) {
    token
    user {
      id
      username
    }
  }
}</code></pre>
            </div>
            
            <!-- Mutation: Se connecter -->
            <div class="mutation">
                <h3>🔑 Se connecter</h3>
                <p style="color: #666; font-size: 0.9em;">Authentifie un utilisateur existant et retourne un token JWT valide pour 24h.</p>
                <pre><code>mutation {
  login(input: {
    email: "john@example.com"
    password: "password123"
  }) {
    token
    user {
      id
      username
    }
  }
}</code></pre>
            </div>
            
            <!-- Mutation: Créer un utilisateur (Administareur) -->
            <div class="mutation" style="border-left: 4px solid #dc3545; background: #fff5f5;">
                <h3>🔒 Créer un utilisateur (Admin uniquement)</h3>
                <p style="color: #dc3545; font-weight: bold; margin-bottom: 10px;">⚠️ Nécessite une authentification admin</p>
                <p style="color: #666; font-size: 0.9em;">Permet à un administrateur de créer un nouveau compte utilisateur avec un rôle spécifique.</p>
                <pre><code>mutation {
  createUser(input: {
    username: "new_user"
    email: "newuser@example.com"
    password: "password123"
    role: "admin"
  }) {
    id
    username
    email
    role
  }
}</code></pre>
            </div>
            
            <!-- Mutation: Modifier un utilisateur (Admin) -->
            <div class="mutation" style="border-left: 4px solid #dc3545; background: #fff5f5;">
                <h3>🔒 Modifier un utilisateur (Admin uniquement)</h3>
                <p style="color: #dc3545; font-weight: bold; margin-bottom: 10px;">⚠️ Nécessite une authentification admin</p>
                <p style="color: #666; font-size: 0.9em;">Modifie les informations d'un utilisateur existant. Seuls les champs fournis seront mis à jour.</p>
                <pre><code>mutation {
  updateUser(id: 1, input: {
    username: "updated_username"
    email: "updated@example.com"
    role: "admin"
    password: "newpassword"
  }) {
    id
    username
    email
    role
  }
}</code></pre>
            </div>
            
            <!-- Mutation: Supprimer un utilisateur (Admin) -->
            <div class="mutation" style="border-left: 4px solid #dc3545; background: #fff5f5;">
                <h3>🔒 Supprimer un utilisateur (Admin uniquement)</h3>
                <p style="color: #dc3545; font-weight: bold; margin-bottom: 10px;">⚠️ Nécessite une authentification admin</p>
                <p style="color: #666; font-size: 0.9em;">Supprime un utilisateur de la base de données. Impossible si l'utilisateur a des emprunts actifs.</p>
                <pre><code>mutation {
  deleteUser(id: 1)
}</code></pre>
            </div>
            
            <!-- Mutation: Modifier un auteur -->
            <div class="mutation">
                <h3>✍️ Modifier un auteur</h3>
                <p style="color: #666; font-size: 0.9em;">Met à jour les informations d'un auteur existant. Tous les champs sont obligatoires.</p>
                <pre><code>mutation {
  updateAuthor(id: 1, input: {
    name: "Nom modifié"
    biography: "Nouvelle bio"
    birth_date: "1980-01-01"
  }) {
    id
    name
    biography
    birth_date
  }
}</code></pre>
            </div>
            
            <!-- Mutation: Supprimer un auteur -->
            <div class="mutation">
                <h3>✍️ Supprimer un auteur</h3>
                <p style="color: #666; font-size: 0.9em;">Supprime un auteur de la base de données. Attention : peut affecter les livres associés.</p>
                <pre><code>mutation {
  deleteAuthor(id: 1)
}</code></pre>
            </div>
            
            <!-- Mutation: Modifier un livre -->
            <div class="mutation">
                <h3>📖 Modifier un livre</h3>
                <p style="color: #666; font-size: 0.9em;">Met à jour les informations d'un livre existant. Seuls les champs fournis seront modifiés.</p>
                <pre><code>mutation {
  updateBook(id: 1, input: {
    title: "Titre modifié"
    genre: "Nouveau genre"
    total_copies: 5
  }) {
    id
    title
    genre
    total_copies
  }
}</code></pre>
            </div>
            
            <!-- Mutation: Supprimer un livre -->
            <div class="mutation">
                <h3>📖 Supprimer un livre</h3>
                <p style="color: #666; font-size: 0.9em;">Supprime un livre de la bibliothèque. Attention : peut affecter les emprunts associés.</p>
                <pre><code>mutation {
  deleteBook(id: 1)
}</code></pre>
            </div>
            
            <!-- Section Informations Utiles -->
            <div style="background: #f1f8e9; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #4caf50;">
                <h3 style="color: #2e7d32; margin-top: 0;">💡 Conseils d'utilisation</h3>
                
                <h4>🔧 GraphQL Playground</h4>
                <p>Utilisez <a href="/graphql" style="color: #4caf50;">GraphQL Playground</a> pour tester les requêtes et mutations de manière interactive. 
                C'est l'outil idéal pour explorer l'API et comprendre les schémas de données.</p>
                
                <h4>🔐 Gestion des Tokens</h4>
                <ul>
                    <li>Les tokens JWT expirent après 24h</li>
                    <li>Stockez le token dans le localStorage pour les applications web</li>
                    <li>Incluez le token dans l'en-tête <code>Authorization: Bearer &lt;token&gt;</code></li>
                </ul>
                
                <h4>⚠️ Gestion des Erreurs</h4>
                <ul>
                    <li><strong>Authentification requise</strong> : Token manquant ou invalide</li>
                    <li><strong>Autorisation admin requise</strong> : Utilisateur connecté mais pas admin</li>
                    <li><strong>Validation des données</strong> : Vérifiez les champs obligatoires</li>
                    <li><strong>Contraintes de base de données</strong> : ISBN unique, emails uniques</li>
                </ul>
                
                <h4>📊 Exemples d'Utilisation Avancée</h4>
                <p><strong>Recherche avec filtres :</strong></p>
                <pre><code>query {
  searchBooks(query: "fantasy") {
    id
    title
    author { name }
    available_copies
    genre
  }
}</code></pre>
                
                <p><strong>Emprunts avec détails complets :</strong></p>
                <pre><code>query {
  activeLoans {
    id
    loan_date
    due_date
    user {
      username
      email
    }
    book {
      title
      author { name }
      isbn
    }
  }
}</code></pre>
            </div>
            
            <!-- Section Structure des Données -->
            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #ff9800;">
                <h3 style="color: #e65100; margin-top: 0;">📋 Structure des Données</h3>
                
                <h4>📚 Livre (Book)</h4>
                <ul>
                    <li><code>id</code> : Identifiant unique</li>
                    <li><code>title</code> : Titre du livre</li>
                    <li><code>isbn</code> : Code ISBN (unique)</li>
                    <li><code>author_id</code> : Référence vers l'auteur</li>
                    <li><code>publication_year</code> : Année de publication</li>
                    <li><code>genre</code> : Genre littéraire</li>
                    <li><code>description</code> : Description du livre</li>
                    <li><code>total_copies</code> : Nombre total d'exemplaires</li>
                    <li><code>available_copies</code> : Exemplaires disponibles</li>
                </ul>
                
                <h4>✍️ Auteur (Author)</h4>
                <ul>
                    <li><code>id</code> : Identifiant unique</li>
                    <li><code>name</code> : Nom de l'auteur</li>
                    <li><code>biography</code> : Biographie (optionnel)</li>
                    <li><code>birth_date</code> : Date de naissance (optionnel)</li>
                </ul>
                
                <h4>👤 Utilisateur (User)</h4>
                <ul>
                    <li><code>id</code> : Identifiant unique</li>
                    <li><code>username</code> : Nom d'utilisateur</li>
                    <li><code>email</code> : Email (unique)</li>
                    <li><code>role</code> : Rôle (user/admin)</li>
                    <li><code>password_hash</code> : Mot de passe haché (non visible)</li>
                </ul>
                
                <h4>📋 Emprunt (Loan)</h4>
                <ul>
                    <li><code>id</code> : Identifiant unique</li>
                    <li><code>user_id</code> : Référence vers l'utilisateur</li>
                    <li><code>book_id</code> : Référence vers le livre</li>
                    <li><code>loan_date</code> : Date d'emprunt</li>
                    <li><code>due_date</code> : Date de retour prévue</li>
                    <li><code>return_date</code> : Date de retour effective (si retourné)</li>
                    <li><code>status</code> : Statut (active/returned)</li>
                </ul>
            </div>
            
            <p style="margin-top: 30px; text-align: center;">
                <a href="/" style="color: #007bff; text-decoration: none;">← Retour à l'accueil</a>
            </p>
        </div>
    </body>
    </html>
  `);
});

// Démarrer le serveur
startServer(); 