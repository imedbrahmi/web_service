const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get, all } = require('../database/db');

const JWT_SECRET = 'votre-secret-jwt-super-securise';

// Fonction de vérification d'autorisation admin
const requireAdmin = async (context) => {
  if (!context.user) {
    throw new Error('Authentification requise');
  }
  
  // Récupérer les détails complets de l'utilisateur depuis la base de données
  const user = await get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [context.user.userId]);
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
    authors: async () => {
      return await all('SELECT * FROM authors ORDER BY name');
    },
    
    author: async (_, { id }) => {
      return await get('SELECT * FROM authors WHERE id = ?', [id]);
    },

    // Livres
    books: async () => {
      return await all(`
        SELECT b.*, a.name as author_name 
        FROM books b 
        LEFT JOIN authors a ON b.author_id = a.id 
        ORDER BY b.title
      `);
    },

    book: async (_, { id }) => {
      return await get(`
        SELECT b.*, a.name as author_name 
        FROM books b 
        LEFT JOIN authors a ON b.author_id = a.id 
        WHERE b.id = ?
      `, [id]);
    },

    booksByAuthor: async (_, { authorId }) => {
      return await all('SELECT * FROM books WHERE author_id = ?', [authorId]);
    },

    searchBooks: async (_, { query }) => {
      return await all(`
        SELECT b.*, a.name as author_name 
        FROM books b 
        LEFT JOIN authors a ON b.author_id = a.id 
        WHERE b.title LIKE ? OR a.name LIKE ?
      `, [`%${query}%`, `%${query}%`]);
    },

    // Utilisateurs
    users: async () => {
      return await all('SELECT id, username, email, role, created_at FROM users');
    },

    user: async (_, { id }) => {
      return await get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [id]);
    },

    // Emprunts
    loans: async () => {
      return await all(`
        SELECT l.*, u.username, b.title 
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        JOIN books b ON l.book_id = b.id
        ORDER BY l.loan_date DESC
      `);
    },

    loan: async (_, { id }) => {
      return await get(`
        SELECT l.*, u.username, b.title 
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        JOIN books b ON l.book_id = b.id 
        WHERE l.id = ?
      `, [id]);
    },

    userLoans: async (_, { userId }) => {
      return await all(`
        SELECT l.*, u.username, b.title 
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        JOIN books b ON l.book_id = b.id 
        WHERE l.user_id = ?
        ORDER BY l.loan_date DESC
      `, [userId]);
    },

    activeLoans: async () => {
      return await all(`
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
    createAuthor: async (_, { input }) => {
      const result = await run(
        'INSERT INTO authors (name, biography, birth_date) VALUES (?, ?, ?)',
        [input.name, input.biography, input.birth_date]
      );
      return await get('SELECT * FROM authors WHERE id = ?', [result.id]);
    },

    updateAuthor: async (_, { id, input }) => {
      await run(
        'UPDATE authors SET name = ?, biography = ?, birth_date = ? WHERE id = ?',
        [input.name, input.biography, input.birth_date, id]
      );
      return await get('SELECT * FROM authors WHERE id = ?', [id]);
    },

    deleteAuthor: async (_, { id }) => {
      const result = await run('DELETE FROM authors WHERE id = ?', [id]);
      return result.changes > 0;
    },

    // Livres
    createBook: async (_, { input }) => {
      const result = await run(
        'INSERT INTO books (title, isbn, author_id, publication_year, genre, description, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [input.title, input.isbn, input.author_id, input.publication_year, input.genre, input.description, input.total_copies, input.total_copies]
      );
      return await get('SELECT * FROM books WHERE id = ?', [result.id]);
    },

    updateBook: async (_, { id, input }) => {
      await run(
        'UPDATE books SET title = ?, isbn = ?, author_id = ?, publication_year = ?, genre = ?, description = ?, total_copies = ? WHERE id = ?',
        [input.title, input.isbn, input.author_id, input.publication_year, input.genre, input.description, input.total_copies, id]
      );
      return await get('SELECT * FROM books WHERE id = ?', [id]);
    },

    deleteBook: async (_, { id }) => {
      const result = await run('DELETE FROM books WHERE id = ?', [id]);
      return result.changes > 0;
    },

    // Utilisateurs
    register: async (_, { input }) => {
      const existingUser = await get('SELECT * FROM users WHERE email = ?', [input.email]);
      if (existingUser) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const result = await run(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [input.username, input.email, passwordHash, 'user']
      );
      
      const user = await get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [result.id]);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      return { token, user };
    },

    login: async (_, { input }) => {
      const user = await get('SELECT * FROM users WHERE email = ?', [input.email]);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const validPassword = await bcrypt.compare(input.password, user.password_hash);
      if (!validPassword) {
        throw new Error('Mot de passe incorrect');
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      const { password_hash, ...userWithoutPassword } = user;
      userWithoutPassword.role = user.role;
      return { token, user: userWithoutPassword };
    },

    createUser: async (_, { input }, context) => {
      // Vérifier l'autorisation admin
      await requireAdmin(context);
      
      // Vérifier si l'email existe déjà
      const existingUser = await get('SELECT * FROM users WHERE email = ?', [input.email]);
      if (existingUser) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const result = await run(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [input.username, input.email, passwordHash, input.role || 'user']
      );
      
      return await get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [result.id]);
    },

    updateUser: async (_, { id, input }, context) => {
      // Vérifier l'autorisation admin
      await requireAdmin(context);
      
      // Vérifier si l'utilisateur existe
      const existingUser = await get('SELECT * FROM users WHERE id = ?', [id]);
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
        const passwordHash = await bcrypt.hash(input.password, 10);
        updates.push('password_hash = ?');
        values.push(passwordHash);
      }

      if (updates.length === 0) {
        throw new Error('Aucun champ à mettre à jour');
      }

      values.push(id);
      await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

      return await get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [id]);
    },

    deleteUser: async (_, { id }, context) => {
      // Vérifier l'autorisation admin
      await requireAdmin(context);
      
      // Vérifier si l'utilisateur existe
      const existingUser = await get('SELECT * FROM users WHERE id = ?', [id]);
      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier s'il a des emprunts actifs
      const activeLoans = await get('SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND status = "active"', [id]);
      if (activeLoans.count > 0) {
        throw new Error('Impossible de supprimer un utilisateur avec des emprunts actifs');
      }

      const result = await run('DELETE FROM users WHERE id = ?', [id]);
      return result.changes > 0;
    },

    // Emprunts
    borrowBook: async (_, { userId, bookId, loanDate, dueDate }) => {
      // Vérifier si le livre est disponible
      const book = await get('SELECT * FROM books WHERE id = ?', [bookId]);
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
      const result = await run(
        'INSERT INTO loans (user_id, book_id, loan_date, due_date) VALUES (?, ?, ?, ?)',
        [userId, bookId, loanDateObj.toISOString(), dueDateObj.toISOString()]
      );

      // Mettre à jour le nombre de copies disponibles
      await run(
        'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
        [bookId]
      );

      return await get(`
        SELECT l.*, u.username, b.title 
        FROM loans l 
        JOIN users u ON l.user_id = u.id 
        JOIN books b ON l.book_id = b.id 
        WHERE l.id = ?
      `, [result.id]);
    },

    returnBook: async (_, { loanId }) => {
      // Récupérer l'emprunt
      const loan = await get('SELECT * FROM loans WHERE id = ?', [loanId]);
      if (!loan) {
        throw new Error('Emprunt non trouvé');
      }
      if (loan.status === 'returned') {
        throw new Error('Livre déjà retourné');
      }

      // Marquer comme retourné
      await run(
        'UPDATE loans SET return_date = ?, status = ? WHERE id = ?',
        [new Date().toISOString(), 'returned', loanId]
      );

      // Mettre à jour le nombre de copies disponibles
      await run(
        'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
        [loan.book_id]
      );

      return await get(`
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
    books: async (parent) => {
      return await all('SELECT * FROM books WHERE author_id = ?', [parent.id]);
    }
  },

  Book: {
    author: async (parent) => {
      return await get('SELECT * FROM authors WHERE id = ?', [parent.author_id]);
    },
    loans: async (parent) => {
      return await all('SELECT * FROM loans WHERE book_id = ?', [parent.id]);
    }
  },

  User: {
    loans: async (parent) => {
      return await all('SELECT * FROM loans WHERE user_id = ?', [parent.id]);
    }
  },

  Loan: {
    user: async (parent) => {
      return await get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [parent.user_id]);
    },
    book: async (parent) => {
      return await get('SELECT * FROM books WHERE id = ?', [parent.book_id]);
    }
  }
};

module.exports = resolvers; 