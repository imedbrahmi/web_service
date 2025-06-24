const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const { initDatabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware de sécurité
app.use(helmet());
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));

// Créer le serveur Apollo
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Ici vous pouvez ajouter l'authentification JWT si nécessaire
    return { req };
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
            
            <h2>🔍 Queries disponibles</h2>
            
            <div class="query">
                <h3>Récupérer tous les livres</h3>
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
            
            <div class="query">
                <h3>Rechercher des livres</h3>
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
            
            <div class="query">
                <h3>Récupérer les emprunts actifs</h3>
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
            
            <h2>✏️ Mutations disponibles</h2>
            
            <div class="mutation">
                <h3>Créer un auteur</h3>
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
            
            <div class="mutation">
                <h3>Créer un livre</h3>
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
            
            <div class="mutation">
                <h3>Emprunter un livre</h3>
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
            
            <div class="mutation">
                <h3>Retourner un livre</h3>
                <pre><code>mutation {
  returnBook(loanId: "1") {
    id
    return_date
    status
  }
}</code></pre>
            </div>
            
            <div class="mutation">
                <h3>S'inscrire</h3>
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
            
            <div class="mutation">
                <h3>Se connecter</h3>
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