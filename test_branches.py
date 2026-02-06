import requests
import json

def test_branches():
    login_url = 'http://localhost:8001/api/v1/auth/login/'
    branches_url = 'http://localhost:8001/api/v1/auth/branches/my-branches/'
    
    login_data = {'email': 'admin@psintellihr.com', 'password': 'adminpassword123'}
    r = requests.post(login_url, json=login_data)
    token = r.json()['tokens']['access']
    org_id = r.json()['user']['organization']['id']
    
    headers = {
        'Authorization': f'Bearer {token}',
        'X-Organization-ID': org_id
    }
    
    print(f"Testing branches with Org ID: {org_id}")
    r = requests.get(branches_url, headers=headers)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")

if __name__ == "__main__":
    test_branches()
