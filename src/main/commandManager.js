const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('better-sqlite3');
const EventEmitter = require('events');

class CommandManager extends EventEmitter {
  constructor(store) {
    super();
    this.store = store;
    this.commands = [];
    this.db = null;
    
    // Initialize database
    this._initializeDatabase()
      .then(() => {
        console.log('CommandManager: Database initialized, loading commands...');
        return this._loadCommands();
      })
      .then(() => {
        const voiceAppsFolder = this.store.get('voiceAppsFolder');
        if (voiceAppsFolder) {
          console.log(`CommandManager: Scanning voice apps folder: ${voiceAppsFolder}`);
          this.scanVoiceAppsFolder(voiceAppsFolder);
          this._watchVoiceAppsFolder(voiceAppsFolder);
        }
        
        console.log('CommandManager: Initialization complete, emitting ready event');
        this.emit('ready');
      })
      .catch((error) => {
        console.error('CommandManager: Initialization failed:', error);
        this.emit('error', error);
      });
  }
  
  _initializeDatabase() {
    console.log('Initializing database...');
    return new Promise((resolve, reject) => {
      try {
        const userDataPath = this.store.path.replace('settings.json', '');
        const dbPath = path.join(userDataPath, 'commands.db');
        
        // Ensure the directory exists
        if (!fs.existsSync(userDataPath)) {
          fs.mkdirSync(userDataPath, { recursive: true });
        }
        
        console.log(`Opening database at: ${dbPath}`);
        this.db = new sqlite3(dbPath);
        
        // Enable WAL mode for better concurrency
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('synchronous = NORMAL');
        
        console.log('Creating tables if they do not exist...');
        
        // Use transactions for better performance and atomicity
        const transaction = this.db.transaction(() => {
          // Create commands table if it doesn't exist
          this.db.prepare(`
            CREATE TABLE IF NOT EXISTS commands (
              id TEXT PRIMARY KEY,
              phrase TEXT NOT NULL,
              type TEXT NOT NULL,
              action TEXT NOT NULL,
              description TEXT,
              created_at INTEGER
            )
          `).run();
          
          // Create phonetic mappings table if it doesn't exist
          this.db.prepare(`
            CREATE TABLE IF NOT EXISTS phonetic_mappings (
              word TEXT PRIMARY KEY,
              phonetic TEXT NOT NULL
            )
          `).run();
          
          console.log('Database initialization complete');
        });
        
        // Execute the transaction
        transaction();
        resolve();
      } catch (error) {
        console.error('Error initializing database:', error);
        reject(error);
      }
    });
  }
  
  _loadCommands() {
    return new Promise((resolve, reject) => {
      try {
        const stmt = this.db.prepare('SELECT * FROM commands');
        const rows = stmt.all();
        
        this.commands = rows.map(row => ({
          id: row.id,
          phrase: row.phrase,
          type: row.type,
          action: row.action,
          description: row.description,
          createdAt: row.created_at
        }));
        
        console.log(`Loaded ${this.commands.length} commands from database`);
        resolve();
      } catch (error) {
        console.error('Error loading commands:', error);
        reject(error);
      }
    });
  }
  
  _watchVoiceAppsFolder(folderPath) {
    try {
      fs.watch(folderPath, (eventType, filename) => {
        if (eventType === 'rename' || eventType === 'change') {
          console.log(`Change detected in voice apps folder: ${filename}`);
          // Rescan the folder to update commands
          this.scanVoiceAppsFolder(folderPath);
        }
      });
      console.log(`Watching voice apps folder: ${folderPath}`);
    } catch (error) {
      console.error('Failed to watch voice apps folder:', error);
    }
  }
  
  scanVoiceAppsFolder(folderPath) {
    try {
      if (!fs.existsSync(folderPath)) {
        console.error(`Voice apps folder does not exist: ${folderPath}`);
        return false;
      }
      
      console.log(`Scanning voice apps folder: ${folderPath}`);
      
      // Get all files in the folder
      const files = fs.readdirSync(folderPath);
      
      // Process each file
      files.forEach(file => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          // Check if file has a .voice.json configuration
          const configFile = `${filePath}.voice.json`;
          
          if (fs.existsSync(configFile)) {
            try {
              // Load voice command configuration
              const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
              
              if (config.phrase) {
                // Check if command already exists
                const existingCommand = this.commands.find(cmd => 
                  cmd.phrase === config.phrase && cmd.type === 'app'
                );
                
                if (existingCommand) {
                  // Update existing command
                  this.updateCommand({
                    id: existingCommand.id,
                    phrase: config.phrase,
                    type: 'app',
                    action: filePath,
                    description: config.description || `Launch ${file}`
                  });
                } else {
                  // Add new command
                  this.addCommand({
                    phrase: config.phrase,
                    type: 'app',
                    action: filePath,
                    description: config.description || `Launch ${file}`
                  });
                }
              }
            } catch (error) {
              console.error(`Failed to parse voice config for ${file}:`, error);
            }
          } else {
            // Use filename (without extension) as the command phrase
            const fileNameWithoutExt = path.basename(file, path.extname(file));
            
            // Check if command already exists
            const existingCommand = this.commands.find(cmd => 
              cmd.phrase === fileNameWithoutExt && cmd.type === 'app'
            );
            
            if (!existingCommand) {
              // Add new command
              this.addCommand({
                phrase: fileNameWithoutExt,
                type: 'app',
                action: filePath,
                description: `Launch ${file}`
              });
            }
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to scan voice apps folder:', error);
      return false;
    }
  }
  
  getAllCommands() {
    return this.commands;
  }
  
  findMatchingCommand(text) {
    if (!text) return null;
    
    // Normalize input text
    const normalizedText = text.toLowerCase().trim();
    
    // Find exact match first
    let command = this.commands.find(cmd => 
      cmd.phrase.toLowerCase() === normalizedText
    );
    
    if (command) return command;
    
    // Find partial match (if the command phrase is contained in the text)
    command = this.commands.find(cmd => 
      normalizedText.includes(cmd.phrase.toLowerCase())
    );
    
    if (command) return command;
    
    // Try fuzzy matching (simple implementation)
    // For better results, consider using a proper fuzzy matching library
    const threshold = 0.8; // 80% similarity
    
    for (const cmd of this.commands) {
      const similarity = this._calculateSimilarity(
        cmd.phrase.toLowerCase(),
        normalizedText
      );
      
      if (similarity >= threshold) {
        return cmd;
      }
    }
    
    return null;
  }
  
  _calculateSimilarity(s1, s2) {
    // Simple Levenshtein distance-based similarity
    const distance = this._levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    
    if (maxLength === 0) return 1.0;
    
    return 1.0 - (distance / maxLength);
  }
  
  _levenshteinDistance(s1, s2) {
    const m = s1.length;
    const n = s2.length;
    
    // Create matrix
    const d = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // Initialize first row and column
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    
    // Fill the matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        d[i][j] = Math.min(
          d[i - 1][j] + 1,      // deletion
          d[i][j - 1] + 1,      // insertion
          d[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    return d[m][n];
  }
  
  addCommand(command) {
    return new Promise((resolve, reject) => {
      // Generate ID for new command
      const newCommand = {
        id: uuidv4(),
        phrase: command.phrase,
        type: command.type,
        action: command.action,
        description: command.description || '',
        createdAt: Date.now()
      };
      
      // Add to database
      this.db.run(
        `INSERT INTO commands (id, phrase, type, action, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newCommand.id,
          newCommand.phrase,
          newCommand.type,
          newCommand.action,
          newCommand.description,
          newCommand.createdAt
        ],
        (err) => {
          if (err) {
            console.error('Failed to add command:', err);
            reject(err);
            return;
          }
          
          // Add to in-memory array
          this.commands.push(newCommand);
          console.log(`Added command: ${newCommand.phrase}`);
          resolve(newCommand);
        }
      );
    });
  }
  
  updateCommand(command) {
    return new Promise((resolve, reject) => {
      // Update in database
      this.db.run(
        `UPDATE commands 
         SET phrase = ?, type = ?, action = ?, description = ?
         WHERE id = ?`,
        [
          command.phrase,
          command.type,
          command.action,
          command.description || '',
          command.id
        ],
        (err) => {
          if (err) {
            console.error('Failed to update command:', err);
            reject(err);
            return;
          }
          
          // Update in-memory array
          const index = this.commands.findIndex(cmd => cmd.id === command.id);
          if (index !== -1) {
            this.commands[index] = {
              ...this.commands[index],
              phrase: command.phrase,
              type: command.type,
              action: command.action,
              description: command.description || ''
            };
          }
          
          console.log(`Updated command: ${command.phrase}`);
          resolve(command);
        }
      );
    });
  }
  
  removeCommand(commandId) {
    return new Promise((resolve, reject) => {
      // Remove from database
      this.db.run(
        `DELETE FROM commands WHERE id = ?`,
        [commandId],
        (err) => {
          if (err) {
            console.error('Failed to remove command:', err);
            reject(err);
            return;
          }
          
          // Remove from in-memory array
          const index = this.commands.findIndex(cmd => cmd.id === commandId);
          if (index !== -1) {
            const removed = this.commands.splice(index, 1)[0];
            console.log(`Removed command: ${removed.phrase}`);
          }
          
          resolve(true);
        }
      );
    });
  }
  
  // Add a predefined set of system commands
  addDefaultCommands() {
    const defaultCommands = [
      {
        phrase: 'quit application',
        type: 'system',
        action: 'quit',
        description: 'Quit the Voice Commander application'
      },
      {
        phrase: 'minimize window',
        type: 'system',
        action: 'minimize',
        description: 'Minimize the Voice Commander window'
      },
      {
        phrase: 'show window',
        type: 'system',
        action: 'show',
        description: 'Show the Voice Commander window'
      },
      {
        phrase: 'pause video',
        type: 'keyboard',
        action: 'space',
        description: 'Press spacebar to pause/play video'
      },
      {
        phrase: 'volume up',
        type: 'keyboard',
        action: 'volumeUp',
        description: 'Increase system volume'
      },
      {
        phrase: 'volume down',
        type: 'keyboard',
        action: 'volumeDown',
        description: 'Decrease system volume'
      },
      {
        phrase: 'mute',
        type: 'keyboard',
        action: 'mute',
        description: 'Mute/unmute system audio'
      }
    ];
    
    // Add each default command if it doesn't already exist
    defaultCommands.forEach(cmd => {
      const exists = this.commands.some(
        existingCmd => existingCmd.phrase === cmd.phrase && existingCmd.type === cmd.type
      );
      
      if (!exists) {
        this.addCommand(cmd).catch(err => {
          console.error(`Failed to add default command '${cmd.phrase}':`, err);
        });
      }
    });
  }
}

module.exports = {
  CommandManager
};
