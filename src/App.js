import React, { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
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
      
      // Extract additional metadata
      const metadataObj = {
        title: doc.querySelector('title')?.textContent || 'No title found',
        description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || 'No description found',
        ogTitle: doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || 'No Open Graph title found',
        ogDescription: doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || 'No Open Graph description found',
        ogImage: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || null,
        favicon: doc.querySelector('link[rel="icon"]')?.getAttribute('href') || 
                doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') || null,
        author: doc.querySelector('meta[name="author"]')?.getAttribute('content') || null,
        keywords: doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || null,
        themeColor: doc.querySelector('meta[name="theme-color"]')?.getAttribute('content') || null
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

  // Function to extract domain from URL for display
  const extractDomain = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain;
    } catch {
      return url;
    }
  };

  // Add these styles in App.css or import them directly
  const styles = {
    app: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(to bottom, #f7f9fc, #e3e8f0)'
    },
    header: {
      background: '#4f46e5',
      color: 'white',
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    headerContent: {
      maxWidth: '1000px',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center'
    },
    logoContainer: {
      width: '36px',
      height: '36px',
      marginRight: '12px',
      background: 'rgba(255,255,255,0.2)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    logo: {
      color: 'white'
    },
    appTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      letterSpacing: '-0.5px',
      margin: 0
    },
    main: {
      flexGrow: 1,
      padding: '48px 16px',
    },
    container: {
      maxWidth: '1000px',
      margin: '0 auto'
    },
    intro: {
      textAlign: 'center',
      marginBottom: '40px'
    },
    introTitle: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#1a202c',
      marginBottom: '12px'
    },
    introText: {
      color: '#4a5568',
      maxWidth: '600px',
      margin: '0 auto'
    },
    formContainer: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
      padding: '24px',
      marginBottom: '32px',
      transition: 'all 0.3s ease',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    inputContainer: {
      position: 'relative',
      flexGrow: 1
    },
    inputIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#a0aec0',
      pointerEvents: 'none'
    },
    input: {
      width: '100%',
      padding: '16px 16px 16px 40px',
      border: 'none',
      borderRadius: '8px',
      background: '#f7fafc',
      fontSize: '16px',
      transition: 'all 0.2s',
    },
    submitBtn: {
      background: '#4f46e5',
      color: 'white',
      padding: '16px 24px',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '500',
      fontSize: '16px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s',
    },
    errorContainer: {
      background: 'white',
      borderLeft: '4px solid #e53e3e',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      padding: '20px',
      marginBottom: '32px',
      display: 'flex',
      alignItems: 'flex-start'
    },
    errorIcon: {
      color: '#e53e3e',
      marginRight: '12px',
      marginTop: '2px',
      flexShrink: 0
    },
    errorMessage: {
      color: '#1a202c',
      fontWeight: '500',
      marginBottom: '4px'
    },
    errorHelp: {
      color: '#4a5568',
      fontSize: '14px'
    },
    loaderContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '64px 0'
    },
    loader: {
      width: '64px',
      height: '64px',
      border: '4px solid rgba(79, 70, 229, 0.1)',
      borderTopColor: '#4f46e5',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    resultsContainer: {
      background: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease'
    },
    resultsHeader: {
      background: '#4f46e5',
      color: 'white',
      padding: '24px'
    },
    resultsHeaderContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    resultsDomain: {
      fontSize: '20px',
      fontWeight: '600',
      margin: 0
    },
    themeColorContainer: {
      display: 'flex',
      alignItems: 'center'
    },
    themeColorSwatch: {
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      marginRight: '8px'
    },
    themeColorText: {
      fontSize: '12px',
      opacity: '0.9'
    },
    resultsBody: {
      padding: '24px'
    },
    resultsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '32px'
    },
    metadataGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    metadataCard: {
      background: '#f7fafc',
      padding: '16px',
      borderRadius: '8px'
    },
    metadataTitle: {
      fontSize: '12px',
      textTransform: 'uppercase',
      color: '#718096',
      fontWeight: '600',
      marginBottom: '8px'
    },
    metadataContent: {
      color: '#1a202c'
    },
    keywordTags: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px'
    },
    keywordTag: {
      background: '#ebf4ff',
      color: '#3182ce',
      fontSize: '12px',
      padding: '4px 8px',
      borderRadius: '4px'
    },
    imageContainer: {
      background: '#f7fafc',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '24px'
    },
    ogImage: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      background: '#e2e8f0',
      aspectRatio: '16/9'
    },
    imageUrl: {
      marginTop: '12px',
      color: '#718096',
      fontSize: '12px',
      overflowWrap: 'break-word',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    faviconContainer: {
      background: '#f7fafc',
      padding: '16px',
      borderRadius: '8px'
    },
    faviconWrapper: {
      display: 'flex',
      alignItems: 'center'
    },
    faviconBox: {
      background: 'white',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      border: '1px solid #e2e8f0'
    },
    faviconUrl: {
      marginLeft: '16px',
      color: '#718096',
      fontSize: '12px',
      maxWidth: '300px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    resultsFooter: {
      borderTop: '1px solid #e2e8f0',
      padding: '16px',
      background: '#f7fafc'
    },
    websiteLink: {
      color: '#4f46e5',
      fontWeight: '500',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      transition: 'color 0.2s'
    },
    footer: {
      background: '#1a202c',
      color: '#a0aec0',
      padding: '32px 16px'
    },
    footerContent: {
      maxWidth: '1000px',
      margin: '0 auto',
      textAlign: 'center'
    },
    footerLogo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px'
    },
    footerAppName: {
      fontWeight: '500',
      color: 'white',
      marginLeft: '8px'
    },
    footerText: {
      fontSize: '14px'
    },
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoContainer}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.logo}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
          <h1 style={styles.appTitle}>MetaSnap</h1>
        </div>
      </header>
      
      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.intro}>
            <h2 style={styles.introTitle}>Extract Website Metadata</h2>
            <p style={styles.introText}>Instantly fetch and display metadata from any website by entering the URL below</p>
          </div>
          
          <div style={styles.formContainer}>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={{display: 'flex', flexDirection: window.innerWidth > 768 ? 'row' : 'column', gap: '12px'}}>
                <div style={styles.inputContainer}>
                  <div style={styles.inputIcon}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter website URL (e.g. https://example.com)"
                    value={url}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  style={{...styles.submitBtn, 
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" 
                        style={{animation: 'spin 1s linear infinite'}}>
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                        <path d="M12 2a10 10 0 0 1 10 10"></path>
                      </svg>
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <span>Fetch Metadata</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {error && (
            <div style={styles.errorContainer}>
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" style={styles.errorIcon}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <div>
                <p style={styles.errorMessage}>{error}</p>
                <p style={styles.errorHelp}>Make sure the URL is correct and includes the protocol (http:// or https://)</p>
              </div>
            </div>
          )}
          
          {loading && (
            <div style={styles.loaderContainer}>
              <div style={styles.loader}></div>
            </div>
          )}
          
          {metadata && (
            <div style={styles.resultsContainer}>
              <div style={styles.resultsHeader}>
                <div style={styles.resultsHeaderContent}>
                  <h2 style={styles.resultsDomain}>Metadata for {extractDomain(url)}</h2>
                  {metadata.themeColor && (
                    <div style={styles.themeColorContainer}>
                      <div style={{...styles.themeColorSwatch, backgroundColor: metadata.themeColor}}></div>
                      <span style={styles.themeColorText}>Theme Color: {metadata.themeColor}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={styles.resultsBody}>
                <div style={styles.resultsGrid}>
                  <div style={styles.metadataGroup}>
                    <div style={styles.metadataCard}>
                      <h3 style={styles.metadataTitle}>Page Title</h3>
                      <p style={styles.metadataContent}>{metadata.title}</p>
                    </div>
                    
                    <div style={styles.metadataCard}>
                      <h3 style={styles.metadataTitle}>Meta Description</h3>
                      <p style={styles.metadataContent}>{metadata.description}</p>
                    </div>
                    
                    <div style={styles.metadataCard}>
                      <h3 style={styles.metadataTitle}>Open Graph Title</h3>
                      <p style={styles.metadataContent}>{metadata.ogTitle}</p>
                    </div>
                    
                    <div style={styles.metadataCard}>
                      <h3 style={styles.metadataTitle}>Open Graph Description</h3>
                      <p style={styles.metadataContent}>{metadata.ogDescription}</p>
                    </div>
                    
                    {metadata.author && (
                      <div style={styles.metadataCard}>
                        <h3 style={styles.metadataTitle}>Author</h3>
                        <p style={styles.metadataContent}>{metadata.author}</p>
                      </div>
                    )}
                    
                    {metadata.keywords && (
                      <div style={styles.metadataCard}>
                        <h3 style={styles.metadataTitle}>Keywords</h3>
                        <div style={styles.keywordTags}>
                          {metadata.keywords.split(',').map((keyword, index) => (
                            <span key={index} style={styles.keywordTag}>
                              {keyword.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div style={styles.metadataGroup}>
                    {metadata.ogImage && (
                      <div style={styles.imageContainer}>
                        <h3 style={styles.metadataTitle}>Open Graph Image</h3>
                        <div style={styles.ogImage}>
                          <img 
                            src={metadata.ogImage} 
                            alt="OG Image"
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/api/placeholder/400/320";
                            }}
                          />
                        </div>
                        <p style={styles.imageUrl}>{metadata.ogImage}</p>
                      </div>
                    )}
                    
                    {metadata.favicon && (
                      <div style={styles.faviconContainer}>
                        <h3 style={styles.metadataTitle}>Favicon</h3>
                        <div style={styles.faviconWrapper}>
                          <div style={styles.faviconBox}>
                            <img 
                              src={metadata.favicon.startsWith('http') ? metadata.favicon : `${new URL(url).origin}${metadata.favicon}`} 
                              alt="Favicon" 
                              style={{height: '40px', width: '40px', objectFit: 'contain'}}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/api/placeholder/32/32";
                              }}
                            />
                          </div>
                          <div style={styles.faviconUrl}>{metadata.favicon}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={styles.resultsFooter}>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={styles.websiteLink}
                >
                  Visit website
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" style={{marginLeft: '4px'}}>
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerLogo}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" style={{color: '#a0aec0'}}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span style={styles.footerAppName}>MetaSnap</span>
          </div>
          <p style={styles.footerText}>A modern tool for extracting and viewing website metadata</p>
        </div>
      </footer>
    </div>
  );
}

export default App;