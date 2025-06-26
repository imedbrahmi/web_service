# 📚 Système de Gestion de Bibliothèque - GraphQL

## 🎯 Vue d'ensemble du projet

Ce projet implémente un système complet de gestion de bibliothèque utilisant **GraphQL** comme API moderne, avec une architecture full-stack JavaScript. Le système permet la gestion des livres, auteurs, utilisateurs et emprunts avec une interface web intuitive.

## 🏗️ Architecture technique

### Stack technologique
- **Backend** : Node.js + Express + Apollo Server
- **Base de données** : SQLite avec SQLite3
- **API** : GraphQL (Apollo Server)
- **Frontend** : HTML5 + CSS3 + JavaScript vanilla
- **Authentification** : JWT (JSON Web Tokens)
- **Sécurité** : bcrypt pour le hachage des mots de passe

### Structure du projet
```
webservice/
├── src/
│   ├── server.js          # Serveur Express + Apollo
│   ├── database/
│   │   ├── db.js          # Configuration SQLite
│   │   └── init.js        # Initialisation DB + données de test
│   └── graphql/
│       ├── schema.js      # Schéma GraphQL
│       └── resolvers.js   # Résolveurs GraphQL
├── public/
│   ├── index.html         # Interface utilisateur
│   ├── app.js            # Logique frontend
│   └── styles.css        # Styles CSS
└── database/
    └── bibliotheque.db   # Base de données SQLite
```

## 🔧 Installation et démarrage

### Prérequis
- Node.js (version 14 ou supérieure)
- npm

### Installation
```bash
# Cloner le projet
git clone [url-du-repo]

# Installer les dépendances
npm install

# Démarrer le serveur
npm start
```

### Accès
- **Interface web** : http://localhost:4000
- **GraphQL Playground** : http://localhost:4000/graphql
- **Base de données** : `database/bibliotheque.db`

## 📊 Schéma GraphQL

### Types principaux

#### Book (Livre)
```graphql
type Book {
  id: ID!
  title: String!
  isbn: String
  publication_year: Int
  genre: String
  description: String
  total_copies: Int!
  available_copies: Int!
  author: Author
  created_at: String!
}
```

#### Author (Auteur)
```graphql
type Author {
  id: ID!
  name: String!
  biography: String
  birth_date: String
  created_at: String!
}
```

#### User (Utilisateur)
```graphql
type User {
  id: ID!
  username: String!
  email: String!
  role: UserRole!
  created_at: String!
}
```

#### Loan (Emprunt)
```graphql
type Loan {
  id: ID!
  user: User!
  book: Book!
  loan_date: String!
  due_date: String
  return_date: String
  status: LoanStatus!
}
```

### Mutations principales

#### Authentification
```graphql
mutation Register($input: UserInput!) {
  register(input: $input) {
    token
    user { id username email role }
  }
}

mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user { id username email role }
  }
}
```

#### Gestion des livres
```graphql
mutation CreateBook($input: BookInput!) {
  createBook(input: $input) {
    id title author { name }
  }
}

mutation UpdateBook($id: ID!, $input: BookInput!) {
  updateBook(id: $id, input: $input) {
    id title
  }
}

mutation DeleteBook($id: ID!) {
  deleteBook(id: $id)
}
```

#### Gestion des emprunts
```graphql
mutation BorrowBook($userId: ID!, $bookId: ID!, $loanDate: String, $dueDate: String) {
  borrowBook(userId: $userId, bookId: $bookId, loanDate: $loanDate, dueDate: $dueDate) {
    id book { title } loan_date due_date
  }
}

mutation ReturnBook($loanId: ID!) {
  returnBook(loanId: $loanId) {
    id return_date status
  }
}
```

## 🔐 Système d'authentification

### Rôles utilisateurs
- **Admin** : Accès complet (CRUD livres/auteurs, gestion emprunts)
- **User** : Emprunt/retour de livres, consultation catalogue

### Sécurité
- **JWT** pour l'authentification des sessions
- **bcrypt** pour le hachage sécurisé des mots de passe
- **Middleware d'authentification** pour protéger les routes sensibles
- **Validation des tokens** côté client et serveur

### Persistance de session
- Stockage du token JWT dans localStorage
- Validation automatique au chargement de la page
- Restauration de session après rafraîchissement

## 🎨 Interface utilisateur

### Fonctionnalités principales

#### Page d'accueil
- Statistiques globales (admin uniquement)
- Navigation intuitive
- Affichage du statut de connexion

#### Catalogue de livres
- Liste complète des livres avec filtres
- Recherche par titre/auteur
- Affichage de la disponibilité en temps réel
- Boutons d'action contextuels selon le rôle

#### Gestion des auteurs
- Liste des auteurs avec biographies
- CRUD complet pour les administrateurs
- Interface modale pour ajout/modification

#### Gestion des emprunts
- Vue personnalisée selon le rôle
- Historique des emprunts
- Actions de retour pour les utilisateurs
- Gestion complète pour les administrateurs

### Responsive Design
- Interface adaptative (desktop/mobile)
- Modals pour les actions importantes
- Notifications en temps réel
- Navigation fluide entre les sections

## 🗄️ Base de données

### Tables principales
```sql
-- Livres
CREATE TABLE books (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  isbn TEXT,
  publication_year INTEGER,
  genre TEXT,
  description TEXT,
  total_copies INTEGER NOT NULL DEFAULT 1,
  author_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Auteurs
CREATE TABLE authors (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  biography TEXT,
  birth_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Utilisateurs
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Emprunts
CREATE TABLE loans (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  loan_date DATE NOT NULL,
  due_date DATE,
  return_date DATE,
  status TEXT NOT NULL DEFAULT 'active'
);
```

### Données de test
Le système inclut des données de test pour :
- 5 livres populaires
- 3 auteurs reconnus
- 2 utilisateurs (admin + user)
- Emprunts d'exemple

## 🔄 Fonctionnalités avancées

### Gestion des emprunts
- **Vérification de disponibilité** en temps réel
- **Calcul automatique** des dates de retour
- **Prévention des emprunts multiples** du même livre
- **Interface intuitive** avec confirmation modale

### Recherche et filtrage
- **Recherche textuelle** dans les titres et auteurs
- **Filtrage par disponibilité**
- **Tri dynamique** des résultats

### Notifications système
- **Messages de succès/erreur** en temps réel
- **Validation des formulaires**
- **Feedback utilisateur** pour toutes les actions

## 🚀 Points forts du projet

### 1. Architecture GraphQL moderne
- **API unifiée** pour toutes les opérations
- **Requêtes optimisées** avec sélection de champs
- **Introspection** pour la documentation automatique
- **Playground GraphQL** intégré pour les tests

### 2. Sécurité robuste
- **Authentification JWT** sécurisée
- **Hachage bcrypt** des mots de passe
- **Validation des données** côté serveur
- **Protection CSRF** via tokens

### 3. Interface utilisateur intuitive
- **Design responsive** moderne
- **Navigation fluide** entre les sections
- **Modals contextuels** pour les actions importantes
- **Feedback visuel** pour toutes les interactions

### 4. Gestion d'état avancée
- **Persistance de session** après rafraîchissement
- **Synchronisation** entre les vues
- **Mise à jour en temps réel** des données
- **Gestion des erreurs** robuste

## 🧪 Tests et validation

### Tests manuels effectués
- ✅ Création/modification/suppression de livres
- ✅ Gestion des auteurs (CRUD)
- ✅ Système d'authentification (inscription/connexion)
- ✅ Emprunt et retour de livres
- ✅ Gestion des rôles (admin/user)
- ✅ Recherche et filtrage
- ✅ Interface responsive
- ✅ Persistance de session

### Validation des fonctionnalités
- **Emprunts multiples** : Prévention des doublons
- **Disponibilité** : Mise à jour en temps réel
- **Sécurité** : Protection des routes sensibles
- **Performance** : Requêtes GraphQL optimisées

## 📈 Améliorations possibles

### Fonctionnalités futures
- **Système de réservation** pour les livres indisponibles
- **Notifications par email** pour les retards
- **Statistiques avancées** et rapports
- **API REST** en complément de GraphQL
- **Tests automatisés** avec Jest
- **Dockerisation** pour le déploiement

### Optimisations techniques
- **Pagination** pour les grandes listes
- **Cache Redis** pour les requêtes fréquentes
- **Upload d'images** pour les livres
- **Export PDF** des emprunts
- **Logs système** avancés

## 🎓 Réponses aux questions fréquentes

### Q: Pourquoi GraphQL plutôt que REST ?
**R:** GraphQL offre une API plus flexible avec :
- Requêtes optimisées (pas de sur-fetching)
- Schéma fortement typé
- Documentation automatique
- Évolution plus facile de l'API

### Q: Comment gérez-vous la sécurité ?
**R:** Multiples niveaux de sécurité :
- JWT pour l'authentification
- bcrypt pour le hachage des mots de passe
- Validation des données côté serveur
- Middleware d'authentification

### Q: Comment fonctionne la gestion des emprunts ?
**R:** Système complet avec :
- Vérification de disponibilité en temps réel
- Prévention des emprunts multiples
- Calcul automatique des dates de retour
- Interface utilisateur intuitive

### Q: Quelle est l'architecture de la base de données ?
**R:** SQLite avec relations normalisées :
- Tables séparées pour livres, auteurs, utilisateurs, emprunts
- Clés étrangères pour les relations
- Index pour optimiser les performances

## 📞 Support et maintenance

### Démarrage rapide
```bash
npm install
npm start
```

### Accès aux interfaces
- **Web** : http://localhost:4000
- **GraphQL** : http://localhost:4000/graphql

### Comptes de test
- **Admin** : admin@test.com / password123
- **User** : user@test.com / password123

---

**Développé avec ❤️ pour le cours de Services Web - GraphQL** 

# 📚 Application de Gestion de Bibliothèque - GraphQL

Application complète de gestion de bibliothèque utilisant GraphQL avec Node.js, Express, Apollo Server et SQLite.

## 🚀 Installation et Démarrage

### Prérequis
- Node.js (version 14 ou supérieure)
- npm ou yarn

### Installation
```bash
# Cloner le projet
git clone <url-du-repo>
cd webservice

# Installer les dépendances
npm install

# Initialiser la base de données
npm run init-db

# Démarrer le serveur
npm start
```

### Accès
- **Interface Web** : http://localhost:4000
- **GraphQL Playground** : http://localhost:4000/graphql
- **Documentation API** : http://localhost:4000/api

## 🔐 Authentification et Autorisation

### Utilisateurs de Test
L'application inclut des utilisateurs de test pré-configurés :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `admin@bibliotheque.com` | `password123` | Admin |
| `john@example.com` | `password123` | Utilisateur |
| `jane@example.com` | `password123` | Utilisateur |

### Mutations Protégées (Admin uniquement)
Certaines mutations nécessitent une authentification admin :

- `createUser` - Créer un nouvel utilisateur
- `updateUser` - Modifier un utilisateur existant  
- `deleteUser` - Supprimer un utilisateur

### Utilisation avec Token Admin

1. **Se connecter en tant qu'admin** :
```graphql
mutation {
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
}
```

2. **Utiliser le token dans les en-têtes** :
```bash
# Dans GraphQL Playground ou client GraphQL
Headers: {
  "Authorization": "Bearer <votre-token-jwt>"
}
```

3. **Créer un utilisateur (admin uniquement)** :
```graphql
mutation {
  createUser(input: {
    username: "nouveau_user"
    email: "nouveau@example.com"
    password: "motdepasse123"
    role: "user"
  }) {
    id
    username
    email
    role
  }
}
```

### Gestion des Erreurs d'Autorisation
- **"Authentification requise"** : Token manquant ou invalide
- **"Autorisation admin requise"** : Utilisateur connecté mais pas admin

## 📊 Fonctionnalités

### 🔍 Queries Disponibles
- **Livres** : `books`, `book(id)`, `searchBooks(query)`, `booksByAuthor(authorId)`
- **Auteurs** : `authors`, `author(id)`
- **Utilisateurs** : `users`, `user(id)` (admin uniquement)
- **Emprunts** : `loans`, `loan(id)`, `userLoans(userId)`, `activeLoans`

### ✏️ Mutations Disponibles
- **Authentification** : `register`, `login`
- **Livres** : `createBook`, `updateBook`, `deleteBook`
- **Auteurs** : `createAuthor`, `updateAuthor`, `deleteAuthor`
- **Utilisateurs** : `createUser`, `updateUser`, `deleteUser` (admin uniquement)
- **Emprunts** : `borrowBook`, `returnBook`

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS)
    ↓
Express.js Server (Port 4000)
    ↓
├── GraphQL API (/graphql)
├── Static Files (/public)
├── REST API (/api/me)
└── Database (SQLite)
```

## 🔧 Technologies Utilisées

- **Backend** : Node.js, Express.js, Apollo Server
- **Base de données** : SQLite
- **Authentification** : JWT (JSON Web Tokens)
- **Sécurité** : bcryptjs, Helmet, CORS
- **Frontend** : HTML5, CSS3, JavaScript vanilla

## 📁 Structure du Projet

```
webservice/
├── src/
│   ├── server.js          # Serveur Express + Apollo
│   ├── graphql/
│   │   ├── schema.js      # Schéma GraphQL
│   │   └── resolvers.js   # Résolveurs GraphQL
│   └── database/
│       ├── db.js          # Configuration DB
│       └── init.js        # Initialisation DB
├── public/
│   ├── index.html         # Interface web
│   ├── app.js            # Logique frontend
│   └── styles.css        # Styles CSS
├── database/
│   └── bibliotheque.db   # Base de données SQLite
└── package.json
```

## 🛡️ Sécurité

- **Authentification JWT** : Tokens sécurisés avec expiration
- **Hachage des mots de passe** : bcryptjs avec salt
- **Autorisation par rôle** : Admin vs Utilisateur
- **Protection des en-têtes** : Helmet.js
- **CORS configuré** : Contrôle des requêtes cross-origin

## 🚀 Déploiement

### Variables d'Environnement
```bash
PORT=4000                    # Port du serveur
JWT_SECRET=votre-secret      # Secret JWT (à changer en production)
```

### Production
```bash
# Build et démarrage
npm start

# Ou avec PM2
npm install -g pm2
pm2 start src/server.js --name "bibliotheque-graphql"
```

## 📝 Exemples d'Utilisation

### Recherche de Livres
```graphql
query {
  searchBooks(query: "Harry Potter") {
    id
    title
    author {
      name
    }
    available_copies
  }
}
```

### Emprunter un Livre
```graphql
mutation {
  borrowBook(userId: "2", bookId: "1") {
    id
    book {
      title
    }
    due_date
  }
}
```

### Retourner un Livre
```graphql
mutation {
  returnBook(loanId: "1") {
    id
    return_date
    status
  }
}
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 