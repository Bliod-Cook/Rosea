import "../../assets/global.scss"
import SettingsStyle from './settings.module.scss'
import TOML from "@ltd/j-toml"
import { rConfig } from "../config.ts";
import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { BaseDirectory, create, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { Box, Button, Switch, TextField } from "@mui/material";
import { emitTo } from "@tauri-apps/api/event";

const CONFIG_FILE = "config.toml"

export default function RandomSettingsPage() {
    const [input1, setInput1] = useState<string>("");
    const [input2, setInput2] = useState<string>("");
    const [showName, setShowName] = useState<boolean>(false);

    useEffect(() => {
        rConfig().then(([min, max, showName]) => {
            setInput1(String(min));
            setInput2(String(max));
            setShowName(showName);
        });
    }, []);

    async function closeWindow() {
        await getCurrentWindow().hide();
        resetInputs();
    }

    function resetInputs() {
        setInput1("");
        setInput2("");
    }

    async function save() {
        if (isIllegal(input1) || isIllegal(input2) || input1 > input2) return;

        if (!(await exists(CONFIG_FILE, { baseDir: BaseDirectory.AppLocalData }))) {
            await create(CONFIG_FILE, { baseDir: BaseDirectory.AppLocalData });
        }

        const configData = TOML.parse(
            (await readTextFile(CONFIG_FILE, { baseDir: BaseDirectory.AppLocalData }))
                .slice(1, -1)
                .split(",")
                .join("\n")
        );
        configData["random_min"] = String(Number(input1));
        configData["random_max"] = String(Number(input2));
        configData["show_name"] = showName;

        await writeTextFile(
            CONFIG_FILE,
            // @ts-expect-error It work:)
            TOML.stringify(configData),
            { baseDir: BaseDirectory.AppLocalData }
        );
        emitTo('random', 'reload://randomer/config').then();
        await getCurrentWindow().hide();
    }

    return <Box className={`${SettingsStyle.background} drag-region`} onScroll={(e) => {e.preventDefault()}}>
        <Box className={`${SettingsStyle.InputBars} ${SettingsStyle.center}`}>
            <Box id={"InputMin"}
                 className={`drag-region`}
                 marginTop={"25px"}
            >
                <TextField className={`no-drag-region`} variant={"outlined"} color={"secondary"} label={"Min"} size={"small"} error={isIllegal(input1)} onChange={(c) => {setInput1(c.target.value)}} value={input1}></TextField>
            </Box>
            <Box id={"InputMax"}
                 className={`drag-region`}
                 marginTop={"20px"}
            >
                <TextField className={`no-drag-region`} variant={"outlined"} color={"secondary"} label={"Max"} size={"small"} error={isIllegal(input2)} onChange={(c) => {setInput2(c.target.value)}} value={input2}></TextField>
            </Box>
            <Box id={"SwitchShowName"}
                 className={`drag-region`}
                 marginTop={"5px"}
            >
                Show Name<Switch className={`no-drag-region`} onChange={(_, v) => {setShowName(v)}}></Switch>
            </Box>
        </Box>
        <Box className={`${SettingsStyle.buttons}`} marginTop={"8px"}>
            <Box><Button variant={"contained"} disabled={isIllegal(input1) || isIllegal(input2) || input1 > input2} onClick={save} color={"success"}>保存</Button></Box>
            <Box><Button variant={"contained"} onClick={closeWindow} color={"inherit"}>取消</Button></Box>
        </Box>
    </Box>
}

function isIllegal(i: string): boolean {
    return i.length === 0 || !Number.isInteger(Number(i)) || isNaN(Number(i));
}