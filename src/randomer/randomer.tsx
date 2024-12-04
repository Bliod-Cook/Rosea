import "./randomer.scss"
import {BaseSyntheticEvent, useState} from "react";
// import "./chance.js"
import {getCurrentWindow} from "@tauri-apps/api/window";
import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";
import {BaseDirectory, create, exists, readTextFile} from "@tauri-apps/plugin-fs";
import TOML from "@ltd/j-toml";

export default function RandomPage() {
    const [randomNumber, setRandomNumber] = useState(0)
    const [max, setMax] = useState(0); const [min, setMin] = useState(0)
    const [historyNumber, setHistoryNumber] = useState(Array<number | null>(20).fill(null))

    async function random() {
        const [minN, maxN]: [number, number] = await rNumber()
        if (maxN === max && minN === min) {} else {
            setHistoryNumber(Array<number | null>(20).fill(null))
        }
        const weightList: number[] = Array(maxN - minN + 1).fill(100)
        historyNumber.forEach((e) => {
            if (e !== null) {
                const i: number = Number(e);
                weightList[i - minN] = 10
            }
        })
        setMax(maxN); setMin(minN)
        const random_number = (new (await import("chance")).Chance()).weighted(
            Array.from(Array(maxN-minN+1), (_v,k) =>k+1),
            weightList
        )
        historyNumber.pop()
        historyNumber.unshift(random_number)
        console.log("Weight: ", weightList)
        console.log("List: ", Array.from(Array(maxN-minN+1), (_v,k) =>k+1))
        console.log(historyNumber)
        // const random_number = (new (await import("chance")).Chance()).integer({min: minN, max: maxN})
        setRandomNumber(random_number)
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

async function rNumber(): Promise<[number, number]> {
    if (!(await exists('config.toml', {baseDir: BaseDirectory.AppLocalData}))) {
        await create('config.toml', {baseDir: BaseDirectory.AppLocalData})
    }
    const config = (await readTextFile('config.toml', {baseDir: BaseDirectory.AppLocalData})).slice(1, -1).split(",").join("\n")
    const configData = TOML.parse(
        config
    )
    // TODO: Weighted Random Number
    const maxN = Number(configData["random_max"] ?? 48)
    const minN = Number(configData["random_min"] ?? 1)
    return [minN, maxN]
}