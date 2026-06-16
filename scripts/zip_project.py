import os
import zipfile

def zip_directory(source_dir, output_zip):
    # Normalize paths
    source_dir = os.path.abspath(source_dir)
    output_zip = os.path.abspath(output_zip)
    
    # Define exclusion rules
    exclude_dirs = [
        os.path.join(source_dir, 'Frontend', 'frontend', 'node_modules'),
        os.path.join(source_dir, 'Backend', 'venv'),
        os.path.join(source_dir, 'Backend', '.venv'),
        os.path.join(source_dir, 'Backend', 'tf_gpu'),
        os.path.join(source_dir, '.git'),
        os.path.join(source_dir, 'tmp'),
    ]
    
    exclude_files = [
        os.path.join(source_dir, 'AI_Beautyyy.mp4'),
        os.path.join(source_dir, 'AI_beauty_clip.mp4'),
        output_zip, # Avoid zipping the output file if it is in source_dir
    ]
    
    # Normalize all exclusion paths for safety
    exclude_dirs = [os.path.abspath(d) for d in exclude_dirs]
    exclude_files = [os.path.abspath(f) for f in exclude_files]
    
    print(f"Starting to zip {source_dir} to {output_zip}...")
    print("Excluding directories:")
    for d in exclude_dirs:
        print(f"  - {os.path.relpath(d, source_dir)}")
    print("Excluding files:")
    for f in exclude_files:
        print(f"  - {os.path.relpath(f, source_dir)}")
        
    count = 0
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Exclude directories in-place to prevent os.walk from descending into them
            dirs_to_keep = []
            for d in dirs:
                full_dir_path = os.path.abspath(os.path.join(root, d))
                is_excluded = False
                for ex_dir in exclude_dirs:
                    if full_dir_path == ex_dir or full_dir_path.startswith(ex_dir + os.sep):
                        is_excluded = True
                        break
                if not is_excluded:
                    dirs_to_keep.append(d)
                else:
                    print(f"Skipping directory: {os.path.relpath(full_dir_path, source_dir)}")
            dirs[:] = dirs_to_keep
            
            for file in files:
                full_file_path = os.path.abspath(os.path.join(root, file))
                
                # Check if this file is excluded
                if full_file_path in exclude_files:
                    print(f"Skipping file: {os.path.relpath(full_file_path, source_dir)}")
                    continue
                
                # Double-check if the file is within any excluded directory
                is_in_excluded_dir = False
                for ex_dir in exclude_dirs:
                    if full_file_path.startswith(ex_dir + os.sep):
                        is_in_excluded_dir = True
                        break
                if is_in_excluded_dir:
                    continue
                    
                archive_name = os.path.relpath(full_file_path, source_dir)
                zipf.write(full_file_path, archive_name)
                count += 1
                if count % 200 == 0:
                    print(f"Added {count} files...")
                    
    print(f"\nSuccessfully created zip archive with {count} files: {output_zip}")
    print(f"Zip size: {os.path.getsize(output_zip) / (1024*1024):.2f} MB")

if __name__ == "__main__":
    src = r"d:\AI_Beauty_consultant"
    dest = r"d:\AI_Beauty_consultant_clean.zip"
    zip_directory(src, dest)
