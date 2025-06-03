import requests
import json
import re

def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', "", name).strip()

def run_prompt(topic, model="llama3.1:8b"):
    url = "http://localhost:11434/api/generate"
    headers = {"Content-Type": "application/json"}

    prompt = (
        f"Write a detailed, well-structured blog post that clearly explains the concept of what is'{topic}'."
        f"The article should include an engaging introduction, clear definitions, relevant examples, and, if applicable, historical context or real-world applications. "
        f"Format the output as raw HTML code only—no additional text or explanation. Ensure proper use of semantic HTML tags such as <article>, <header>, <section>, <h1> through <h3>, <p>, <ul>, <ol>, and <code> where needed."
        f"Don't use any external link or image"
        f"Use Tailwind CSS for styling, make it responsive and visually appealing for a blog. "
        f"Do NOT include any markdown code blocks, triple backticks, or any text outside the HTML tags. "
        f"Starting line of your output will be <!DOCTYPE html>"
        )


    data = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    try:
        print("[~] Sending request to Ollama API...")
        response = requests.post(url, headers=headers, data=json.dumps(data), timeout=60)

        if response.status_code == 200:
            return response.json().get("response", "")
        else:
            print(f"[!] Error: {response.status_code} - {response.text}")
            return None

    except requests.exceptions.RequestException as e:
        print(f"[!] Request failed: {e}")
        return None

def main():
    topic = input("Enter a topic for the blog: ").strip()
    filename = sanitize_filename(topic) + ".txt"
    output = run_prompt(topic)

    if output:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"[✓] Output saved to '{filename}'.")
    else:
        print("[!] No output received.")

if __name__ == "__main__":
    main()
