import requests
import json
import sys

# Force UTF-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8001"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login/"
PROFILE_URL = f"{BASE_URL}/api/v1/auth/profile/"

def debug_test():
    try:
        print(f"DEBUG: Logging in to {LOGIN_URL}...")
        response = requests.post(LOGIN_URL, data={"email": "admin@psintellihr.com", "password": "adminpassword123"})
        if response.status_code == 200:
            print("DEBUG: Login successful!")
            tokens = response.json().get('tokens')
            access_token = tokens.get('access')
            
            # Profile
            print(f"DEBUG: Accessing profile at {PROFILE_URL}...")
            headers = {"Authorization": f"Bearer {access_token}"}
            profile_response = requests.get(PROFILE_URL, headers=headers)
            print(f"DEBUG: Profile Status Code: {profile_response.status_code}")
            
            if profile_response.status_code != 200:
                print("DEBUG: Profile access FAILED.")
                error_content = profile_response.text
                
                # Check for stack trace
                if "Traceback" in error_content or "Exception" in error_content:
                  # Extract traceback only
                  lines = error_content.split('\n')
                  start = -1
                  end = -1
                  for i, line in enumerate(lines):
                     if "Traceback (most recent call last):" in line:
                        start = i
                     if "The above exception was" in line:
                        end = i
                  
                  if start != -1: # found traceback
                      # Print nearby lines plus trace
                      end_idx = end if end != -1 else len(lines)
                      trace = "\n".join(lines[start:end_idx+20])
                      # Remove html tags clumsily
                      import re
                      trace = re.sub(r'<[^>]*>', '', trace)
                      print("--- TRACEBACK ---")
                      print(trace)
                      print("--- END TRACEBACK ---")
                  else:
                      id_err = error_content.find("Exception Value")
                      if id_err != -1:
                          print("--- EXCEPTION ---")
                          print(error_content[id_err:id_err+200]) # just show context
                          print("--- END ---")
                      else:
                          # Just dump text
                          print(error_content[:2000])

                from html.parser import HTMLParser

                class MyHTMLParser(HTMLParser):
                    def __init__(self):
                        super().__init__()
                        self.data = []
                    
                    def handle_data(self, data):
                         if data.strip():
                             self.data.append(data.strip())
                
                print("--- ERROR CONTENT (TEXT ONLY) ---")
                parser = MyHTMLParser()
                parser.feed(error_content)
                text_content = "\n".join(parser.data)
                
                # Filter for useful lines
                useful_lines = []
                capture = False
                for line in text_content.split('\n'):
                    if "Exception" in line or "Traceback" in line or "File" in line:
                        capture = True
                    if capture:
                        useful_lines.append(line)
                    if len(useful_lines) > 50: # Limit output
                         break
                
                print("\n".join(useful_lines))
                print("--- END ERROR CONTENT ---")
            else:
                print("DEBUG: Profile access SUCCESS!")
                
        else:
            print(f"DEBUG: Login failed with status {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"DEBUG: Exception during test: {e}")

if __name__ == "__main__":
    debug_test()
