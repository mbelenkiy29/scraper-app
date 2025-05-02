const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.get('/api/scrape-stream', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    res.writeHead(400);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const python = spawn('python', ['universal_scraper.py', targetUrl]);

  python.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        res.write(`data: LOG:${line.trim()}\n\n`);
      }
    });
  });

  python.stderr.on('data', (data) => {
    res.write(`data: ERR:${data.toString().trim()}\n\n`);
  });

  python.on('close', (code) => {
    if (fs.existsSync('./full_site_output.csv')) {
      const csvContent = fs.readFileSync('./full_site_output.csv', 'utf8');
      const base64 = Buffer.from(csvContent).toString('base64');
      res.write(`data: CSV:${base64}\n\n`);
    } else {
      res.write(`data: ERR:CSV file not found.\n\n`);
    }
    res.write('event: end\ndata: done\n\n');
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${3000}`);
});
