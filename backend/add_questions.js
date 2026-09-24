const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function addQuestions() {
  const dbPath = path.resolve(__dirname, 'src', 'database.sqlite');
  console.log('Opening database at:', dbPath);
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  const newQuestions = [
    ["What does HTML stand for?", "Hyper Text Markup Language", "High Text Markup Language", "Hyper Tabular Markup Language", "None of these", 15, null],
    ["Which programming language is known as the language of the web?", "Python", "C++", "JavaScript", "Java", 15, null],
    ["What does CSS stand for?", "Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets", 15, null],
    ["Which SQL statement is used to extract data from a database?", "EXTRACT", "SELECT", "GET", "OPEN", 15, null],
    ["What is the main function of a DNS?", "Translate domain names to IP addresses", "Store website files", "Secure internet connections", "Host databases", 20, null],
    ["Which data structure uses LIFO (Last In First Out)?", "Queue", "Tree", "Graph", "Stack", 20, null],
    ["In Git, what command is used to save changes to the local repository?", "git push", "git save", "git commit", "git add", 20, null],
    ["What does API stand for?", "Application Programming Interface", "Automated Programming Interface", "Application Process Integration", "Automated Process Interface", 20, null],
    ["Which HTTP method is typically used to create a new resource?", "GET", "PUT", "POST", "DELETE", 15, null],
    ["What is the time complexity of searching in a balanced binary search tree?", "O(1)", "O(n)", "O(log n)", "O(n^2)", 20, null],
    ["Which protocol is used for secure communication over the internet?", "HTTP", "FTP", "HTTPS", "SMTP", 15, null],
    ["What is the purpose of Docker?", "Database management", "Containerization", "Version control", "Code editing", 20, null],
    ["Which of the following is a NoSQL database?", "MySQL", "PostgreSQL", "MongoDB", "Oracle", 15, null],
    ["What does JSON stand for?", "JavaScript Object Notation", "JavaScript Online Network", "Java Standard Object Notation", "Java Sequential Object Network", 15, null],
    ["Which design pattern restricts a class to a single instance?", "Factory", "Observer", "Singleton", "Decorator", 20, null],
    ["What is the primary purpose of React.js?", "Backend development", "Building user interfaces", "Database querying", "Server management", 20, null],
    ["In networking, what does LAN stand for?", "Local Area Network", "Large Area Network", "Logical Area Network", "Linked Area Network", 15, null],
    ["Which sorting algorithm has the best average-case time complexity?", "Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort", 20, null],
    ["What does MVC stand for in software architecture?", "Model View Controller", "Module View Component", "Model Visual Controller", "Module Visual Component", 20, null],
    ["Which keyword in JavaScript is used to declare variables with block scope?", "var", "let", "function", "global", 15, null]
  ];

  // Get current max order
  const maxOrderRow = await db.get('SELECT MAX(question_order) as max_order FROM questions');
  let currentOrder = maxOrderRow.max_order || 0;

  let addedCount = 0;
  for (const q of newQuestions) {
    currentOrder++;
    await db.run(
      'INSERT INTO questions (question, option_a, option_b, option_c, option_d, time_limit, question_order, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [q[0], q[1], q[2], q[3], q[4], q[5], currentOrder, q[6]]
    );
    addedCount++;
  }

  console.log(`Successfully added ${addedCount} technical questions!`);
  await db.close();
}

addQuestions().catch(console.error);
