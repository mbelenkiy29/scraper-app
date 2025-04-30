const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.post('/api/scrape', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const command = `python universal_scraper.py "${url}"`;

  exec(command, { timeout: 180000 }, (err) => {
    if (err) return res.status(500).json({ error: 'Python scraper failed' });

    try {
      const csvData = fs.readFileSync('./full_site_output.csv', 'utf8');
      res.type('text/csv').send(csvData);
    } catch (readErr) {
      res.status(500).json({ error: 'CSV not found' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${5000}`);
});
