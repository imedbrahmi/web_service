# 📚 Bibliothèque GraphQL

Une application complète de gestion de bibliothèque utilisant **GraphQL** avec Node.js, Express et SQLite.

## 🚀 Fonctionnalités

- ✅ **Gestion des auteurs** : Ajout, modification, suppression
- ✅ **Gestion des livres** : Catalogue complet avec ISBN, genre, description
- ✅ **Système d'emprunts** : Emprunt et retour de livres avec dates
- ✅ **Authentification** : Inscription et connexion sécurisées
- ✅ **Recherche** : Recherche de livres par titre ou auteur
- ✅ **Interface GraphQL** : Playground interactif pour tester l'API
- ✅ **Base de données SQLite** : Simple et portable

## 🛠️ Technologies utilisées

- **Backend** : Node.js, Express
- **API** : GraphQL avec Apollo Server
- **Base de données** : SQLite
- **Authentification** : JWT + bcrypt
- **Sécurité** : Helmet, CORS

## 📦 Installation

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd webservice
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Initialiser la base de données**
```bash
npm run init-db
```

4. **Démarrer le serveur**
```bash
npm start
```

Pour le développement avec rechargement automatique :
```bash
npm run dev
```

## 🌐 Accès à l'application

- **Interface principale** : http://localhost:4000
- **GraphQL Playground** : http://localhost:4000/graphql
- **Documentation API** : http://localhost:4000/api

## 📊 Données de test

L'application est livrée avec des données de test :

### 👥 Utilisateurs
- **Admin** : admin@bibliotheque.com / password123
- **John** : john@example.com / password123
- **Jane** : jane@example.com / password123

### 📚 Livres inclus
- Harry Potter à l'école des sorciers
- Harry Potter et la Chambre des secrets
- Le Trône de fer
- Ça (Stephen King)
- Le Crime de l'Orient-Express

### ✍️ Auteurs
- J.K. Rowling
- George R.R. Martin
- Stephen King
- Agatha Christie

## 🔧 Utilisation de l'API GraphQL

### Exemples de requêtes

#### Récupérer tous les livres
```graphql
query {
  books {
    id
    title
    isbn
    author {
      name
    }
    available_copies
    genre
  }
}
```

#### Rechercher des livres
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

#### Récupérer les emprunts actifs
```graphql
query {
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
}
```

### Exemples de mutations

#### Créer un auteur
```graphql
mutation {
  createAuthor(input: {
    name: "Victor Hugo"
    biography: "Auteur français du 19ème siècle"
    birth_date: "1802-02-26"
  }) {
    id
    name
  }
}
```

#### Créer un livre
```graphql
mutation {
  createBook(input: {
    title: "Les Misérables"
    isbn: "9782070413111"
    author_id: 5
    publication_year: 1862
    genre: "Roman"
    description: "Un chef-d'œuvre de la littérature française"
    total_copies: 2
  }) {
    id
    title
    available_copies
  }
}
```

#### Emprunter un livre
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

#### Retourner un livre
```graphql
mutation {
  returnBook(loanId: "1") {
    id
    return_date
    status
  }
}
```

#### S'inscrire
```graphql
mutation {
  register(input: {
    username: "nouveau_utilisateur"
    email: "nouveau@example.com"
    password: "motdepasse123"
  }) {
    token
    user {
      id
      username
    }
  }
}
```

#### Se connecter
```graphql
mutation {
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
}
```

## 🏗️ Structure du projet

```
webservice/
├── src/
│   ├── database/
│   │   ├── db.js          # Configuration base de données
│   │   └── init.js        # Script d'initialisation
│   ├── graphql/
│   │   ├── schema.js      # Schéma GraphQL
│   │   └── resolvers.js   # Resolvers GraphQL
│   └── server.js          # Serveur principal
├── database/
│   └── bibliotheque.db    # Base de données SQLite
├── package.json
└── README.md
```

## 🔒 Sécurité

- **Mots de passe** : Hashés avec bcrypt
- **JWT** : Tokens d'authentification sécurisés
- **CORS** : Configuration sécurisée
- **Helmet** : Headers de sécurité HTTP

## 🚀 Déploiement

### Variables d'environnement
Créez un fichier `.env` à la racine :
```env
PORT=4000
JWT_SECRET=votre-secret-jwt-super-securise
```

### Production
```bash
npm install --production
npm start
```

## 📝 API Endpoints

### GraphQL
- **POST** `/graphql` - Endpoint GraphQL principal
- **GET** `/graphql` - GraphQL Playground

### REST (Pages)
- **GET** `/` - Page d'accueil
- **GET** `/api` - Documentation API

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez que toutes les dépendances sont installées
2. Assurez-vous que le port 4000 est disponible
3. Vérifiez les logs du serveur pour les erreurs
4. Consultez la documentation GraphQL dans `/graphql`

## 🎯 Fonctionnalités futures

- [ ] Interface utilisateur React/Vue.js
- [ ] Notifications par email
- [ ] Système de réservation
- [ ] Gestion des amendes
- [ ] Statistiques d'utilisation
- [ ] Export de données
- [ ] API REST en complément

---

**Développé avec ❤️ pour l'apprentissage de GraphQL** 