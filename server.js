require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs-extra');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
const INDEX_FILE = path.join(__dirname, 'index.html');
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(bodyParser.json());

// Subjects metadata
const SUBJECTS = {
  toc: { name: 'Theory of Computation', containerId: 'tocLinks' },
  ai: { name: 'Artificial Intelligence', containerId: 'aiLinks' },
  sepm: { name: 'Software Engineering Project Management', containerId: 'sepmLinks' },
  cn: { name: 'Computer Networks', containerId: 'cnLinks' },
  rm: { name: 'Research Methodology', containerId: 'rmLinks' }
};

// MongoDB setup
const MONGODB_URI = process.env.MONGODB_URI || '';
const USE_DB = !!MONGODB_URI;

const linkSchema = new mongoose.Schema({
  subjectKey: { type: String, required: true, enum: Object.keys(SUBJECTS) },
  title: { type: String, required: true },
  url: { type: String, required: true },
  addedBy: { type: String, default: 'admin' },
  addedAt: { type: Date, default: Date.now }
});

const Link = mongoose.model('Link', linkSchema);

// JSON fallback helpers
function defaultJsonData() {
  const base = {};
  Object.keys(SUBJECTS).forEach((k) => { base[k] = { name: SUBJECTS[k].name, links: [] }; });
  return base;
}

async function ensureDataFile() {
  if (!(await fs.pathExists(DATA_FILE))) {
    await fs.writeJson(DATA_FILE, defaultJsonData(), { spaces: 2 });
  }
}

async function readJsonData() {
  await ensureDataFile();
  return fs.readJson(DATA_FILE);
}

async function writeJsonData(data) {
  return fs.writeJson(DATA_FILE, data, { spaces: 2 });
}

// API routes
app.get('/api/subjects', async (req, res) => {
  try {
    const result = {};
    if (USE_DB) {
      await Promise.all(Object.keys(SUBJECTS).map(async (key) => {
        const links = await Link.find({ subjectKey: key }).sort({ addedAt: 1 }).lean();
        result[key] = { name: SUBJECTS[key].name, links };
      }));
    } else {
      const data = await readJsonData();
      Object.keys(SUBJECTS).forEach((key) => {
        result[key] = { name: SUBJECTS[key].name, links: data[key]?.links || [] };
      });
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read subjects' });
  }
});

app.get('/api/subjects/:key/links', async (req, res) => {
  try {
    const subj = SUBJECTS[req.params.key];
    if (!subj) return res.status(404).json({ error: 'Subject not found' });
    let links;
    if (USE_DB) {
      links = await Link.find({ subjectKey: req.params.key }).sort({ addedAt: 1 }).lean();
    } else {
      const data = await readJsonData();
      links = data[req.params.key]?.links || [];
    }
    res.json(links);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read links' });
  }
});

app.post('/api/subjects/:key/links', async (req, res) => {
  try {
    const { title, url, addedBy } = req.body || {};
    if (!title || !url) return res.status(400).json({ error: 'Missing title or url' });
    const subj = SUBJECTS[req.params.key];
    if (!subj) return res.status(404).json({ error: 'Subject not found' });
    try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }
    if (USE_DB) {
      const created = await Link.create({ subjectKey: req.params.key, title, url, addedBy: addedBy || 'admin' });
      res.status(201).json(created);
    } else {
      const data = await readJsonData();
      const newLink = { _id: Date.now().toString(36), subjectKey: req.params.key, title, url, addedBy: addedBy || 'admin', addedAt: new Date().toISOString() };
      data[req.params.key].links.push(newLink);
      await writeJsonData(data);
      res.status(201).json(newLink);
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to add link' });
  }
});

app.delete('/api/subjects/:key/links/:id', async (req, res) => {
  try {
    const subj = SUBJECTS[req.params.key];
    if (!subj) return res.status(404).json({ error: 'Subject not found' });
    if (USE_DB) {
      const deleted = await Link.findOneAndDelete({ _id: req.params.id, subjectKey: req.params.key }).lean();
      if (!deleted) return res.status(404).json({ error: 'Link not found' });
      res.json(deleted);
    } else {
      const data = await readJsonData();
      const list = data[req.params.key]?.links || [];
      const idx = list.findIndex(l => (l._id || '') === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Link not found' });
      const [removed] = list.splice(idx, 1);
      await writeJsonData(data);
      res.json(removed);
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

// Serve static frontend
app.use(express.static(__dirname));

async function start() {
  try {
    if (USE_DB) {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB');
    } else {
      await ensureDataFile();
      console.log('MongoDB URI not set. Using local JSON storage.');
    }
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Failed to initialize server', e);
    process.exit(1);
  }
}

start();


