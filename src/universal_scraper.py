from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright
import csv
import time
import sys

visited = set()
data_rows = []

def log(msg):
    print(msg, flush=True)

def extract_data(html, page_url):
    soup = BeautifulSoup(html, 'html.parser')
    results = []

    for tag in soup.find_all(['h1', 'h2', 'h3', 'p', 'li', 'span']):
        text = tag.get_text(strip=True)
        if text:
            results.append({'type': 'text', 'content': text, 'source': page_url})

    for table in soup.find_all('table'):
        headers = [th.get_text(strip=True) for th in table.find_all('th')]
        for row in table.find_all('tr'):
            cells = [td.get_text(strip=True) for td in row.find_all('td')]
            if cells:
                row_data = dict(zip(headers, cells)) if headers else {f"column_{i}": val for i, val in enumerate(cells)}
                row_data['type'] = 'table'
                row_data['source'] = page_url
                results.append(row_data)

    for img in soup.find_all('img'):
        src = img.get('src')
        alt = img.get('alt', '')
        if src:
            results.append({
                'type': 'image',
                'alt': alt,
                'src': urljoin(page_url, src),
                'source': page_url
            })

    return results

def is_internal_link(base_url, link):
    base_domain = urlparse(base_url).netloc
    link_domain = urlparse(link).netloc
    return (not link_domain) or (link_domain == base_domain)

def scrape_site(start_url, max_pages=1000):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        to_visit = [start_url]

        while to_visit and len(visited) < max_pages:
            url = to_visit.pop(0)
            if url in visited:
                continue
            try:
                log(f"[+] Visiting: {url}")
                page.goto(url, timeout=60000, wait_until='domcontentloaded')
                time.sleep(1.5)
                html = page.content()
                visited.add(url)

                extracted = extract_data(html, url)
                data_rows.extend(extracted)
                log(f"[✓] Extracted {len(extracted)} elements from {url}")

                soup = BeautifulSoup(html, 'html.parser')
                for link_tag in soup.find_all('a', href=True):
                    full_url = urljoin(url, link_tag['href'].split('#')[0])
                    if is_internal_link(start_url, full_url) and full_url not in visited:
                        to_visit.append(full_url)

            except Exception as e:
                log(f\"[!] Failed to visit {url}: {e}\")

        browser.close()

    if not data_rows:
        log(\"[-] No data extracted.\")
        return

    keys = sorted(set().union(*(row.keys() for row in data_rows)))
    with open(\"full_site_output.csv\", \"w\", newline=\"\", encoding=\"utf-8\") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data_rows)

    log(f\"[✓] Scraped {len(visited)} pages. CSV saved as full_site_output.csv\")

if __name__ == \"__main__\":
    if len(sys.argv) < 2:
        log(\"Usage: python universal_scraper.py <url>\")
    else:
        scrape_site(sys.argv[1])
