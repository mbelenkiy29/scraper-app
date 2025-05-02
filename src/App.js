import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const isValidUrl = (urlString) => {
    try {
      return Boolean(new URL(urlString));
    } catch (e) {
      return false;
    }
  };

  const parseCSV = (csvString) => {
    const lines = csvString.split('\n');
    if (lines.length === 0) return [];

    const result = [];
    const headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, ''));

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const obj = {};
      const currentLine = lines[i].split(',');

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentLine[j] ? currentLine[j].trim().replace(/^"|"$/g, '') : '';
      }

      result.push(obj);
    }

    return result;
  };

  const fetchData = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLogs([]);

    const eventSource = new EventSource(`http://localhost:5001/api/scrape-stream?url=${encodeURIComponent(url)}`);

    eventSource.onmessage = (event) => {
      if (event.data.startsWith('LOG:')) {
        setLogs(prev => [...prev, event.data.replace('LOG:', '')]);
      } else if (event.data.startsWith('CSV:')) {
        const csv = atob(event.data.replace('CSV:', ''));
        const parsed = parseCSV(csv);
        setData(parsed);
        triggerDownload(csv);
        setIsLoading(false);
        eventSource.close();
      } else if (event.data.startsWith('ERR:')) {
        setError(event.data.replace('ERR:', ''));
        setIsLoading(false);
        eventSource.close();
      }
    };

    eventSource.onerror = (e) => {
      setError('Error connecting to scraper backend');
      setIsLoading(false);
      eventSource.close();
    };
  };

  const triggerDownload = (csvText) => {
    const blob = new Blob([csvText], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'scraped_data.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Universal Scraper</h1>
          <p className="text-gray-600">Input a URL and fetch full-site scraped data</p>
        </header>
        <div className="bg-white p-6 rounded shadow">
          <div className="mb-4">
            <label htmlFor="url" className="block mb-2 text-sm font-medium text-gray-700">Enter URL:</label>
            <div className="flex">
              <input
                id="url"
                type="text"
                value={url}
                onChange={handleUrlChange}
                className="flex-grow px-4 py-2 border rounded-l border-gray-300 focus:outline-none"
                placeholder="https://example.com"
              />
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700"
              >
                {isLoading ? 'Loading...' : 'Fetch Data'}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          {logs.length > 0 && (
            <div className="mb-6 max-h-64 overflow-y-auto bg-gray-100 p-4 rounded text-sm text-gray-700">
              <strong className="block mb-2">Activity Log:</strong>
              <div>
                {logs.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}

          {data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-100">
                  <tr>
                    {Object.keys(data[0]).map((key, idx) => (
                      <th key={idx} className="px-4 py-2 border-b">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-4 py-2">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-sm text-gray-500">Showing 10 of {data.length} rows.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
