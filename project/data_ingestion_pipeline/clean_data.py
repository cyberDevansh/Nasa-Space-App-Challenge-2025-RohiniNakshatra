import os
import openai
import textwrap
from concurrent.futures import ThreadPoolExecutor

openai.api_key = "your api key"

input_dir = "raw_data"
output_dir = "cleaned_data"
os.makedirs(output_dir, exist_ok=True)

PROMPT_TEMPLATE = """I have a NASA Biology publication in HTML format that is split into multiple chunks.
A single paragraph, sentence, or section may look broken in the current chunk.
Your task is to process only the current chunk and return a clean Markdown version without losing any meaningful scientific content.

Follow these rules strictly:

1. Clean and Extract Meaningful Content
- Remove all HTML tags, <head>, <footer>, <script>, CSS, metadata, and any other non-content elements.
- Completely exclude navigation bars, menus, login/logout links, search bars, account settings, “View on publisher site,” buttons, sidebars, cookie notices, and any UI/website functionality text.
- Keep only the actual publication content, such as:
    Article title
    Author names and affiliations
    Abstract, introduction, results, discussion, conclusion
    Paragraphs, sentences, tables, figures, captions, references (if they appear as text)
    Do not discard partial paragraphs or sentences — if a sentence is incomplete, still keep it exactly as it appears.

2. Markdown Formatting Rules
- Convert all headings and subheadings to proper Markdown (#, ##, ###, etc.).
- Preserve the order and structure of the content exactly as it appears in this chunk.
- Do not try to rephrase, summarize, or “fix” broken text — preserve it as-is.

3. Images and Figures
- If the chunk contains any image with a relevant alt text or caption, include it in Markdown format:  ![alt text](image_url)
- If the image has no descriptive text, skip it (do not include placeholder links).
- If a figure caption is present in text near the image, keep it next to the image link.

3a. Links with Descriptive Text
- If the chunk contains a link connected to descriptive text (like “Click here for additional data file”), format it in Markdown as: [descriptive text](link)
- Keep the descriptive text exactly as it appears in the HTML.
- Include any file size, type, or supplementary info as part of the text if it is displayed near the link.
- Do not include links that have no descriptive text (skip bare URLs).

4. Output Format
- Do not wrap the final output inside ```markdown ``` or any fenced code blocks.
- The output should be directly in Markdown syntax.

- The output should be direct Markdown syntax with correct formatting for:
    Headings
    Lists
    Tables (converted from HTML)
    Images

Important Notes:

- Never remove or skip scientific content, even if it’s incomplete or appears in the middle of a sentence.
- Never include UI elements or irrelevant website text (like “Search NCBI,” “Log out,” “Dashboard,” “Add to collections,” etc.).
- The output of this chunk will be concatenated with others later — so focus on accuracy and order, not readability.

Now process the following part of the HTML content:

"""
def summarize_chunk(content):
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that processes NASA Biospace publications."},
            {"role": "user", "content": PROMPT_TEMPLATE + content}
        ],
        temperature=0
    )
    return response.choices[0].message.content.strip()

def chunk_text(text, chunk_size=10000):
    return textwrap.wrap(text, chunk_size)

def process_file(filename):
    """Process a single file."""
    input_path = os.path.join(input_dir, filename)
    output_path = os.path.join(output_dir, filename.replace(".html", ".txt"))

    if os.path.exists(output_path):
        print(f"⏩ Skipping {filename} (already processed).")
        return

    with open(input_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    try:
        chunks = chunk_text(html_content, chunk_size=20000)
        all_summaries = []

        for i, chunk in enumerate(chunks, 1):
            print(f"➡️ Processing chunk {i}/{len(chunks)} of {filename}...")
            summary = summarize_chunk(chunk)
            all_summaries.append(f"\n{summary}")

        final_summary = "\n\n".join(all_summaries)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(final_summary)

        print(f"✅ Summarized and saved: {output_path}")

    except Exception as e:
        print(f"❌ Error processing {filename}: {e}")

if __name__ == "__main__":
    html_files = [f for f in os.listdir(input_dir) if f.endswith(".html")]

    with ThreadPoolExecutor(max_workers=6) as executor:
        executor.map(process_file, html_files)