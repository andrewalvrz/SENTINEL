use std::fs::{self, File};
use std::path::Path;



#[tauri::command]
pub fn create_text_file(file_name: &str) -> Result<(), String> {
    // Use relative path to the data directory
    let test_dir = "../data";
    
    // Ensure the file name has a .txt extension
    let file_name = if file_name.ends_with(".txt") {
        file_name.to_string()
    } else {
        format!("{}.txt", file_name)
    };
    
    // Create full path by combining directory and filename
    let file_path = Path::new(test_dir).join(file_name);
    
    // Create the test directory if it doesn't exist
    std::fs::create_dir_all(test_dir).map_err(|e| e.to_string())?;
    
    // Create the file
    File::create(file_path).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn list_files() -> Result<Vec<(String, String)>, String> {
    let data_dir = "../data";
    
    // Refresh the directory by reading it again
    if !Path::new(data_dir).exists() {
        std::fs::create_dir_all(data_dir).map_err(|e| e.to_string())?;
    }

    // Read directory and collect file names and paths
    let entries = fs::read_dir(data_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let path = entry.path();
            
            if path.is_file() && path.extension().is_some() {
                let file_name = path.file_name()?.to_str()?.to_string();
                let file_path = path.to_str()?.to_string();
                Some((file_name, file_path))
            } else {
                None
            }
        })
        .collect();

    Ok(entries)
}
