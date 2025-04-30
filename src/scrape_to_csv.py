import csv
import asyncio
from playwright.sync_api import sync_playwright

def scrape_site(output_file='output.csv'):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page.goto("https://example.com")

       
        rows = page.query_selector_all("table tr")

        data = []
        for row in rows:
            cols = row.query_selector_all("td")
            if not cols:
                continue
            data.append([col.inner_text().strip() for col in cols])

        # Save to CSV
        with open(output_file, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            for row in data:
                writer.writerow(row)

        browser.close()
        print(f"[✓] Data written to {output_file}")

if __name__ == "__main__":
    scrape_site()
