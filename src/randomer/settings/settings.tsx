import "../../assets/global.scss"
import './settings.scss'
import TOML from "@ltd/j-toml"
import {useState} from "react";
import {getCurrentWindow} from "@tauri-apps/api/window";
import {BaseDirectory, create, exists, readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";
import {Box, Button} from "@mui/material";

export default function RandomSettingsPage() {
    const [input1, setInput1] = useState("");
    const [input2, setInput2] = useState("");

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
        configData["random_min"] = String(Number(input1))
        configData["random_max"] = String(Number(input2))
        await writeTextFile(
            'config.toml',
            // @ts-expect-error Its Work
            TOML.stringify(configData),
            {baseDir: BaseDirectory.AppLocalData}
        )
        await getCurrentWindow().hide()
    }

    return <div className={"background drag-region"} onScroll={(e) => {e.preventDefault()}}>
        <div id={"InputBars"}>
            <div className={"center"}>
                <p className={"unselect"}>最小</p>
                <div id={"InputMin"}
                     className={`app-input-container no-drag-region ${isIllegal(input1) ? "input-danger" : "input-success"}`}>
                    <input className={"app-input-text no-drag-region"} onChange={(c) => {setInput1(c.target.value)}} value={input1}/>
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
            <Box><Button variant={"contained"} disabled={isIllegal(input1) || isIllegal(input2) || input1 > input2} onClick={save} color={"success"}>保存</Button></Box>
            <Box><Button variant={"contained"} onClick={closeWindow} color={"inherit"}>取消</Button></Box>
        </div>
    </div>
}

function isIllegal(i: string): boolean {
    if (i.length === 0) return true
    if (!Number.isInteger(Number(i))) return true
    console.log(Number.isInteger(i))
    return isNaN(Number(i))
}