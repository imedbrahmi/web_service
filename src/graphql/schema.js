const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Author {
    id: ID!
    name: String!
    biography: String
    birth_date: String
    created_at: String!
    books: [Book!]
  }

  type Book {
    id: ID!
    title: String!
    isbn: String
    author: Author
    author_id: Int
    publication_year: Int
    genre: String
    description: String
    available_copies: Int!
    total_copies: Int!
    created_at: String!
    loans: [Loan!]
  }

  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    created_at: String!
    loans: [Loan!]
  }

  type Loan {
    id: ID!
    user: User!
    user_id: Int!
    book: Book!
    book_id: Int!
    loan_date: String!
    return_date: String
    due_date: String
    status: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input AuthorInput {
    name: String!
    biography: String
    birth_date: String
  }

  input BookInput {
    title: String!
    isbn: String
    author_id: Int!
    publication_year: Int
    genre: String
    description: String
    total_copies: Int = 1
  }

  input UserInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type Query {
    # Auteurs
    authors: [Author!]!
    author(id: ID!): Author
    
    # Livres
    books: [Book!]!
    book(id: ID!): Book
    booksByAuthor(authorId: ID!): [Book!]!
    searchBooks(query: String!): [Book!]!
    
    # Utilisateurs
    users: [User!]!
    user(id: ID!): User
    
    # Emprunts
    loans: [Loan!]!
    loan(id: ID!): Loan
    userLoans(userId: ID!): [Loan!]!
    activeLoans: [Loan!]!
  }

  type Mutation {
    # Auteurs
    createAuthor(input: AuthorInput!): Author!
    updateAuthor(id: ID!, input: AuthorInput!): Author!
    deleteAuthor(id: ID!): Boolean!
    
    # Livres
    createBook(input: BookInput!): Book!
    updateBook(id: ID!, input: BookInput!): Book!
    deleteBook(id: ID!): Boolean!
    
    # Utilisateurs
    register(input: UserInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    
    # Emprunts
    borrowBook(userId: ID!, bookId: ID!): Loan!
    returnBook(loanId: ID!): Loan!
  }
`;

module.exports = typeDefs; 