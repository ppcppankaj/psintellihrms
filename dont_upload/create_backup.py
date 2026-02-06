import zipfile
import os
from datetime import datetime

# Configuration
SOURCE_DIR = r"c:\Users\ruchi\ppcp\hrms"
DEST_DIR = r"c:\Users\ruchi\ppcp\hrms\dont_upload"
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
ZIP_FILENAME = f"project_backup_{TIMESTAMP}.zip"
ZIP_PATH = os.path.join(DEST_DIR, ZIP_FILENAME)

# Exclusions
EXCLUDE_DIRS = {
    'dont_upload',
    'node_modules',
    'venv',
    '.venv',
    '.git',
    '__pycache__',
    'postgres_data',
    'redis_data',
    '.idea',
    '.vscode',
    'staticfiles',
    'media', # Optional: exclude media if it's large, but usually code backup implies excluding user data
    'dist',
    'build'
}

EXCLUDE_EXTENSIONS = {
    '.pyc',
    '.log',
    '.zip'
}

def should_exclude(dir_name):
    return dir_name in EXCLUDE_DIRS

def zip_directory(source_dir, output_path):
    print(f"Zipping {source_dir} to {output_path}...")
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if not should_exclude(d)]
            
            for file in files:
                if any(file.endswith(ext) for ext in EXCLUDE_EXTENSIONS):
                    continue
                
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                
                # Double check we aren't archiving the zip itself if it's in the source tree
                if file_path == output_path:
                    continue

                try:
                    print(f"Adding {arcname}")
                    zipf.write(file_path, arcname)
                except Exception as e:
                    print(f"Error adding {file_path}: {e}")

if __name__ == "__main__":
    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR)
    
    zip_directory(SOURCE_DIR, ZIP_PATH)
    print(f"\nBackup created successfully at: {ZIP_PATH}")
