import '../../assets/windows-ui.min.css'
import '../../assets/winui-icons.min.css'
import './settings.css'
import TOML from "@ltd/j-toml"
import {BaseSyntheticEvent, useState} from "react";
import {getCurrentWindow} from "@tauri-apps/api/window";
import {BaseDirectory, create, exists, readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";

export default function RandomSettingsPage() {
    const [input1, setInput1] = useState("");
    const [input2, setInput2] = useState("");

    async function startDrag(e: BaseSyntheticEvent) {
        if (e.target.classList.contains(["no-drag"])) { return }
        await getCurrentWindow().startDragging()
    }

    async function closeWindow() {
        await getCurrentWindow().hide();
        setInput1(""); setInput2("");
    }

    async function save() {
        if (isIllegal(input1) || isIllegal(input2) || input1 > input2) { return }

        if (!(await exists('config.toml', {baseDir: BaseDirectory.AppLocalData}))) {
            await create('config.toml', {baseDir: BaseDirectory.AppLocalData})
        }

        // const TOML = await import("@iarna/toml")
        const configData = TOML.parse(
            (await readTextFile('config.toml', {baseDir: BaseDirectory.AppLocalData})).slice(1, -1).split(",").join("\n")
        )
        configData["random_min"] = input1
        configData["random_max"] = input2
        await writeTextFile(
            'config.toml',
            TOML.stringify(configData),
            {baseDir: BaseDirectory.AppLocalData}
        )
        await getCurrentWindow().hide()
    }

    return <div className={"background"} onMouseDown={startDrag}>
        <div id={"InputBars"}>
            <div className={"center"}>
                <p className={"unselect"}>最小</p>
                <div id={"InputMin"}
                     className={`app-input-container no-drag ${isIllegal(input1) ? "input-danger" : "input-success"}`}>
                    <input className={"app-input-text no-drag"} onChange={(c) => {setInput1(c.target.value)}} value={input1}/>
                    <div className="app-input-end-content">
                        <i className="icons10-status"></i>
                    </div>
                </div>
            </div>
            <div className={"center"}>
                <p className={"unselect"}>最大</p>
                <div id={"InputMax"}
                     className={`app-input-container no-drag ${isIllegal(input2) ? "input-danger" : "input-success"}`}>
                    <input className={"app-input-text no-drag"} onChange={(c) => {setInput2(c.target.value)}} value={input2}/>
                    <div className="app-input-end-content">
                        <i className="icons10-status"></i>
                    </div>
                </div>
            </div>
        </div>
        <div id={"buttons"}>
            <button className={`app-btn app-btn-${(isIllegal(input1) || isIllegal(input2) || input1 > input2) ? "" : "success"} no-drag`} disabled={isIllegal(input1) || isIllegal(input2) || input1 > input2} onClick={save}>保存</button>
            <button className={"app-btn no-drag"} onClick={closeWindow}>取消</button>
        </div>
    </div>
}

function isIllegal(i: string): boolean {
    if (i.length === 0) return true
    return isNaN(Number(i))
}