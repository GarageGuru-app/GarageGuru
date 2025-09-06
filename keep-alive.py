#!/usr/bin/env python3

"""
ServiceGuru Keep-Alive Script for Render
Pings the deployed app every 2 minutes to prevent spin-down
"""

import requests
import time
import signal
import sys
from datetime import datetime

SERVICEGURU_URL = 'https://garageguru-whh7.onrender.com'
PING_INTERVAL = 2 * 60  # 2 minutes in seconds

class ServiceGuruKeepAlive:
    def __init__(self):
        self.running = True
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'ServiceGuru-KeepAlive/1.0'})
        
    def ping_serviceguru(self):
        """Ping ServiceGuru to keep it alive"""
        try:
            response = self.session.get(SERVICEGURU_URL, timeout=10)
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print(f"✅ [{timestamp}] ServiceGuru pinged successfully - Status: {response.status_code}")
            return True
        except requests.exceptions.RequestException as error:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print(f"❌ [{timestamp}] ServiceGuru ping failed: {error}")
            return False
    
    def signal_handler(self, signum, frame):
        """Handle graceful shutdown"""
        print('\n🛑 ServiceGuru Keep-Alive shutting down...')
        self.running = False
        sys.exit(0)
    
    def run(self):
        """Main keep-alive loop"""
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        print('🚀 ServiceGuru Keep-Alive started')
        print(f'📡 Pinging {SERVICEGURU_URL} every 2 minutes')
        print('⏹️  Press Ctrl+C to stop\n')
        
        # Initial ping
        self.ping_serviceguru()
        
        # Main loop
        while self.running:
            try:
                time.sleep(PING_INTERVAL)
                if self.running:
                    self.ping_serviceguru()
            except KeyboardInterrupt:
                self.signal_handler(signal.SIGINT, None)

if __name__ == '__main__':
    keep_alive = ServiceGuruKeepAlive()
    keep_alive.run()