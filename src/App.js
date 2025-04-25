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
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Fetch data from the provided URL
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

    try {
      // If proxy is enabled, use a CORS proxy
      // Using multiple proxy options as fallbacks
      const proxyUrls = [
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://cors-anywhere.herokuapp.com/${url}`
      ];
      
      const targetUrl = useProxy ? proxyUrls[0] : url;
      console.log("Fetching from:", targetUrl);
      
      // Attempt to fetch with current options
      let response = await fetch(targetUrl, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Try to parse as JSON
      let jsonData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        jsonData = await response.json();
      } else {
        // If not JSON, try to get text and parse
        const text = await response.text();
        try {
          jsonData = JSON.parse(text);
        } catch (e) {
          // If text can't be parsed as JSON, try to extract data from HTML
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          
          // Extract data from tables if present
          const tables = doc.querySelectorAll('table');
          if (tables.length > 0) {
            jsonData = extractDataFromTables(tables);
          } else {
            throw new Error('Response is not in JSON format and no tables found');
          }
        }
      }
      
      // Set the data
      setData(Array.isArray(jsonData) ? jsonData : [jsonData]);
      setIsLoading(false);
    } catch (err) {
      // Try with alternative proxies if the first one fails and proxy is enabled
      if (useProxy && err.message.includes('CORS') || err.message.includes('Failed to fetch')) {
        try {
          // Try with second proxy
          const secondProxyUrl = proxyUrls[1];
          console.log("Trying secondary proxy:", secondProxyUrl);
          response = await fetch(secondProxyUrl, fetchOptions);
          
          if (!response.ok) {
            throw new Error(`HTTP error with second proxy! Status: ${response.status}`);
          }
          
          // Process response as before
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            jsonData = await response.json();
          } else {
            // If not JSON, try to get text and parse
            const text = await response.text();
            try {
              jsonData = JSON.parse(text);
            } catch (e) {
              // If text can't be parsed as JSON, try to extract data from HTML
              const parser = new DOMParser();
              const doc = parser.parseFromString(text, 'text/html');
              
              // Extract data from tables if present
              const tables = doc.querySelectorAll('table');
              if (tables.length > 0) {
                jsonData = extractDataFromTables(tables);
              } else {
                throw new Error('Response is not in JSON format and no tables found');
              }
            }
          }
          
          setData(Array.isArray(jsonData) ? jsonData : [jsonData]);
          setIsLoading(false);
          return;
        } catch (secondErr) {
          // If second proxy also fails, try the third one
          try {
            const thirdProxyUrl = proxyUrls[2];
            console.log("Trying tertiary proxy:", thirdProxyUrl);
            response = await fetch(thirdProxyUrl, fetchOptions);
            
            if (!response.ok) {
              throw new Error(`HTTP error with third proxy! Status: ${response.status}`);
            }
            
            // Process response as before
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
              jsonData = await response.json();
            } else {
              // If not JSON, try to get text and parse
              const text = await response.text();
              try {
                jsonData = JSON.parse(text);
              } catch (e) {
                // If text can't be parsed as JSON, try to extract data from HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                
                // Extract data from tables if present
                const tables = doc.querySelectorAll('table');
                if (tables.length > 0) {
                  jsonData = extractDataFromTables(tables);
                } else {
                  throw new Error('Response is not in JSON format and no tables found');
                }
              }
            }
            
            setData(Array.isArray(jsonData) ? jsonData : [jsonData]);
            setIsLoading(false);
            return;
          } catch (thirdErr) {
            // All proxies failed
            setError(`Failed to fetch data even with all CORS proxies. Please check if the URL is accessible: ${err.message}`);
            setIsLoading(false);
            return;
          }
        }
      }
      
      // Original error if proxies not used or all failed
      setError(`Failed to fetch data: ${err.message}. ${!useProxy ? 'Try enabling CORS proxy in Advanced Options' : 'All CORS proxies failed. Try a different URL.'}`);
      setIsLoading(false);
    }
  };

  // Extract data from HTML tables
  const extractDataFromTables = (tables) => {
    const result = [];
    
    // Process the first table
    const table = tables[0];
    const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
    
    // If no headers found, try first row
    const headerRow = headers.length === 0 ? Array.from(table.querySelectorAll('tr')[0].querySelectorAll('td')).map(td => td.textContent.trim()) : headers;
    
    // Process rows
    const rows = Array.from(table.querySelectorAll('tr')).slice(headers.length === 0 ? 1 : 0);
    
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

  // Read local file content
  const readLocalFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        // First attempt to parse as JSON
        try {
          const jsonData = JSON.parse(event.target.result);
          setData(Array.isArray(jsonData) ? jsonData : [jsonData]);
          setError(null);
          return;
        } catch (jsonErr) {
          // JSON parsing failed, continue to other formats
        }
        
        // Try to parse as CSV
        try {
          const csvData = parseCSV(event.target.result);
          if (csvData.length > 0) {
            setData(csvData);
            setError(null);
            return;
          }
        } catch (csvErr) {
          // CSV parsing failed, continue to other formats
        }
        
        // Try to parse as HTML with tables
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(event.target.result, 'text/html');
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

  // Parse CSV string to JSON
  const parseCSV = (csvString) => {
    const lines = csvString.split('\n');
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

  // Convert data to CSV
  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
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
          value;
        return escaped;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (data.length === 0) {
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={url}
                      onChange={handleUrlChange}
                      placeholder="Enter API endpoint URL (e.g., https://api.example.com/data)"
                      className="pl-10 w-full rounded-lg border border-gray-300 bg-gray-50 py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-150"
                    />
                  </div>
                  <button 
                    onClick={fetchData} 
                    disabled={isLoading} 
                    className={`py-3 px-6 md:w-auto rounded-lg text-white font-medium text-center shadow-md transition-all duration-150 transform hover:scale-105 active:scale-100 flex items-center justify-center ${
                      isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        Fetch Data
                      </>
                    )}
                  </button>
                </div>
                
                {/* Advanced options toggle */}
                <div className="mt-3">
                  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-md mb-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          <strong>CORS Issue Detected!</strong> Enable the CORS proxy below to fix "Failed to fetch" errors.
                        </p>
                      </div>
                    </div>
                  </div>
                  <details className="text-sm" open>
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                      Advanced Options (CORS Solution Inside)
                    </summary>
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                      <div className="flex items-center bg-blue-50 p-2 rounded-md">
                        <input
                          type="checkbox"
                          id="use-proxy"
                          checked={useProxy}
                          onChange={toggleProxy}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                        />
                        <label htmlFor="use-proxy" className="ml-2 block text-sm font-medium text-blue-700">
                          Use CORS Proxy (Enable this to fix fetch errors!)
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Request Method
                        </label>
                        <select
                          value={fetchOptions.method}
                          onChange={(e) => updateFetchOption('method', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white py-2 px-3"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          Content-Type Header
                        </label>
                        <select
                          value={fetchOptions.headers['Content-Type']}
                          onChange={(e) => updateFetchOption('headers', {...fetchOptions.headers, 'Content-Type': e.target.value})}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white py-2 px-3"
                        >
                          <option value="application/json">application/json</option>
                          <option value="text/html">text/html</option>
                          <option value="text/plain">text/plain</option>
                          <option value="application/xml">application/xml</option>
                        </select>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
              
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-gray-500 font-medium">OR</span>
                </div>
              </div>
              
              {/* File Upload Section */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 md:mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  Upload local file
                </h3>
                <div 
                  className={`mt-2 p-4 md:p-6 border-2 border-dashed rounded-lg text-center transition-colors duration-150 cursor-pointer ${
                    isDragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span> or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-gray-500">JSON, CSV, HTML, or TXT files (Max 10MB)</p>
                  {localFile && (
                    <div className="mt-3 text-sm text-gray-800 bg-blue-50 p-2 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      {localFile.name}
                    </div>
                  )}
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileInput}
                    accept=".json,.csv,.html,.htm,.txt,.xml"
                  />
                </div>
              </div>
            </div>
          </section>
          
          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border-l-4 border-red-500 px-4 py-3 shadow-md transition-all duration-150 opacity-100">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-1 text-sm text-red-700">
                    {error}
                  </div>
                </div>
                <button 
                  className="ml-auto flex-shrink-0 text-red-500 hover:text-red-700 focus:outline-none"
                  onClick={() => setError(null)}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Data Preview */}
          {data.length > 0 && (
            <section className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl overflow-hidden transition-all duration-150 opacity-100 transform translate-y-0">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 md:px-6 py-4 md:py-5 flex justify-between items-center flex-wrap md:flex-nowrap gap-2">
                <h2 className="text-white text-lg md:text-xl font-bold flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  Data Preview
                </h2>
                <button 
                  onClick={exportToCSV} 
                  className="flex items-center py-1.5 px-4 bg-white rounded-full text-emerald-700 font-medium shadow hover:bg-emerald-50 transition-all duration-150 transform hover:scale-105 active:scale-100"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                  </svg>
                  Export to CSV
                </button>
              </div>
              
              <div className="p-4 md:p-6">
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          {Object.keys(data[0]).map((key) => (
                            <th 
                              key={key} 
                              scope="col" 
                              className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.slice(0, 10).map((item, index) => (
                          <tr 
                            key={index} 
                            className={`hover:bg-blue-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                          >
                            {Object.values(item).map((value, i) => (
                              <td 
                                key={i} 
                                className="px-4 md:px-6 py-4 text-sm text-gray-700 font-mono whitespace-nowrap"
                              >
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {data.length > 10 && (
                    <div className="text-center py-3 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center justify-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Showing 10 of {data.length} rows
                        <button 
                          onClick={exportToCSV}
                          className="ml-2 text-blue-600 hover:text-blue-800 hover:underline focus:outline-none font-medium"
                        >
                          Export all to CSV
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
        
        {/* Footer */}
        <footer className="mt-8 md:mt-12 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Data Fetcher & CSV Exporter. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;