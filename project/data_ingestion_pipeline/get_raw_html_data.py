import os
import csv
import requests
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from bs4 import BeautifulSoup

csv_file = "SB_publication_PMC.csv"

output_dir = "raw_data"
os.makedirs(output_dir, exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/116.0 Safari/537.36"
}

def clean_filename(name):
    """Remove invalid characters for filenames"""
    return re.sub(r'[\\/*?:"<>|]', "_", name)

def fetch_and_save(title, url, counter):
    """Fetch a single URL, extract <article>, and save HTML"""
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            article = soup.find("article")
            if article:
                content = str(article)
            else:
                content = "<!-- Article tag not found -->\n" + response.text

            file_path = os.path.join(output_dir, f"{title}.html")
            with open(file_path, "w", encoding="utf-8") as file:
                file.write(content)

            return f"✅ [{counter}] Saved {title}.html"
        else:
            return f"❌ [{counter}] Failed {title}, Status: {response.status_code}"
    except Exception as e:
        return f"⚠️ [{counter}] Error fetching {title}: {e}"

tasks = []
with open(csv_file, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    counter = 1
    for row in reader:
        title = clean_filename(row["Title"].strip())
        url = row["Link"].strip()
        tasks.append((title, url, counter))
        counter += 1

max_workers = 10  
with ThreadPoolExecutor(max_workers=max_workers) as executor:
    futures = [executor.submit(fetch_and_save, t, u, c) for t, u, c in tasks]
    for future in as_completed(futures):
        print(future.result())
