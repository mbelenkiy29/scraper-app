import React, { useState } from 'react';

function App() {
  const [url, setUrl] = useState('https://');
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setUrl(e.target.value);
  };

  const fetchMetadata = async () => {
    // Reset states
    setLoading(true);
    setError(null);
    setMetadata(null);
    
    try {
      // In a real app, you would need a proxy server or API 
      // to fetch the metadata due to CORS restrictions
      // This is a simplified example to demonstrate the concept
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch website data');
      }
      
      const data = await response.json();
      
      // Create a DOM parser to extract metadata
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');
      
      // Extract metadata
      const metadataObj = {
        title: doc.querySelector('title')?.textContent || 'No title found',
        description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || 'No description found',
        ogTitle: doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || 'No Open Graph title found',
        ogDescription: doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || 'No Open Graph description found',
        ogImage: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || null,
        favicon: doc.querySelector('link[rel="icon"]')?.getAttribute('href') || 
                doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') || null
      };
      
      setMetadata(metadataObj);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url) {
      fetchMetadata();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Website Metadata Fetcher</h1>
      </header>
      
      <main className="flex-grow p-6 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Enter website URL (e.g. https://example.com)"
              value={url}
              onChange={handleInputChange}
              className="flex-grow p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button 
              type="submit" 
              className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              disabled={loading}
            >
              {loading ? 'Fetching...' : 'Fetch Metadata'}
            </button>
          </form>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            <p>{error}</p>
            <p className="text-sm mt-2">Make sure the URL is correct and includes the protocol (http:// or https://)</p>
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {metadata && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Metadata Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700">Page Title</h3>
                  <p className="mt-1">{metadata.title}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Meta Description</h3>
                  <p className="mt-1">{metadata.description}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Open Graph Title</h3>
                  <p className="mt-1">{metadata.ogTitle}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700">Open Graph Description</h3>
                  <p className="mt-1">{metadata.ogDescription}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {metadata.favicon && (
                  <div>
                    <h3 className="font-medium text-gray-700">Favicon</h3>
                    <div className="mt-2">
                      <img 
                        src={metadata.favicon.startsWith('http') ? metadata.favicon : `${new URL(url).origin}${metadata.favicon}`} 
                        alt="Favicon" 
                        className="h-8 w-8 object-contain border border-gray-200 rounded"
                      />
                    </div>
                  </div>
                )}
                
                {metadata.ogImage && (
                  <div>
                    <h3 className="font-medium text-gray-700">Open Graph Image</h3>
                    <div className="mt-2">
                      <img 
                        src={metadata.ogImage} 
                        alt="OG Image" 
                        className="max-w-full h-auto max-h-48 object-contain border border-gray-200 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600 text-sm">
        <p>Website Metadata Fetcher - Enter a URL to extract metadata information</p>
      </footer>
    </div>
  );
}

export default App;