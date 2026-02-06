import os
import re

def find_unregistered_models():
    apps_dir = 'backend/apps'
    missing = {}
    
    ignore_models = {
        'TimeStampedModel', 'SoftDeleteModel', 'AuditModel', 'HistoricalModel', 
        'TaggableModel', 'MetadataModel', 'OrderedModel', 'EnterpriseModel', 
        'OrganizationEntity', 'BranchEntity'
    }
    
    for app in os.listdir(apps_dir):
        app_path = os.path.join(apps_dir, app)
        if not os.path.isdir(app_path):
            continue
            
        models_file = os.path.join(app_path, 'models.py')
        admin_file = os.path.join(app_path, 'admin.py')
        
        if not os.path.exists(models_file):
            continue
            
        with open(models_file, 'r', encoding='utf-8') as f:
            models_content = f.read()
            
        # Refined regex for class names
        models = re.findall(r'class\s+(\w+)\s*\(', models_content)
        # Filter for models (usually have models.Model or some base class mentioned in the file)
        # For simplicity, we'll just check if they inherit from something that looks like a model
        actual_models = []
        for model in models:
            if model in ignore_models:
                continue
            # Basic check if it's likely a model (following class definition usually has fields)
            class_body_match = re.search(fr'class\s+{model}.*?:\s+(.*?)(?=\nclass|\Z)', models_content, re.DOTALL)
            if class_body_match and ('models.' in class_body_match.group(1) or 'Field' in class_body_match.group(1)):
                actual_models.append(model)
        
        if not actual_models:
            continue

        admin_content = ""
        if os.path.exists(admin_file):
            with open(admin_file, 'r', encoding='utf-8') as f:
                admin_content = f.read()
            
        app_missing = []
        for model in actual_models:
            if f'@admin.register({model})' not in admin_content and \
               f'admin.site.register({model}' not in admin_content and \
               f'model = {model}' not in admin_content:
                app_missing.append(model)
                    
        if app_missing:
            missing[app] = app_missing
            
    return missing

if __name__ == "__main__":
    missing = find_unregistered_models()
    for app, m_list in missing.items():
        if m_list:
            print(f"App: {app}")
            for m in m_list:
                print(f"  - {m}")
