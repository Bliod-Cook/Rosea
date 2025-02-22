import "../../assets/global.scss"
import SettingsStyle from './settings.module.scss'
import TOML from "@ltd/j-toml"
import {rConfig} from "../config.ts";
import {useEffect, useState} from "react";
import {getCurrentWindow} from "@tauri-apps/api/window";
import {BaseDirectory, create, exists, readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";
import {Box, Button, Switch, TextField} from "@mui/material";
import {emitTo} from "@tauri-apps/api/event";

export default function RandomSettingsPage() {
    const [input1, setInput1] = useState("");
    const [input2, setInput2] = useState("");
    const [showName, setShowName] = useState(false)

    useEffect(() => {
        rConfig().then((r) => {
            const [min, max, showName] = r
            setInput1(String(min))
            setInput2(String(max))
            setShowName(showName)
        })
    }, []);

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
        configData["show_name"] = showName
        await writeTextFile(
            'config.toml',
            // @ts-expect-error Its Work
            TOML.stringify(configData),
            {baseDir: BaseDirectory.AppLocalData}
        )
        emitTo('random', 'reload://randomer/config').then()
        await getCurrentWindow().hide()
    }

    return <Box className={`${SettingsStyle.background} drag-region`} onScroll={(e) => {e.preventDefault()}}>
        <Box className={`${SettingsStyle.InputBars} ${SettingsStyle.center}`}>
            <Box id={"InputMin"}
                 className={`no-drag-region`}
                 marginTop={"25px"}
            >
                <TextField variant={"outlined"} color={"secondary"} label={"Min"} size={"small"} error={isIllegal(input1)} onChange={(c) => {setInput1(c.target.value)}} value={input1}></TextField>
            </Box>
            <Box id={"InputMax"}
                 className={`no-drag-region`}
                 marginTop={"20px"}
            >
                <TextField variant={"outlined"} color={"secondary"} label={"Max"} size={"small"} error={isIllegal(input2)} onChange={(c) => {setInput2(c.target.value)}} value={input2}></TextField>
            </Box>
            <Box id={"SwitchShowName"}
                 className={`no-drag-region`}
                 marginTop={"5px"}
            >
                Show Name<Switch onChange={(_, v) => {setShowName(v)}}></Switch>
            </Box>
        </Box>
        <Box className={`${SettingsStyle.buttons}`} marginTop={"8px"}>
            <Box><Button variant={"contained"} disabled={isIllegal(input1) || isIllegal(input2) || input1 > input2} onClick={save} color={"success"}>保存</Button></Box>
            <Box><Button variant={"contained"} onClick={closeWindow} color={"inherit"}>取消</Button></Box>
        </Box>
    </Box>
}

function isIllegal(i: string): boolean {
    if (i.length === 0) return true
    if (!Number.isInteger(Number(i))) return true
    console.log(Number.isInteger(i))
    return isNaN(Number(i))
}