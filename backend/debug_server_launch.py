import subprocess
import time
import os
import sys

# Get into backend dir
os.chdir(os.path.dirname(os.path.abspath(__file__)))

venv_python = os.path.join(os.path.dirname(os.getcwd()), '.venv', 'Scripts', 'python.exe')

with open('server_debug.log', 'w') as f:
    process = subprocess.Popen(
        [venv_python, '-m', 'uvicorn', 'server:app', '--host', '127.0.0.1', '--port', '8000'],
        stdout=f,
        stderr=subprocess.STDOUT,
        text=True
    )
    time.sleep(10)
    process.poll()
    if process.returncode is not None:
        print(f"Server exited with {process.returncode}")
    else:
        print("Server is still running")
