import os
import json
import subprocess
import datetime

# --- KONFIGURACE (Upravitelné) ---
OUTPUT_FILE = "_codebase_snapshot.md"
IGNORE_DIRS = {'.git', 'node_modules', '.next', '__pycache__', 'venv', '.vscode', '.idea', 'dist', 'build', 'coverage'}
IGNORE_FILES = {
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.DS_Store', 
    OUTPUT_FILE, '.eslintrc.json', 'tsconfig.tsbuildinfo'
}

# Přípony souborů, které považujeme za binární nebo nezajímavé pro LLM
BINARY_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.sqlite', '.db', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.zip', '.tar', '.gz'}

def run_command(command):
    """Spustí příkaz a vrátí oříznutý výstup."""
    try:
        # Shell=True umožní pipes a složitější příkazy, ale na Windows pozor.
        # Zde používáme jednoduché volání.
        result = subprocess.run(command, shell=True, text=True, capture_output=True)
        return result.stdout.strip()
    except Exception:
        return "N/A"

def get_header():
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return f"# CODEBASE SNAPSHOT\n**Generated:** {timestamp}\n**Generator:** RDM v03.1 (Hybrid Edition)\n\n"

def get_system_context():
    """Získá kontext prostředí (Node, Git, OS)."""
    info = "## 1. System & Environment Context\n\n"
    info += "| Component | Version/Status |\n|---|---|\n"
    
    # Node & NPM
    node = run_command('node -v') or "N/A"
    npm = run_command('npm -v') or "N/A"
    info += f"| Node.js | `{node}` |\n"
    info += f"| NPM | `{npm}` |\n"
    
    # Git Info
    branch = run_command('git branch --show-current') or "N/A"
    remote = run_command('git remote -v').split('\n')[0] if run_command('git remote -v') else "N/A"
    status = "Dirty (Uncommitted changes)" if run_command('git status --porcelain') else "Clean"
    
    info += f"| Git Branch | `{branch}` |\n"
    info += f"| Git Status | `{status}` |\n"
    info += f"| Git Remote | `{remote}` |\n"
    
    info += "\n"
    return info

def analyze_package_json():
    """Inteligentní analýza package.json (inspirováno referenčním skriptem)."""
    if not os.path.exists("package.json"):
        return "## 2. Project Dependencies\n*No package.json found.*\n\n"

    try:
        with open("package.json", "r", encoding='utf-8') as f:
            data = json.load(f)

        out = "## 2. Project Dependencies & Scripts\n\n"
        
        # Scripts
        scripts = data.get("scripts", {})
        if scripts:
            out += "### Available Scripts\n| Command | Definition |\n|---|---|\n"
            for k, v in scripts.items():
                out += f"| `npm run {k}` | `{v}` |\n"
            out += "\n"

        # Dependencies (Sloučené)
        deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
        if deps:
            out += "### Key Libraries\n| Package | Version |\n|---|---|\n"
            # Zobrazíme jen "zajímavé" knihovny, aby seznam nebyl na 10 stran? 
            # Pro RDM je lepší vidět vše, ale stručně.
            for k, v in sorted(deps.items()):
                out += f"| `{k}` | `{v}` |\n"
            out += "\n"
            
        return out
    except Exception as e:
        return f"## 2. Project Dependencies\nError reading package.json: {e}\n\n"

def check_env_files():
    """Bezpečný výpis .env proměnných (pouze klíče)."""
    out = "## 3. Environment Configuration\n"
    env_files = [f for f in os.listdir('.') if f.startswith('.env')]
    
    if not env_files:
        return out + "*No .env files found.*\n\n"

    for file in env_files:
        out += f"### `{file}`\n```properties\n"
        try:
            with open(file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    if '=' in line:
                        key = line.split('=', 1)[0]
                        out += f"{key}=[REDACTED]\n"
        except Exception:
            out += "# Error reading file\n"
        out += "```\n"
    out += "\n"
    return out

def get_tree_structure(startpath='.'):
    """Vizuální strom adresářů."""
    tree = ["## 4. Project Structure", "```text"]
    
    for root, dirs, files in os.walk(startpath):
        # Filtrace adresářů
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * level
        tree.append(f"{indent}{os.path.basename(root)}/")
        
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            if f not in IGNORE_FILES:
                tree.append(f"{subindent}{f}")
                
    tree.append("```\n")
    return "\n".join(tree)

def get_file_contents():
    """Iteruje přes všechny soubory a vypisuje jejich obsah."""
    out = "## 5. File Contents\n\n"
    
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if file in IGNORE_FILES:
                continue
            
            # Kontrola přípony
            _, ext = os.path.splitext(file)
            if ext.lower() in BINARY_EXTENSIONS:
                continue

            path = os.path.join(root, file)
            rel_path = os.path.relpath(path, '.')
            
            out += f"### 📄 `{rel_path}`\n"
            out += "```" + (ext.lstrip('.') if ext else "text") + "\n"
            
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    out += content
            except Exception as e:
                out += f"[Error reading file: {e}]"
            
            out += "\n```\n\n"
            print(f"Captured: {rel_path}")
            
    return out

def main():
    print("📸 Starting RDM Snapshot Generation...")
    
    full_report = ""
    full_report += get_header()
    full_report += get_system_context()
    full_report += analyze_package_json()
    full_report += check_env_files()
    full_report += get_tree_structure()
    full_report += get_file_contents()
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(full_report)
        
    print(f"\n✅ Snapshot complete! Saved to: {OUTPUT_FILE}")
    print("   Ready for RDM Phase 1 (Intake) in the next cycle.")

if __name__ == "__main__":
    main()
