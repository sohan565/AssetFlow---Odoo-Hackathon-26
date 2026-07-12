import sys
import os
import subprocess
import time

def main():
    print("=" * 60)
    print(" Starting AssetFlow - Enterprise Asset & Resource Management System ".center(60, "="))
    print("=" * 60)

    # Resolve paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(base_dir, "frontend")

    processes = []

    # 1. Start backend server
    print("\n[+] Starting FastAPI backend server...")
    backend_cmd = [sys.executable, "server.py"]
    try:
        backend_process = subprocess.Popen(
            backend_cmd,
            cwd=base_dir,
            stdout=None,
            stderr=None,
            shell=True if os.name == 'nt' else False
        )
        processes.append(backend_process)
    except Exception as e:
        print(f"[!] Failed to start backend server: {e}")
        sys.exit(1)

    # 2. Start frontend dev server
    print("[+] Starting Vite frontend development server...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    try:
        frontend_process = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=frontend_dir,
            stdout=None,
            stderr=None,
            shell=True if os.name == 'nt' else False
        )
        processes.append(frontend_process)
    except Exception as e:
        print(f"[!] Failed to start frontend server: {e}")
        backend_process.terminate()
        sys.exit(1)

    print("\n" + "=" * 60)
    print("Both servers are running!")
    print("- Backend API: http://127.0.0.1:8000")
    print("- Swagger Docs: http://127.0.0.1:8000/docs")
    print("- Frontend UI: http://localhost:5173")
    print("Press Ctrl+C to stop both servers.")
    print("=" * 60 + "\n")

    try:
        while True:
            # Monitor processes
            for p in processes:
                if p.poll() is not None:
                    print(f"\n[!] One of the servers stopped unexpectedly (exit code: {p.returncode}). Exiting...")
                    raise KeyboardInterrupt
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[+] Stopping servers...")
        for p in processes:
            try:
                if os.name == 'nt':
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()
            except Exception:
                pass
        print("[+] Both servers stopped. Goodbye!")

if __name__ == "__main__":
    main()
