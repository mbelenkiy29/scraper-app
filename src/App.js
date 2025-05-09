import React, { useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localFile, setLocalFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [fetchOptions, setFetchOptions] = useState({
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    mode: 'cors'
  });
  const [useProxy, setUseProxy] = useState(false);

  // Define proxy URLs
  const proxyUrls = [
    `https://corsproxy.io/?`,
    `https://api.allorigins.win/raw?url=`,
    `https://cors-anywhere.herokuapp.com/`,
    `https://api.codetabs.com/v1/proxy?quest=`
  ];

  // Handle URL input change
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  // Toggle proxy usage
  const toggleProxy = () => {
    setUseProxy(!useProxy);
    // Clear any existing errors when toggling proxy
    setError(null);
  };

  // Update fetch options
  const updateFetchOption = (key, value) => {
    setFetchOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Validate URL
  const isValidUrl = (urlString) => {
    try {
      return Boolean(new URL(urlString));
    } catch (e) {
      return false;
    }
  };

  // Extract data from HTML tables
  const extractDataFromTables = (tables) => {
    const result = [];
    
    if (tables.length === 0) return result;
    
    // Process the first table
    const table = tables[0];
    const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
    
    // If no headers found, try first row
    const headerRow = headers.length === 0 ? 
      Array.from(table.querySelectorAll('tr')[0]?.querySelectorAll('td') || []).map(td => td.textContent.trim()) : 
      headers;
    
    // Process rows
    const rows = Array.from(table.querySelectorAll('tr')).slice(headers.length === 0 && headerRow.length > 0 ? 1 : 0);
    
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      if (cells.length > 0) {
        const rowData = {};
        cells.forEach((cell, i) => {
          if (i < headerRow.length) {
            rowData[headerRow[i] || `column${i}`] = cell.textContent.trim();
          }
        });
        result.push(rowData);
      }
    });
    
    return result;
  };

  // Fetch data from the provided URL with fallback mechanism
  const fetchData = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (e.g., https://api.example.com/data)');
      return;
    }

    setIsLoading(true);
    setError(null);

    const fetchWithUrl = async (fetchUrl, options) => {
      try {
        const response = await fetch(fetchUrl, options);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Try to parse as JSON
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          // If not JSON, try to get text and parse
          const text = await response.text();
          try {
            return JSON.parse(text);
          } catch (e) {
            // If text can't be parsed as JSON, try to extract data from HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            // Extract data from tables if present
            const tables = doc.querySelectorAll('table');
            if (tables.length > 0) {
              return extractDataFromTables(tables);
            } else {
              throw new Error('Response is not in JSON format and no tables found');
            }
          }
        }
      } catch (error) {
        throw error;
      }
    };

    // Try all available options
    let lastError = null;
    
    // First try direct URL
    if (!useProxy) {
      try {
        const jsonData = await fetchWithUrl(url, fetchOptions);
        setData(Array.isArray(jsonData) ? jsonData : [jsonData]);
        setIsLoading(false);
        return;
      } catch (err) {
        lastError = err;
        console.error("Direct fetch failed:", err.message);
      }
    }
    
    // If direct fetch fails or proxy is enabled, try with proxies
    if (useProxy || lastError) {
      for (const proxyUrl of proxyUrls) {
        try {
          const targetUrl = `${proxyUrl}${encodeURIComponent(url)}`;
          console.log("Trying proxy:", targetUrl);
          
          const jsonData = await fetchWithUrl(targetUrl, fetchOptions);
          setData(Array.isArray(jsonData) ? jsonData : [jsonData]);
          setIsLoading(false);
          return;
        } catch (err) {
          lastError = err;
          console.error(`Proxy fetch with ${proxyUrl} failed:`, err.message);
        }
      }
    }
    
    // If we get here, all attempts failed
    setError(`Failed to fetch data: ${lastError?.message || 'Unknown error'}. ${!useProxy ? 'Try enabling CORS proxy in Advanced Options' : 'All CORS proxies failed. Try a different URL.'}`);
    setIsLoading(false);
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileInput({ target: { files: e.dataTransfer.files } });
    }
  };

  // Handle local file input
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLocalFile(file);
      readLocalFile(file);
    }
  };

  // Parse CSV string to JSON
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

  // Read local file content
  const readLocalFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        let fileData = event.target.result;
        
        // First attempt to parse as JSON
        try {
          const jsonData = JSON.parse(fileData);
          setData(Array.isArray(jsonData) ? jsonData : [jsonData]);
          setError(null);
          return;
        } catch (jsonErr) {
          // JSON parsing failed, continue to other formats
          console.log("JSON parsing failed, trying other formats");
        }
        
        // Try to parse as CSV
        try {
          const csvData = parseCSV(fileData);
          if (csvData.length > 0) {
            setData(csvData);
            setError(null);
            return;
          }
        } catch (csvErr) {
          // CSV parsing failed, continue to other formats
          console.log("CSV parsing failed, trying other formats");
        }
        
        // Try to parse as HTML with tables
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(fileData, 'text/html');
          const tables = doc.querySelectorAll('table');
          
          if (tables.length > 0) {
            const tableData = extractDataFromTables(tables);
            if (tableData.length > 0) {
              setData(tableData);
              setError(null);
              return;
            }
          }
        } catch (htmlErr) {
          // HTML parsing failed
          console.log("HTML parsing failed");
        }
        
        // If we got here, no parser worked
        setError('Could not parse file. Please upload a valid JSON, CSV, or HTML file with tables.');
      } catch (err) {
        setError(`Error processing file: ${err.message}`);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
    };
    
    reader.readAsText(file);
  };

  // Convert data to CSV
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    const csvRows = [headers.join(',')];
    
    // Create rows for each data item
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle values that contain commas, newlines, or quotes
        const escaped = typeof value === 'string' ? 
          `"${value.replace(/"/g, '""')}"` : 
          value !== null && value !== undefined ? String(value) : '';
        return escaped;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }
    
    const csv = convertToCSV(data);
    
    // Create a Blob from the CSV string
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'exported_data.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4 md:p-6 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Data Fetcher & CSV Exporter
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">
            A modern tool to fetch data from APIs and local files, with quick export to CSV functionality
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-6 md:space-y-8">
          {/* Controls Card */}
          <section className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 md:px-6 py-4 md:py-5">
              <h2 className="text-white text-lg md:text-xl font-bold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                </svg>
                Data Source
              </h2>
            </div>
            
            <div className="p-4 md:p-6 space-y-6 md:space-y-8">
              {/* URL Input Section */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 md:mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                  Fetch data from URL
                </h3>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-grow relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9"></path>
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="Enter API URL, e.g., https://api.example.com/data"
                      value={url}
                      onChange={handleUrlChange}
                    />
                  </div>
                  <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Fetching...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Fetch Data
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="proxy-toggle"
                    checked={useProxy}
                    onChange={toggleProxy}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="proxy-toggle" className="ml-2 block text-sm text-gray-700">
                    Use CORS proxy (for APIs that don't support cross-origin requests)
                  </label>
                </div>
              </div>
              
              {/* Local File Upload Section */}
              <div className="mt-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 md:mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Or upload a local file (JSON, CSV, HTML)
                </h3>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".json,.csv,.html,.htm,.xml,.txt"
                    onChange={handleFileInput}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <span className="text-sm text-gray-600">
                      {isDragActive ? "Drop your file here" : localFile ? `File selected: ${localFile.name}` : "Drag and drop your file here, or click to browse"}
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Error messages */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Export button */}
              {data.length > 0 && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12"></path>
                    </svg>
                    Export to CSV
                  </button>
                </div>
              )}
            </div>
          </section>
          
          {/* Data Display Section */}
          {data.length > 0 && (
            <section className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-4 md:px-6 py-4 md:py-5">
                <h2 className="text-white text-lg md:text-xl font-bold flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  Data Preview
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {data[0] && Object.keys(data[0]).map((header, index) => (
                        <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.slice(0, 10).map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {Object.values(row).map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 10 && (
                  <div className="bg-gray-50 px-6 py-3 text-center">
                    <span className="text-sm text-gray-500">
                      Showing 10 of {data.length} rows. Export to CSV to see all data.
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;