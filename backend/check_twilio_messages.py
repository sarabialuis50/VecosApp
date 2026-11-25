
import os
import sys
from dotenv import load_dotenv

sys.path.append(os.getcwd())
from whatsapp_agent import get_twilio_client, GLOBAL_TWILIO_NUMBER
from datetime import datetime, timedelta

load_dotenv()

def check_twilio_logs():
    client = get_twilio_client()
    # check messages in the last 2 hours
    date_sent = datetime.utcnow()
    messages = client.messages.list(limit=200)
    with open("twilio_log.txt", "w", encoding="utf-8") as f:
        f.write("=== Last 200 Twilio Messages ===\n")
        out_cnt = 0
        for msg in messages:
            if msg.body and ("Nuevo Pedido" in msg.body or "TOTAL" in msg.body):
                body_snippet = msg.body[:80].replace('\n', ' ')
                f.write(f"[{msg.date_created}] {msg.from_} -> {msg.to} | Status: {msg.status} | ErrCode: {msg.error_code} | Body: {body_snippet}\n")
                out_cnt += 1
            if out_cnt > 20: break

if __name__ == "__main__":
    check_twilio_logs()
