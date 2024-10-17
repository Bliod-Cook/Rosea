'use client'
import WinButton from "@/app/components/winButton";
import {invoke} from "@tauri-apps/api/core";
import { message } from "@tauri-apps/plugin-dialog";
import {useEffect, useState} from "react";
import { Window } from "@tauri-apps/api/window";
import {getConfig} from "@/app/scripts/config";

export default function Settings() {

    const [min, setMin] = useState(1)
    const [max, setMax] = useState(48)
    const [hidden, setHidden] = useState(true)

    useEffect(() => {
        get_config("MIN", 1).then((result) => {setMin(result)})
        get_config("MAX", 48).then((result) => {setMax(result)})
        setHidden(false)
    }, []);

    async function saveSettings() {
        if (max !== null && min !== null && max !== undefined && min !== undefined) {
            console.log(max, min)
            await invoke("set_config", {config: "MIN", value: String(min)});
            await invoke("set_config", {config: "MAX", value: String(max)});
            await close_page()
        } else {
            await message("需要设置最大最小值", { title: "Rosea", kind: 'error' })
        }
    }

    return (
        <>
            <div id={"content"} className={"flex-col text-center"}>
                <div className={"mt-10"}>
                    <p>最小</p>
                    <input className={"border border-black text-center"}
                           onChange={(e) => setMin(Number(e.target.value))} defaultValue={min} hidden={hidden}></input>
                </div>
                <div className={"mt-1"}>
                    <p>最大</p>
                    <input className={"border border-black text-center"}
                           onChange={(e) => setMax(Number(e.target.value))} defaultValue={max} hidden={hidden}></input>
                </div>
                <div className={"mt-10"}>
                    <WinButton width={30} height={7} onClick={saveSettings}>保存</WinButton>
                </div>
            </div>
        </>
    )
}

async function close_page() {
    const window = await Window.getByLabel("SettingsPage")
    await window?.hide()
}

async function get_config(config: string, default_value: number): Promise<number> {
    const value: string = await getConfig(config, String(default_value));
    return Number(value)
}