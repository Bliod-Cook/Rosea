import {BaseDirectory, create, exists, readTextFile} from "@tauri-apps/plugin-fs";
import TOML from "@ltd/j-toml";

export async function rConfig(): Promise<[number, number, boolean]> {
    if (!(await exists('config.toml', {baseDir: BaseDirectory.AppLocalData}))) {
        await create('config.toml', {baseDir: BaseDirectory.AppLocalData})
    }
    const config = (await readTextFile('config.toml', {baseDir: BaseDirectory.AppLocalData})).slice(1, -1).split(",").join("\n")
    const configData = TOML.parse(
        config
    )
    const maxN = Number(configData["random_max"] ?? 48)
    const minN = Number(configData["random_min"] ?? 1)
    const showName = Boolean(configData["show_name"] ?? false)
    return [minN, maxN, showName]
}