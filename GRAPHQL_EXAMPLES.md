# 🔍 Exemples de Requêtes GraphQL - Démonstration

## 📚 Requêtes de base

### 1. Récupérer tous les livres
```graphql
query {
  books {
    id
    title
    isbn
    publication_year
    genre
    available_copies
    total_copies
    author {
      name
      biography
    }
  }
}
```

### 2. Récupérer un livre spécifique
```graphql
query {
  book(id: "1") {
    title
    description
    author {
      name
      birth_date
    }
    available_copies
  }
}
```

### 3. Rechercher des livres
```graphql
query SearchBooks($query: String!) {
  searchBooks(query: $query) {
    title
    author {
      name
    }
    available_copies
  }
}
```
**Variables :**
```json
{
  "query": "Harry Potter"
}
```

## 👥 Requêtes d'authentification

### 4. Inscription d'un utilisateur
```graphql
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
```
**Variables :**
```json
{
  "input": {
    "username": "nouveau_user",
    "email": "user@test.com",
    "password": "password123"
  }
}
```

### 5. Connexion
```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user {
      id
      username
      role
    }
  }
}
```
**Variables :**
```json
{
  "input": {
    "email": "admin@test.com",
    "password": "password123"
  }
}
```

## 📖 Gestion des emprunts

### 6. Emprunter un livre
```graphql
mutation BorrowBook($userId: ID!, $bookId: ID!, $loanDate: String, $dueDate: String) {
  borrowBook(userId: $userId, bookId: $bookId, loanDate: $loanDate, dueDate: $dueDate) {
    id
    book {
      title
      author {
        name
      }
    }
    loan_date
    due_date
    status
  }
}
```
**Variables :**
```json
{
  "userId": "1",
  "bookId": "1",
  "loanDate": "2024-01-15",
  "dueDate": "2024-01-29"
}
```

### 7. Retourner un livre
```graphql
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
```
**Variables :**
```json
{
  "loanId": "1"
}
```

### 8. Voir les emprunts d'un utilisateur
```graphql
query UserLoans($userId: ID!) {
  userLoans(userId: $userId) {
    id
    book {
      title
      author {
        name
      }
    }
    loan_date
    due_date
    return_date
    status
  }
}
```

## 🔧 Gestion admin (CRUD)

### 9. Créer un nouveau livre
```graphql
mutation CreateBook($input: BookInput!) {
  createBook(input: $input) {
    id
    title
    author {
      name
    }
    available_copies
  }
}
```
**Variables :**
```json
{
  "input": {
    "title": "Le Petit Prince",
    "isbn": "9782070612758",
    "author_id": 1,
    "publication_year": 1943,
    "genre": "Roman philosophique",
    "description": "Un conte poétique et philosophique",
    "total_copies": 3
  }
}
```

### 10. Modifier un livre
```graphql
mutation UpdateBook($id: ID!, $input: BookInput!) {
  updateBook(id: $id, input: $input) {
    id
    title
    description
    available_copies
  }
}
```
**Variables :**
```json
{
  "id": "1",
  "input": {
    "title": "Harry Potter à l'école des sorciers - Édition spéciale",
    "description": "La première aventure de Harry Potter avec des illustrations"
  }
}
```

### 11. Supprimer un livre
```graphql
mutation DeleteBook($id: ID!) {
  deleteBook(id: $id)
}
```
**Variables :**
```json
{
  "id": "5"
}
```

### 12. Créer un auteur
```graphql
mutation CreateAuthor($input: AuthorInput!) {
  createAuthor(input: $input) {
    id
    name
    biography
  }
}
```
**Variables :**
```json
{
  "input": {
    "name": "J.K. Rowling",
    "biography": "Auteure britannique célèbre pour la série Harry Potter",
    "birth_date": "1965-07-31"
  }
}
```

## 📊 Requêtes de statistiques

### 13. Statistiques globales (admin)
```graphql
query {
  books {
    id
  }
  users {
    id
  }
  activeLoans {
    id
    book {
      title
    }
    user {
      username
    }
  }
}
```

### 14. Livres par auteur
```graphql
query {
  authors {
    name
    books {
      title
      available_copies
    }
  }
}
```

## 🎯 Requêtes complexes

### 15. Emprunts en retard
```graphql
query {
  loans {
    id
    book {
      title
    }
    user {
      username
    }
    due_date
    status
  }
}
```

### 16. Livres les plus populaires
```graphql
query {
  books {
    title
    total_copies
    available_copies
    loans {
      id
    }
  }
}
```

## 🔍 Utilisation du GraphQL Playground

### Comment tester ces requêtes :

1. **Ouvrir** http://localhost:4000/graphql
2. **Coller** une requête dans l'éditeur
3. **Ajouter** les variables dans le panneau "Query Variables"
4. **Cliquer** sur le bouton play ▶️

### Exemple de test complet :

1. **D'abord, se connecter :**
```graphql
mutation {
  login(input: {email: "admin@test.com", password: "password123"}) {
    token
    user { username role }
  }
}
```

2. **Copier le token** et l'ajouter dans les headers :
```json
{
  "Authorization": "Bearer [TOKEN_RECU]"
}
```

3. **Tester une requête protégée :**
```graphql
mutation {
  createBook(input: {
    title: "Livre de test",
    author_id: 1,
    total_copies: 2
  }) {
    id
    title
  }
}
```

## 💡 Conseils pour la démonstration

### Ordre recommandé :
1. **Requêtes simples** (books, authors)
2. **Authentification** (login/register)
3. **Emprunts** (borrow/return)
4. **CRUD admin** (create/update/delete)
5. **Requêtes complexes** (statistiques)

### Points à souligner :
- ✅ **Une seule URL** pour toutes les requêtes
- ✅ **Sélection précise** des champs
- ✅ **Relations automatiques** (book → author)
- ✅ **Validation** automatique des types
- ✅ **Documentation** intégrée

### Erreurs courantes à montrer :
```graphql
# Erreur : champ inexistant
query {
  books {
    title
    invalidField  # ❌ Erreur GraphQL
  }
}

# Erreur : type incorrect
mutation {
  createBook(input: {
    title: 123  # ❌ String attendu, Int reçu
  }) {
    id
  }
}
```

**Ces exemples vous permettront de démontrer efficacement la puissance et la flexibilité de GraphQL ! 🚀** 