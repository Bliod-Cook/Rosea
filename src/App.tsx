import {useEffect, useState} from "react";
import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";
import "./App.scss"
import {getCurrentWindow} from "@tauri-apps/api/window";
import {moveable as gMoveable, click_through as gClickThrough} from "./init/tray.ts";

export default function App() {
    const [time, setTime] = useState((new Date()).toLocaleTimeString())
    setInterval(() => {
        setTime((new Date()).toLocaleTimeString())
    }, 1000)

    const [moveable, setMoveable] = useState(false)

    function changeMoveable() {
        setMoveable(gMoveable);
    }

    useEffect(() => {
        getCurrentWindow().listen("change_movable", () => {
            changeMoveable()
        }).then()
        getCurrentWindow().listen("change_click_through", () => {
            gClickThrough ? getCurrentWindow().setIgnoreCursorEvents(true) : getCurrentWindow().setIgnoreCursorEvents(false)
        }).then()
    });

    async function changeRandomPageVisibility() {
        const tWindow = await TauriWebviewWindow.getByLabel("random")
        await tWindow?.isVisible() ? await tWindow?.hide() : await tWindow?.show()
    }

    return (
        <>
            <div id={"main-div"}
                 onClick={changeRandomPageVisibility}
                 className={`${moveable?"tauri-drag":undefined}`}
                 draggable={false}>
                {time}
            </div>
        </>
    )
}