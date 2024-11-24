import "./randomer.css"
import {BaseSyntheticEvent, useState} from "react";
import "./chance.js"
import {getCurrentWindow} from "@tauri-apps/api/window";
import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";
import {BaseDirectory, create, exists, readTextFile} from "@tauri-apps/plugin-fs";
import TOML from "@ltd/j-toml";

export default function RandomPage() {
    const [randomNumber, setRandomNumber] = useState(0)

    async function random() {
        if (!(await exists('config.toml', {baseDir: BaseDirectory.AppLocalData}))) {
            await create('config.toml', {baseDir: BaseDirectory.AppLocalData})
        }
        const configData = TOML.parse(
            (await readTextFile('config.toml', {baseDir: BaseDirectory.AppLocalData})).slice(1, -1).split(",").join("\n")
        )
        // TODO: Get Random Number
        const max = Number(configData["random_max"] ?? 48);
        const min = Number(configData["random_min"] ?? 1);
        const random_number = Math.floor(
            // @ts-ignore
            chance.integer({min: min, max: max})
        )
        setRandomNumber(
            random_number
        )
    }

    async function changeRandomSettingsPageVisibility() {
        const tWindow = await TauriWebviewWindow.getByLabel("random/settings")
        await tWindow?.isVisible() ? await tWindow?.hide() : await tWindow?.show()
    }

    async function startDrag(e: BaseSyntheticEvent) {
        if (e.target.classList.contains(["no-drag"])) { return }
        await getCurrentWindow().startDragging()
    }

    return (
        <div className={"background"} onMouseDown={startDrag}>
            <div id={"print"} className={"unselect"}>
                <div id={"number"}>{randomNumber}</div>
            </div>
            <div id={"buttons"} className={"unselect"}>
                <button onClick={random} className={"win10-button no-drag"}>抽取</button>
                <button onClick={changeRandomSettingsPageVisibility} className={"win10-button no-drag"}>设置</button>
            </div>
        </div>
    )
}