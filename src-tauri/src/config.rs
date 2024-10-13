use toml::Value;


pub fn get_config(config: String) -> String {
    // TODO
    let appdata = std::env::var("APPData").unwrap() + "/rosea";
    let file = std::fs::read_to_string(format!("{}/config.toml", &appdata)).unwrap_or_else(|_| {
        std::fs::create_dir_all(&appdata).unwrap();
        std::fs::File::create(format!("{}/config.toml", &appdata)).unwrap();
        std::fs::read_to_string(format!("{}/config.toml", &appdata)).unwrap()
    });
    let value = match file.parse::<toml::Table>() {
        Ok(value) => value,
        Err(_) => return "null".into(),
    };
    match value.get(&config) {
        Some(config) => config.to_string(),
        None => "null".into(),
    }
}

pub fn set_config(config: String, value: String) {
    let appdata = std::env::var("APPData").unwrap() + "/rosea";
    let file = std::fs::read_to_string(format!("{}/config.toml", &appdata)).unwrap_or_else(|_| {
        std::fs::create_dir_all(&appdata).unwrap();
        std::fs::File::create(format!("{}/config.toml", &appdata)).unwrap();
        std::fs::read_to_string(format!("{}/config.toml", &appdata)).unwrap()
    });
    let mut tvalue = match file.parse::<toml::Table>() {
        Ok(value) => value,
        Err(_) => toml::Table::new(),
    };
    match tvalue.get_mut(&config) {
        Some(cfg) => {
            *cfg = Value::from(value);
        }
        None => {
            tvalue.insert(config, Value::from(value));
        }
    };
    std::fs::write(format!("{}/config.toml", &appdata), tvalue.to_string()).unwrap()
}
