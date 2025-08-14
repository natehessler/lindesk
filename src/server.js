import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';
import { transferTicket } from './commands/transfer.js';
import { config } from './config.js';

// Utility function to get directory size
function getDirectorySizeSync(dirPath) {
  let totalSize = 0;
  
  function traverse(currentPath) {
    const stats = fs.statSync(currentPath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        traverse(path.join(currentPath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }
  
  try {
    traverse(dirPath);
    return totalSize;
  } catch (error) {
    return 0;
  }
}

// Convert bytes to human readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'codebase-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB limit
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/settings.html'));
});

// API Routes
app.get('/api/config', (req, res) => {
  try {
    const currentConfig = {
      zendesk_domain: config.get('zendesk_domain') || '',
      zendesk_email: config.get('zendesk_email') || '',
      zendesk_token: config.get('zendesk_token') ? '***' : '',
      amp_api_key: config.get('amp_api_key') ? '***' : '',
      slack_token: config.get('slack_token') ? '***' : '',
      default_slack_channel: config.get('default_slack_channel') || '',
      linear_api_key: config.get('linear_api_key') ? '***' : '',
      default_linear_project: config.get('default_linear_project') || ''
    };
    res.json(currentConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const {
      zendesk_domain,
      zendesk_email,
      zendesk_token,
      amp_api_key,
      slack_token,
      default_slack_channel,
      linear_api_key,
      default_linear_project
    } = req.body;

    // Only update non-empty values
    if (zendesk_domain) config.set('zendesk_domain', zendesk_domain);
    if (zendesk_email) config.set('zendesk_email', zendesk_email);
    if (zendesk_token && zendesk_token !== '***') config.set('zendesk_token', zendesk_token);
    if (amp_api_key && amp_api_key !== '***') config.set('amp_api_key', amp_api_key);
    if (slack_token && slack_token !== '***') config.set('slack_token', slack_token);
    if (default_slack_channel) config.set('default_slack_channel', default_slack_channel);
    if (linear_api_key && linear_api_key !== '***') config.set('linear_api_key', linear_api_key);
    if (default_linear_project) config.set('default_linear_project', default_linear_project);

    res.json({ success: true, message: 'Configuration saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload-codebase', (req, res) => {
  const uploadSingle = upload.single('codebase');
  
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
          error: 'File too large. Maximum size is 2GB.' 
        });
      }
      return res.status(500).json({ 
        error: `Upload failed: ${err.message}` 
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Extract the uploaded archive
      const extractDir = path.join(__dirname, '../uploads/extracted', path.parse(req.file.filename).name);
      
      try {
        // Create extraction directory
        if (!fs.existsSync(extractDir)) {
          fs.mkdirSync(extractDir, { recursive: true });
        }

        // Extract based on file type
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let extractCmd;
        let extractArgs;

        if (fileExt === '.zip') {
          extractCmd = 'unzip';
          extractArgs = ['-q', req.file.path, '-d', extractDir];
        } else if (fileExt === '.tar' || req.file.originalname.includes('.tar.gz')) {
          extractCmd = 'tar';
          extractArgs = ['-xzf', req.file.path, '-C', extractDir];
        } else {
          throw new Error('Unsupported file format');
        }

        // Extract the archive
        const extractProcess = spawn(extractCmd, extractArgs);
        
        extractProcess.on('close', (code) => {
          if (code === 0) {
            // Check extracted directory size
            const extractedSize = getDirectorySizeSync(extractDir);
            const maxCodebaseSize = 500 * 1024 * 1024; // 500MB limit for analysis
            
            if (extractedSize > maxCodebaseSize) {
              // Clean up the large extraction
              fs.rmSync(extractDir, { recursive: true, force: true });
              return res.status(413).json({ 
                error: `Extracted codebase is too large (${formatBytes(extractedSize)}). Maximum size for analysis is ${formatBytes(maxCodebaseSize)}. Consider uploading a smaller subset of your codebase or excluding node_modules, build artifacts, etc.` 
              });
            }
            
            // Set the latest codebase path for analysis
            latestCodebasePath = extractDir;
            res.json({ 
              success: true, 
              message: `Codebase uploaded and extracted successfully (${formatBytes(extractedSize)})`,
              filename: req.file.filename,
              path: req.file.path,
              extractedPath: extractDir,
              extractedSize: formatBytes(extractedSize)
            });
          } else {
            res.json({ 
              success: true, 
              message: 'Codebase uploaded successfully (extraction failed but file is available)',
              filename: req.file.filename,
              path: req.file.path
            });
          }
        });

        extractProcess.on('error', (err) => {
          // Even if extraction fails, the upload was successful
          res.json({ 
            success: true, 
            message: 'Codebase uploaded successfully (extraction failed but file is available)',
            filename: req.file.filename,
            path: req.file.path
          });
        });

      } catch (error) {
        // Even if extraction fails, the upload was successful
        res.json({ 
          success: true, 
          message: 'Codebase uploaded successfully (extraction failed but file is available)',
          filename: req.file.filename,
          path: req.file.path
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

app.post('/api/analyze-ticket', async (req, res) => {
  // Set content type to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { ticketId, customPrompt, slackChannel, linearProject } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: 'Ticket ID is required' });
    }

    // Determine what actions to take
    const hasChannel = !!slackChannel;
    const hasProject = !!linearProject;
    const createLinear = hasProject;
    const postToSlackChannel = hasChannel;

    // Validate codebase size before analysis
    if (latestCodebasePath) {
      const codebaseSize = getDirectorySizeSync(latestCodebasePath);
      const maxCodebaseSize = 500 * 1024 * 1024; // 500MB limit
      
      if (codebaseSize > maxCodebaseSize) {
        return res.status(413).json({ 
          success: false,
          error: `Codebase is too large for analysis (${formatBytes(codebaseSize)}). Maximum size is ${formatBytes(maxCodebaseSize)}. Please upload a smaller codebase.` 
        });
      }
    }

    // Call the existing transfer function with codebase path if available
    const result = await transferTicket(
      ticketId, 
      linearProject, 
      slackChannel, 
      createLinear, 
      postToSlackChannel, 
      customPrompt,
      latestCodebasePath
    );

    res.json({ 
      success: true, 
      message: 'Ticket analyzed successfully',
      result: result
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'An unexpected error occurred during analysis'
    });
  }
});

// Store the latest uploaded codebase path
let latestCodebasePath = null;

// Track uploaded codebase
app.post('/api/set-codebase', (req, res) => {
  const { extractedPath } = req.body;
  latestCodebasePath = extractedPath;
  res.json({ success: true, message: 'Codebase path set successfully' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const server = app.listen(port, () => {
  console.log(`Lindesk web interface running at http://localhost:${port}`);
});

// Increase timeout for large file uploads (10 minutes)
server.timeout = 10 * 60 * 1000;
