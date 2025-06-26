const bcrypt = require('bcryptjs');
const { initDatabase, run, get } = require('./db');

async function seedDatabase() {
  try {
    console.log('🌱 Initialisation de la base de données...');
    initDatabase();

    // Vérifier si des données existent déjà
    const existingAuthors = get('SELECT COUNT(*) as count FROM authors');
    if (existingAuthors.count > 0) {
      console.log('✅ La base de données contient déjà des données');
      return;
    }

    console.log('📚 Ajout des auteurs...');
    
    // Ajouter des auteurs
    const authors = [
      {
        name: 'J.K. Rowling',
        biography: 'Auteur britannique célèbre pour la série Harry Potter',
        birth_date: '1965-07-31'
      },
      {
        name: 'George R.R. Martin',
        biography: 'Auteur américain de fantasy, créateur de Game of Thrones',
        birth_date: '1948-09-20'
      },
      {
        name: 'Stephen King',
        biography: 'Maître du roman d\'horreur et de suspense',
        birth_date: '1947-09-21'
      },
      {
        name: 'Agatha Christie',
        biography: 'Reine du roman policier',
        birth_date: '1890-09-15'
      }
    ];

    for (const author of authors) {
      run(
        'INSERT INTO authors (name, biography, birth_date) VALUES (?, ?, ?)',
        [author.name, author.biography, author.birth_date]
      );
    }

    console.log('📖 Ajout des livres...');
    
    // Ajouter des livres
    const books = [
      {
        title: 'Harry Potter à l\'école des sorciers',
        isbn: '9782070541270',
        author_id: 1,
        publication_year: 1997,
        genre: 'Fantasy',
        description: 'Le premier tome de la série Harry Potter',
        total_copies: 5
      },
      {
        title: 'Harry Potter et la Chambre des secrets',
        isbn: '9782070541287',
        author_id: 1,
        publication_year: 1998,
        genre: 'Fantasy',
        description: 'Le deuxième tome de la série Harry Potter',
        total_copies: 3
      },
      {
        title: 'Le Trône de fer',
        isbn: '9782253151224',
        author_id: 2,
        publication_year: 1996,
        genre: 'Fantasy',
        description: 'Le premier tome de la série A Song of Ice and Fire',
        total_copies: 4
      },
      {
        title: 'Ça',
        isbn: '9782253003608',
        author_id: 3,
        publication_year: 1986,
        genre: 'Horreur',
        description: 'Un roman d\'horreur de Stephen King',
        total_copies: 2
      },
      {
        title: 'Le Crime de l\'Orient-Express',
        isbn: '9782226132688',
        author_id: 4,
        publication_year: 1934,
        genre: 'Policier',
        description: 'Un classique du roman policier',
        total_copies: 3
      }
    ];

    for (const book of books) {
      run(
        'INSERT INTO books (title, isbn, author_id, publication_year, genre, description, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [book.title, book.isbn, book.author_id, book.publication_year, book.genre, book.description, book.total_copies, book.total_copies]
      );
    }

    console.log('👥 Ajout des utilisateurs...');
    
    // Ajouter des utilisateurs
    const passwordHash = bcrypt.hashSync('password123', 10);
    const users = [
      {
        username: 'admin',
        email: 'admin@bibliotheque.com',
        password_hash: passwordHash,
        role: 'admin'
      },
      {
        username: 'john_doe',
        email: 'john@example.com',
        password_hash: passwordHash,
        role: 'user'
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password_hash: passwordHash,
        role: 'user'
      }
    ];

    for (const user of users) {
      run(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [user.username, user.email, user.password_hash, user.role]
      );
    }

    console.log('📋 Ajout d\'emprunts de test...');
    
    // Ajouter quelques emprunts de test
    const loans = [
      {
        user_id: 2,
        book_id: 1,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
      },
      {
        user_id: 3,
        book_id: 3,
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 jours
      }
    ];

    for (const loan of loans) {
      run(
        'INSERT INTO loans (user_id, book_id, due_date) VALUES (?, ?, ?)',
        [loan.user_id, loan.book_id, loan.due_date]
      );
      
      // Mettre à jour le nombre de copies disponibles
      run(
        'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
        [loan.book_id]
      );
    }

    console.log('✅ Base de données initialisée avec succès !');
    console.log('\n📊 Données ajoutées :');
    console.log('- 4 auteurs');
    console.log('- 5 livres');
    console.log('- 3 utilisateurs');
    console.log('- 2 emprunts actifs');
    console.log('\n🔑 Identifiants de test :');
    console.log('- Email: admin@bibliotheque.com, Password: password123');
    console.log('- Email: john@example.com, Password: password123');
    console.log('- Email: jane@example.com, Password: password123');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase; 