import os
import sys
sys.path.append(os.getcwd())
try:
    from server import app
    print("SUCCESS: server app imported")
except NameError as e:
    print(f"NAMEERROR: {e}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
