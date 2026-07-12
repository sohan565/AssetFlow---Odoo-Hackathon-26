import sys
import os
import subprocess
import time
import webbrowser

def terminate_process(proc):
    if not proc:
        return
    try:
        if os.name == 'nt':
            # On Windows, use taskkill to terminate the process and all its children (node/vite processes)
            subprocess.run(['taskkill', '/F', '/T', '/PID', str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            proc.terminate()
            proc.wait(timeout=2)
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass

def main():
    print("=" * 60)
    print("      ASSETFLOW ERP - UNIFIED ORCHESTRATOR LAUNCHER      ".center(60))
    print("=" * 60)
    print("Starting background services. Please wait...")

    backend_proc = None
    frontend_proc = None

    try:
        # 1. Start Python FastAPI Backend
        print("\n[+] Launching FastAPI Backend (port 8000)...")
        backend_env = os.environ.copy()
        backend_env["PYTHONUNBUFFERED"] = "1"
        backend_proc = subprocess.Popen(
            [sys.executable, "server.py"],
            env=backend_env
        )

        # 2. Start Frontend Dev Server
        print("[+] Launching Vite Frontend Dev Server (port 5173)...")
        frontend_proc = subprocess.Popen(
            "npm run dev -- --port 5173",
            shell=True,
            cwd=os.path.join(os.getcwd(), "frontend")
        )

        # Give servers a moment to bind to their ports
        time.sleep(3)

        # Check if backend started successfully
        if backend_proc.poll() is not None:
            print("[!] FastAPI Backend failed to start. Check server.py logs.")
            sys.exit(1)

        # 3. Open Web Browser
        web_url = "http://localhost:5173"
        print(f"\n[+] Opening web browser to: {web_url}")
        webbrowser.open(web_url)

        print("\n" + "=" * 60)
        print("          SERVICES ARE UP AND RUNNING SUCCESSFULLY          ".center(60))
        print("=" * 60)
        print("  - Backend API:   http://localhost:8000/docs")
        print("  - Frontend App:  http://localhost:5173")
        print("\n  >> Press CTRL+C at any time to shut down all services cleanly.")
        print("=" * 60 + "\n")

        # Keep the launcher active and monitor processes
        while True:
            time.sleep(1)
            if backend_proc.poll() is not None:
                print("\n[!] Backend server stopped unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("\n[!] Frontend server stopped unexpectedly.")
                break

    except KeyboardInterrupt:
        print("\n\n[+] Shutdown request received.")
    finally:
        print("[+] Terminating backend server...")
        terminate_process(backend_proc)
        print("[+] Terminating frontend server...")
        terminate_process(frontend_proc)
        print("[+] All services stopped cleanly. Goodbye!")

if __name__ == "__main__":
    main()
