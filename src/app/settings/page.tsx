'use client'
import WinButton from "@/app/components/winButton";
import {invoke} from "@tauri-apps/api/core";
import { message } from "@tauri-apps/plugin-dialog";
import {useState} from "react";
import { Window } from "@tauri-apps/api/window";

export default function Settings() {

    const [min, setMin] = useState(1)
    const [max, setMax] = useState(48)

    async function saveSettings() {
        if (max !== null && min !== null && max !== undefined && min !== undefined) {
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
                           onChange={(e) => setMin(Number(e.target.value))} value={min}></input>
                </div>
                <div className={"mt-1"}>
                    <p>最大</p>
                    <input className={"border border-black text-center"}
                           onChange={(e) => setMax(Number(e.target.value))} value={max}></input>
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
    window?.destroy()
}