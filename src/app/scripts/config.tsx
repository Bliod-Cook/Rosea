import {BaseDirectory, create, exists, readTextFile} from '@tauri-apps/plugin-fs'
import {parse} from "smol-toml";

export async function getConfig(config: string, defaultValue: string = "null"): Promise<string> {
    if (
        !await exists("config.toml",{baseDir: BaseDirectory.AppData})
    )
    {
        await create("config.toml",{baseDir: BaseDirectory.AppData})
    }
    const file: string = await readTextFile("config.toml", {baseDir: BaseDirectory.AppData});
    try {
        const parsedData = parse(file)
        const data = parsedData[config]
        return data === undefined ? defaultValue : String(data)
    } catch (e) {
        console.log(e);
        return defaultValue
    }
}