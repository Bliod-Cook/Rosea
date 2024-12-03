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
        console.log("Random")
        if (!(await exists('config.toml', {baseDir: BaseDirectory.AppLocalData}))) {
            await create('config.toml', {baseDir: BaseDirectory.AppLocalData})
        }
        const config = (await readTextFile('config.toml', {baseDir: BaseDirectory.AppLocalData})).slice(1, -1).split(",").join("\n")
        console.log(config)
        const configData = TOML.parse(
            config
        )
        // TODO: Get Random Number
        const maxN = Number(configData["random_max"] ?? 48)
        const minN = Number(configData["random_min"] ?? 1)
        setMax(maxN)
        setMin(minN)
        const random_number = Math.floor(
            // @ts-ignore
            chance.integer({min: minN, max: maxN})
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
                    <button onClick={random} className={"win10-button no-drag"}>抽取</button>
                    <button onClick={changeRandomSettingsPageVisibility} className={"win10-button no-drag"}>设置</button>
                </div>
                <div className="app-progress-container">
                    <div className="app-progress-bar">
                    <span role="progressbar" style={{
                        width: isNaN(Number(randomNumber) / (max - min) * 120) ? 1 : Number(randomNumber) / (max - min) * 120,
                    }}></span>
                    </div>
                </div>
            </div>
        </>
    )
}