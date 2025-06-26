const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get, all } = require('../database/db');

const JWT_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

// Fonction de vérification d'autorisation admin
const requireAdmin = (context) => {
  if (!context.user) {
    throw new Error('Authentification requise');
  }
  
  // Récupérer les détails complets de l'utilisateur depuis la base de données
  const user = get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [context.user.userId]);
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }
  
  if (user.role !== 'admin') {
    throw new Error('Autorisation admin requise');
  }
  
  return user;
};

const resolvers = {
  Query: {
    // Auteurs
    authors: () => {
      return all('SELECT * FROM authors ORDER BY name');
    },
    
    author: (_, { id }) => {
      return get('SELECT * FROM authors WHERE id = ?', [id]);
    },

    // Livres
    books: () => {
      return all(`
        SELECT b.*, a.name as author_name 
        FROM books b 
        LEFT JOIN authors a ON b.author_id = a.id 
        ORDER BY b.title
      `);
    },

    book: (_, { id }) => {
      return get(`
        SELECT b.*, a.name as author_name 
        FROM books b 
        LEFT JOIN authors a ON b.author_id = a.id 
        WHERE b.id = ?
      `, [id]);
    },

    booksByAuthor: (_, { authorId }) => {
      return all('SELECT * FROM books WHERE author_id = ?', [authorId]);
    },

    searchBooks: (_, { query }) => {
      return all(`
        SELECT b.*, a.name as author_name 
        FROM books b 
        LEFT JOIN authors a ON b.author_id = a.id 
        WHERE b.title LIKE ? OR a.name LIKE ?
      `, [`%${query}%`, `%${query}%`]);
    },

    // Utilisateurs
    users: () => {
      return all('SELECT id, username, email, role, created_at FROM users');
    },

    user: (_, { id }) => {
      return get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [id]);
    },

    // Emprunts
    loans: () => {
      return all(`
        SELECT l.*, u.username, b.title 
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        JOIN books b ON l.book_id = b.id
        ORDER BY l.loan_date DESC
      `);
    },

    loan: (_, { id }) => {
      return get(`
        SELECT l.*, u.username, b.title 
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        JOIN books b ON l.book_id = b.id 
        WHERE l.id = ?
      `, [id]);
    },

    userLoans: (_, { userId }) => {
      return all(`
        SELECT l.*, u.username, b.title 
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        JOIN books b ON l.book_id = b.id 
        WHERE l.user_id = ?
        ORDER BY l.loan_date DESC
      `, [userId]);
    },

    activeLoans: () => {
      return all(`
        SELECT l.*, u.username, b.title 
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        JOIN books b ON l.book_id = b.id 
        WHERE l.status = 'active'
        ORDER BY l.loan_date DESC
      `);
    }
  },

  Mutation: {
    // Auteurs
    createAuthor: (_, { input }) => {
      const result = run(
        'INSERT INTO authors (name, biography, birth_date) VALUES (?, ?, ?)',
        [input.name, input.biography, input.birth_date]
      );
      return get('SELECT * FROM authors WHERE id = ?', [result.lastInsertRowid]);
    },

    updateAuthor: (_, { id, input }) => {
      run(
        'UPDATE authors SET name = ?, biography = ?, birth_date = ? WHERE id = ?',
        [input.name, input.biography, input.birth_date, id]
      );
      return get('SELECT * FROM authors WHERE id = ?', [id]);
    },

    deleteAuthor: (_, { id }) => {
      const result = run('DELETE FROM authors WHERE id = ?', [id]);
      return result.changes > 0;
    },

    // Livres
    createBook: (_, { input }) => {
      const result = run(
        'INSERT INTO books (title, isbn, author_id, publication_year, genre, description, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [input.title, input.isbn, input.author_id, input.publication_year, input.genre, input.description, input.total_copies, input.total_copies]
      );
      return get('SELECT * FROM books WHERE id = ?', [result.lastInsertRowid]);
    },

    updateBook: (_, { id, input }) => {
      run(
        'UPDATE books SET title = ?, isbn = ?, author_id = ?, publication_year = ?, genre = ?, description = ?, total_copies = ? WHERE id = ?',
        [input.title, input.isbn, input.author_id, input.publication_year, input.genre, input.description, input.total_copies, id]
      );
      return get('SELECT * FROM books WHERE id = ?', [id]);
    },

    deleteBook: (_, { id }) => {
      const result = run('DELETE FROM books WHERE id = ?', [id]);
      return result.changes > 0;
    },

    // Utilisateurs
    register: (_, { input }) => {
      const existingUser = get('SELECT * FROM users WHERE email = ?', [input.email]);
      if (existingUser) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      const passwordHash = bcrypt.hashSync(input.password, 10);
      const result = run(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [input.username, input.email, passwordHash, 'user']
      );
      
      const user = get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      return { token, user };
    },

    login: (_, { input }) => {
      const user = get('SELECT * FROM users WHERE email = ?', [input.email]);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const validPassword = bcrypt.compareSync(input.password, user.password_hash);
      if (!validPassword) {
        throw new Error('Mot de passe incorrect');
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      const { password_hash, ...userWithoutPassword } = user;
      userWithoutPassword.role = user.role;
      return { token, user: userWithoutPassword };
    },

    createUser: (_, { input }, context) => {
      // Vérifier l'autorisation admin
      requireAdmin(context);
      
      // Vérifier si l'email existe déjà
      const existingUser = get('SELECT * FROM users WHERE email = ?', [input.email]);
      if (existingUser) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      const passwordHash = bcrypt.hashSync(input.password, 10);
      const result = run(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [input.username, input.email, passwordHash, input.role || 'user']
      );
      
      return get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    },

    updateUser: (_, { id, input }, context) => {
      // Vérifier l'autorisation admin
      requireAdmin(context);
      
      // Vérifier si l'utilisateur existe
      const existingUser = get('SELECT * FROM users WHERE id = ?', [id]);
      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Préparer les champs à mettre à jour
      const updates = [];
      const values = [];

      if (input.username) {
        updates.push('username = ?');
        values.push(input.username);
      }

      if (input.email) {
        updates.push('email = ?');
        values.push(input.email);
      }

      if (input.role) {
        updates.push('role = ?');
        values.push(input.role);
      }

      if (input.password) {
        const passwordHash = bcrypt.hashSync(input.password, 10);
        updates.push('password_hash = ?');
        values.push(passwordHash);
      }

      if (updates.length === 0) {
        throw new Error('Aucun champ à mettre à jour');
      }

      values.push(id);
      run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

      return get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [id]);
    },

    deleteUser: (_, { id }, context) => {
      // Vérifier l'autorisation admin
      requireAdmin(context);
      
      // Vérifier si l'utilisateur existe
      const existingUser = get('SELECT * FROM users WHERE id = ?', [id]);
      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier s'il a des emprunts actifs
      const activeLoans = get('SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND status = "active"', [id]);
      if (activeLoans.count > 0) {
        throw new Error('Impossible de supprimer un utilisateur avec des emprunts actifs');
      }

      const result = run('DELETE FROM users WHERE id = ?', [id]);
      return result.changes > 0;
    },

    // Emprunts
    borrowBook: (_, { userId, bookId, loanDate, dueDate }) => {
      // Vérifier si le livre est disponible
      const book = get('SELECT * FROM books WHERE id = ?', [bookId]);
      if (!book) {
        throw new Error('Livre non trouvé');
      }
      if (book.available_copies <= 0) {
        throw new Error('Aucune copie disponible');
      }

      // Déterminer les dates
      let loanDateObj = loanDate ? new Date(loanDate) : new Date();
      let dueDateObj = dueDate ? new Date(dueDate) : new Date(loanDateObj.getTime() + 14 * 24 * 60 * 60 * 1000);

      // Créer l'emprunt
      const result = run(
        'INSERT INTO loans (user_id, book_id, loan_date, due_date) VALUES (?, ?, ?, ?)',
        [userId, bookId, loanDateObj.toISOString(), dueDateObj.toISOString()]
      );

      // Mettre à jour le nombre de copies disponibles
      run(
        'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
        [bookId]
      );

      return get(`
        SELECT l.*, u.username, b.title 
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        JOIN books b ON l.book_id = b.id 
        WHERE l.id = ?
      `, [result.lastInsertRowid]);
    },

    returnBook: (_, { loanId }) => {
      // Récupérer l'emprunt
      const loan = get('SELECT * FROM loans WHERE id = ?', [loanId]);
      if (!loan) {
        throw new Error('Emprunt non trouvé');
      }
      if (loan.status === 'returned') {
        throw new Error('Livre déjà retourné');
      }

      // Marquer comme retourné
      run(
        'UPDATE loans SET return_date = ?, status = ? WHERE id = ?',
        [new Date().toISOString(), 'returned', loanId]
      );

      // Mettre à jour le nombre de copies disponibles
      run(
        'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
        [loan.book_id]
      );

      return get(`
        SELECT l.*, u.username, b.title 
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        JOIN books b ON l.book_id = b.id 
        WHERE l.id = ?
      `, [loanId]);
    }
  },

  // Resolvers pour les relations
  Author: {
    books: (parent) => {
      return all('SELECT * FROM books WHERE author_id = ?', [parent.id]);
    }
  },

  Book: {
    author: (parent) => {
      return get('SELECT * FROM authors WHERE id = ?', [parent.author_id]);
    },
    loans: (parent) => {
      return all('SELECT * FROM loans WHERE book_id = ?', [parent.id]);
    }
  },

  User: {
    loans: (parent) => {
      return all('SELECT * FROM loans WHERE user_id = ?', [parent.id]);
    }
  },

  Loan: {
    user: (parent) => {
      return get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [parent.user_id]);
    },
    book: (parent) => {
      return get('SELECT * FROM books WHERE id = ?', [parent.book_id]);
    }
  }
};

module.exports = resolvers; 