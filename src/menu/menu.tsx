import "./menu.scss"
import {useEffect, useState} from "react";
import {getCurrentWindow, LogicalSize} from "@tauri-apps/api/window";
import {WebviewWindow} from "@tauri-apps/api/webviewWindow";
import {click_through, moveable} from "../init/tray.ts";
import {emit} from "@tauri-apps/api/event";
export default function Menu() {
    // const [open, setOpen] = useState(false)
    const [open, setOpen] = useState(false)

    const [randomPageOpened, setRandomPageOpened] = useState(false)
    const [locked, setLocked] = useState(false)
    const [canClickThrough, setCanClickThrough] = useState(false)

    useEffect(() => {
        getCurrentWindow().setSize(new LogicalSize(40, 40)).then()
    }, []);

    async function changeOpen() {
        const window = getCurrentWindow();
        if (!open) {
            await window.setSize(new LogicalSize(160, 40))
        } else {
            await window.setSize(new LogicalSize(40, 40))
        }
        setOpen(!open)
    }

    return <div className={"main"}>
        <div className={"menu-icon"} onClick={changeOpen}></div>
        {
            (!open) ? undefined : <div className={"icons-bar"}>
                <div className={`random-icon ${randomPageOpened ? "enabled" : "disabled"}`} onClick={async () => {
                    const window = await WebviewWindow.getByLabel("random")
                    if (window) {
                        if (await window.isVisible()) {
                            window.hide().then(() => {
                                setRandomPageOpened(false)
                            })
                        } else {
                            window.show().then(() => {
                                setRandomPageOpened(true)
                            })

                        }
                    }
                }}></div>
                <div className={`lock-icon ${!locked ? "enabled" : "disabled"}`} onClick={() => {
                    emit("change-lock").then(()=>{setLocked(!moveable)})
                }}></div>
                <div className={`click-through-icon ${canClickThrough ? "enabled" : "disabled"}`} onClick={()=>{
                    emit("change-click_through").then(()=>{setCanClickThrough(click_through)})
                }}></div>
            </div>
        }
    </div>
}