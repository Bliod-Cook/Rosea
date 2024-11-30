import "./randomer.css"
import {BaseSyntheticEvent, useState} from "react";
import "./chance.js"
import {getCurrentWindow} from "@tauri-apps/api/window";
import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";
import {BaseDirectory, create, exists, readTextFile} from "@tauri-apps/plugin-fs";
import TOML from "@ltd/j-toml";

export default function RandomPage() {
    const [randomNumber, setRandomNumber] = useState(0)
    const [max, setMax] = useState(0)
    const [min, setMin] = useState(0)

    async function random() {
        if (!(await exists('config.toml', {baseDir: BaseDirectory.AppLocalData}))) {
            await create('config.toml', {baseDir: BaseDirectory.AppLocalData})
        }
        const configData = TOML.parse(
            (await readTextFile('config.toml', {baseDir: BaseDirectory.AppLocalData})).slice(1, -1).split(",").join("\n")
        )
        // TODO: Get Random Number
        setMax(Number(configData["random_max"] ?? 48))
        setMin(Number(configData["random_min"] ?? 1))
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
        <>
            <div className={"background"}
                 onMouseDown={startDrag}
                 onScroll={(e) => {
                     e.preventDefault()
                 }}
            >
                <div id={"print"} className={"unselect"}>
                    <div id={"number"}>{randomNumber}</div>
                </div>
                <div id={"buttons"} className={"unselect"}>
                    <button onClick={random} className={"win10-button"}>抽取</button>
                    <button onClick={changeRandomSettingsPageVisibility} className={"win10-button"}>设置</button>
                </div>
                <div className="app-progress-container">
                    <div className="app-progress-bar">
                    <span role="progressbar" style={{
                        width: Number(randomNumber) / (max - min) * 120,
                    }}></span>
                    </div>
                </div>
            </div>
        </>
    )
}