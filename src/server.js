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
      plain_api_key: config.get('plainApiKey') ? '***' : '',
      sourcegraph_url: config.get('sourcegraphUrl') || '',
      sourcegraph_token: config.get('sourcegraphToken') ? '***' : '',
      slack_token: config.get('slackToken') ? '***' : '',
      default_slack_channel: config.get('defaultSlackChannel') || '',
      linear_api_key: config.get('linearApiKey') ? '***' : '',
      default_linear_project: config.get('defaultProject') || ''
    };
    res.json(currentConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const {
      plain_api_key,
      sourcegraph_url,
      sourcegraph_token,
      slack_token,
      default_slack_channel,
      linear_api_key,
      default_linear_project
    } = req.body;

    // Only update non-empty values (except allow clearing non-required fields)
    if (plain_api_key && plain_api_key !== '***' && plain_api_key.trim() !== '') config.set('plainApiKey', plain_api_key);
    if (sourcegraph_url !== undefined) config.set('sourcegraphUrl', sourcegraph_url);
    if (sourcegraph_token && sourcegraph_token !== '***' && sourcegraph_token.trim() !== '') config.set('sourcegraphToken', sourcegraph_token);
    if (slack_token !== undefined && slack_token !== '***') config.set('slackToken', slack_token);
    if (default_slack_channel !== undefined) config.set('defaultSlackChannel', default_slack_channel);
    if (linear_api_key !== undefined && linear_api_key !== '***') config.set('linearApiKey', linear_api_key);
    if (default_linear_project !== undefined) config.set('defaultProject', default_linear_project);

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


// Analyze Plain thread (also supports legacy /api/analyze-ticket endpoint)
async function handleAnalyzeThread(req, res) {
  // Set content type to ensure JSON response
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { ticketId, threadId, customPrompt, slackChannel, linearProject } = req.body;
    const id = threadId || ticketId; // Support both threadId (new) and ticketId (legacy)
    console.log(`🧵 Starting analysis for Plain thread #${id}`);
    console.log(`📋 Request details:`, { threadId: id, customPrompt: !!customPrompt, slackChannel: !!slackChannel, linearProject: !!linearProject });

    if (!id) {
      return res.status(400).json({ error: 'Thread ID is required' });
    }

    // Determine what actions to take
    const hasChannel = !!slackChannel;
    const hasProject = !!linearProject;
    const createLinear = hasProject;
    const postToSlackChannel = hasChannel;

    // Call the existing transfer function
    console.log(`🤖 Calling transferTicket with Deep Search`);
    const result = await transferTicket(
      id, 
      linearProject, 
      slackChannel, 
      createLinear, 
      postToSlackChannel, 
      customPrompt
    );
    console.log(`✅ Analysis completed successfully`);

    res.json({ 
      success: true, 
      message: 'Thread analyzed successfully',
      result: result
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'An unexpected error occurred during analysis'
    });
  }
}

// Register both endpoints for backward compatibility
app.post('/api/analyze-thread', handleAnalyzeThread);
app.post('/api/analyze-ticket', handleAnalyzeThread);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const server = app.listen(port, () => {
  console.log(`Lindesk web interface running at http://localhost:${port}`);
});

// Increase timeout for large file uploads (10 minutes)
server.timeout = 10 * 60 * 1000;
