import requests
import json

def run_prompt(prompt, model="llama3.1:8b"):
    url = "http://localhost:11434/api/generate"
    headers = {"Content-Type": "application/json"}
    data = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    try:
        print("[~] Sending prompt to Ollama API...")
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
    prompt = input("Enter your prompt: ")
    output = run_prompt(prompt)

    if output:
        with open("ollama_output.txt", "w", encoding="utf-8") as f:
            f.write(output)
        print("[✓] Output saved to 'ollama_output.txt'.")
    else:
        print("[!] No output received.")

if __name__ == "__main__":
    main()
