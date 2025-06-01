import requests
import json

def run_prompt(topic, model="llama3.1:8b"):
    url = "http://localhost:11434/api/generate"
    headers = {"Content-Type": "application/json"}

    prompt = (
        f"Write a well-written, storytelling-style blog post about '{topic}' and return only the raw HTML code. "
        f"Use Tailwind CSS for styling, make it responsive and visually appealing for a blog. "
        f"Do NOT include any markdown code blocks, backticks, or any text outside the HTML tags. "
        f"Output strictly the HTML content only."
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
    html_output = run_prompt(topic)

    if html_output:
        filename = "ollama_output.html"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(html_output)
        print(f"[✓] HTML content saved to '{filename}'.")
    else:
        print("[!] No HTML output received.")

if __name__ == "__main__":
    main()
