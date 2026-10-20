# Serves this folder at http://localhost:8000 with caching turned off, so
# Chrome always loads the latest project files (plain `python -m http.server`
# lets Chrome keep old copies of the scripts and pages).
#   python serve.py        then open http://localhost:8000/
import http.server, socketserver, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

NoCache.extensions_map.update({".js": "text/javascript", ".mjs": "text/javascript"})
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), NoCache) as httpd:
    print("Serving with caching off at http://localhost:%d/  (Ctrl+C to stop)" % PORT)
    httpd.serve_forever()
