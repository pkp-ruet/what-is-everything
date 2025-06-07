import requests
import json
import re
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

def sanitize_filename(name):
    """Sanitizes a string to be used as a filename."""
    return re.sub(r'[\\/*?:"<>|]', "", name).strip()

def clean_html_output(html_string):
    """
    Cleans the HTML string by removing any text before <!DOCTYPE html>
    and any text after </html>.
    """
    start_tag = "<!DOCTYPE html>"
    end_tag = "</html>"

    start_index = html_string.find(start_tag)
    end_index = html_string.find(end_tag)

    if start_index != -1 and end_index != -1:
        end_of_html_tag = end_index + len(end_tag)
        cleaned_html = html_string[start_index:end_of_html_tag]
        return cleaned_html.strip()
    else:
        print(f"[!] Warning: <!DOCTYPE html> or </html> tags not found in output. Returning original string.")
        return html_string

def run_prompt(topic, model="llama3.1:8b"):
    """
    Sends a prompt to the Ollama API to generate a blog post.
    Includes enhanced prompt directives for tone and style.
    Returns (topic, output) or (topic, None) for easier processing of results.
    """
    url = "http://localhost:11434/api/generate"
    headers = {"Content-Type": "application/json"}

    prompt = (
        f"Write a detailed, well-structured blog post that clearly explains the concept of '{topic}'. "
        f"The article should be: "
        f"1. **Easy to Understand & Concise:** Use simple language, avoid jargon where possible, and explain complex ideas clearly and briefly. "
        f"2. **Engaging & Interesting:** Capture the reader's attention from the start. Use relatable analogies, compelling questions, and a friendly, informal tone. "
        f"3. **Humorous (where appropriate):** Inject lighthearted humor and wit naturally to make the content more enjoyable and memorable. "
        f"4. **Actionable/Relatable:** Connect the concept to everyday life or practical applications where possible. "
        f"The article must include: an engaging introduction, clear definitions, relevant examples, and, if applicable, historical context or real-world applications. "
        f"Format the output as raw HTML code only—no additional text or explanation. Ensure proper use of semantic HTML tags suchs as <article>, <header>, <section>, <h1> through 3, <p>, <ul>, <ol>, and <code> where needed. "
        f"Don't use any external link or image. "
        f"**Crucially, use the following Tailwind CSS CDN link in the &lt;head&gt; section: &lt;script src=\"https://cdn.tailwindcss.com\"&gt;&lt;/script&gt; to ensure responsive and visually appealing styling.** "
        f"Do NOT include any markdown code blocks, triple backticks, or any text outside the HTML tags. "
        f"Starting line of your output will be <!DOCTYPE html>"
    )

    data = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    try:
        print(f"[~] Sending request for topic: '{topic}' to Ollama API...")
        response = requests.post(url, headers=headers, data=json.dumps(data), timeout=600)

        if response.status_code == 200:
            raw_output = response.json().get("response", "")
            cleaned_output = clean_html_output(raw_output)
            return topic, cleaned_output
        else:
            print(f"[!] Error for '{topic}': {response.status_code} - {response.text}")
            return topic, None
    except requests.exceptions.RequestException as e:
        print(f"[!] Request for '{topic}' failed: {e}")
        return topic, None

def main():
    topics_file_path = "topics.txt"
    # --- CHANGE MADE HERE ---
    # Define the output folder path. os.path.join handles cross-platform paths ('/' or '\').
    output_folder = os.path.join("server", "text-files") 
    # --- END CHANGE ---
    max_workers = 4

    # This creates the 'server' folder if it doesn't exist, and then 'text-files' inside it.
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        print(f"[i] Created output folder: '{output_folder}'")

    try:
        with open(topics_file_path, "r", encoding="utf-8") as f:
            topics = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"[!] Error: Topics file '{topics_file_path}' not found. Please create it.")
        return

    if not topics:
        print("[!] No topics found in the file. Please add topics to 'topics.txt'.")
        return

    print(f"[i] Found {len(topics)} topics to process.")
    print(f"[i] Using a ThreadPoolExecutor with {max_workers} workers for parallel processing.")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_topic = {executor.submit(run_prompt, topic): topic for topic in topics}

        for i, future in enumerate(as_completed(future_to_topic)):
            original_topic = future_to_topic[future]
            print(f"\n--- Completed Topic {i+1}/{len(topics)}: '{original_topic}' ---")
            
            try:
                topic_result, output = future.result()
                if output:
                    sanitized_topic = sanitize_filename(topic_result)
                    # Files will now be saved inside server/text-files
                    filename = os.path.join(output_folder, f"What is {sanitized_topic}.txt")
                    
                    with open(filename, "w", encoding="utf-8") as f:
                        f.write(output)
                    print(f"[✓] Blog post for '{topic_result}' saved to '{filename}'.")
                else:
                    print(f"[!] Failed to generate blog post for '{topic_result}'.")
            except Exception as exc:
                print(f"[!] Topic '{original_topic}' generated an exception: {exc}")

if __name__ == "__main__":
    main()