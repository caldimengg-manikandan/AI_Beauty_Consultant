import os

def find_large_directories(start_dir):
    start_dir = os.path.abspath(start_dir)
    exclude_dirs = [
        os.path.join(start_dir, 'Frontend', 'frontend', 'node_modules'),
        os.path.join(start_dir, 'Backend', 'venv'),
        os.path.join(start_dir, 'Backend', '.venv'),
        os.path.join(start_dir, '.git'),
    ]
    exclude_dirs = [os.path.abspath(d) for d in exclude_dirs]
    
    dir_sizes = {}
    file_list = []
    
    for root, dirs, files in os.walk(start_dir):
        # Prevent traversing excluded dirs
        dirs[:] = [d for d in dirs if os.path.abspath(os.path.join(root, d)) not in exclude_dirs]
        
        for file in files:
            full_path = os.path.join(root, file)
            try:
                size = os.path.getsize(full_path)
                file_list.append((full_path, size))
                
                # Add to parent directories
                parent = root
                while parent.startswith(start_dir):
                    dir_sizes[parent] = dir_sizes.get(parent, 0) + size
                    if parent == start_dir:
                        break
                    parent = os.path.dirname(parent)
            except Exception as e:
                pass

    print("\n--- TOP 15 LARGEST DIRECTORIES (Excluding node_modules & venv) ---")
    sorted_dirs = sorted(dir_sizes.items(), key=lambda x: x[1], reverse=True)
    for d, sz in sorted_dirs[:15]:
        print(f"{sz / (1024*1024):.2f} MB: {os.path.relpath(d, start_dir)}")

    print("\n--- TOP 15 LARGEST FILES ---")
    sorted_files = sorted(file_list, key=lambda x: x[1], reverse=True)
    for f, sz in sorted_files[:15]:
        print(f"{sz / (1024*1024):.2f} MB: {os.path.relpath(f, start_dir)}")

if __name__ == "__main__":
    find_large_directories(r"d:\AI_Beauty_consultant")
