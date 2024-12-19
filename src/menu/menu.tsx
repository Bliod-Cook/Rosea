import "./menu.scss"
import {useState} from "react";
import {getCurrentWindow, LogicalSize} from "@tauri-apps/api/window";
import {WebviewWindow} from "@tauri-apps/api/webviewWindow";
export default function Menu() {
    // const [open, setOpen] = useState(false)
    const [open, setOpen] = useState(false)

    const [randomPageOpened, setRandomPageOpened] = useState(false)

    async function changeOpen() {
        const window = getCurrentWindow();
        if (!open) {
            await window.setSize(new LogicalSize(80, 40))
        } else {
            await window.setSize(new LogicalSize(40, 40))
        }
        setOpen(!open)
    }

    return <div className={"main"}>
        <img alt={"menu-icon"} src={"/assets/icon.svg"} className={"menu-icon"} onClick={changeOpen}/>
        {
            !open ? undefined : <div>
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
            </div>
        }
    </div>
}