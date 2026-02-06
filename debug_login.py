import requests
import json

def debug_full_flow():
    base_url = 'http://localhost:8001/api/v1'
    login_url = f'{base_url}/auth/login/'
    profile_url = f'{base_url}/auth/profile/'
    branches_url = f'{base_url}/auth/branches/my-branches/'
    
    login_data = {
        'email': 'admin@psintellihr.com',
        'password': 'adminpassword123'
    }
    
    print(f"1. Attempting login to {login_url}...")
    r = requests.post(login_url, json=login_data)
    print(f"   Status Code: {r.status_code}")
    
    if r.status_code != 200:
        print(f"   Login failed! {r.text[:500]}")
        return

    res_data = r.json()
    tokens = res_data.get('tokens')
    if not tokens:
        print("   No tokens in response!")
        return
        
    access_token = tokens.get('access')
    user = res_data.get('user', {})
    org_id = user.get('organization', {}).get('id')
    
    print(f"   Logged in as: {user.get('full_name')} ({user.get('email')})")
    print(f"   Organization ID: {org_id}")
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'X-Organization-ID': org_id
    }
    
    print(f"\n2. Attempting to get profile from {profile_url}...")
    r = requests.get(profile_url, headers=headers)
    print(f"   Status Code: {r.status_code}")
    if r.status_code == 200:
        print(f"   Profile data: {json.dumps(r.json(), indent=2)}")
    else:
        print(f"   Profile failed: {r.text[:500]}")
        
    print(f"\n3. Attempting to get branches from {branches_url}...")
    r = requests.get(branches_url, headers=headers)
    print(f"   Status Code: {r.status_code}")
    if r.status_code == 200:
        print(f"   Branches data: {json.dumps(r.json(), indent=2)}")
    else:
        print(f"   Branches failed: {r.text[:500]}")

if __name__ == "__main__":
    debug_full_flow()
