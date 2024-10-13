'use client'
import styles from './styles.module.css'
import './page.css'
import {useState} from "react";
import {invoke} from "@tauri-apps/api/core";
import {Window} from "@tauri-apps/api/window";
import WinButton from "@/app/components/winButton";
import {WebviewWindow} from "@tauri-apps/api/webviewWindow";

export default function Random() {
    function openSettingsPage() {
        new WebviewWindow('SettingsPage', {
            url: '/settings',
            decorations: true,
            transparent: false,
            shadow: true,
            alwaysOnTop: true,
            resizable: false,
            width: 360,
            height: 240,
            focus: true,
            skipTaskbar: true,
            dragDropEnabled: true,
            visible: true,
            x: 500,
            y: 500,
            title: "设置",
        })
    }

    const [randomedNumber, setRandomedNumber] = useState(0)
    async function getRandomNumber() {
        const min_config: string = await invoke("get_config", {config: "MIN"});
        console.log(min_config)
        const max_config: string = await invoke("get_config", {config: "MAX"});
        const min: number = min_config === "null" ? 1 : parseInt(min_config.slice(1,-1));
        console.log(min)
        const max: number = max_config === "null" ? 48 : parseInt(max_config.slice(1,-1));
        const number = await randomNumber({minimum: min, maximum: max})
        setRandomedNumber(number)
    }

    const [mouseOnButton, setMouseOnButton] = useState(false)
    return (
        <div className={`${styles.middle}`} id={"content"} onMouseDown={mouseOnButton ? () => {} : Drag}>
            <div id={"result"} className={`w-full select-none`}>
                {randomedNumber}
            </div>
            <div id={"buttons"}>
                <div onMouseOver={() => setMouseOnButton(true)} onMouseOut={() => setMouseOnButton(false)}><WinButton width={30} height={7} onClick={getRandomNumber}>开始</WinButton></div>
                <div onMouseOver={() => setMouseOnButton(true)} onMouseOut={() => setMouseOnButton(false)}><WinButton width={30} height={7} onClick={openSettingsPage}>设置</WinButton></div>
            </div>
        </div>
    )
}

async function randomNumber(range: { minimum: number, maximum: number }): Promise<number> {
    console.log(range)
    return await invoke("get_random_number", {min: range.minimum, max: range.maximum})
}

async function Drag() {
    const window = await Window.getByLabel("RandomPage")
    window?.startDragging()
}