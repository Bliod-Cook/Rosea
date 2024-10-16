import {BaseDirectory, create, exists, readTextFile} from '@tauri-apps/plugin-fs'
import {parse} from "smol-toml";

export async function getConfig(config: string): Promise<string> {
    if (
        !await exists("config.toml",{baseDir: BaseDirectory.AppData})
    )
    {
        await create("config.toml",{baseDir: BaseDirectory.AppData})
    }
    const file: string = await readTextFile("config.toml", {baseDir: BaseDirectory.AppData});
    try {
        const parsedData = parse(file)
        return String(parsedData[config])
    } catch (e) {
        console.log(e);
        return 'null'
    }
}