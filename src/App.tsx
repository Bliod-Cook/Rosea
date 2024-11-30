import {useEffect, useState} from "react";
import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";
import "./App.css"

export default function App() {
    const [time, setTime] = useState((new Date()).toLocaleTimeString())
    setInterval(() => {
        setTime((new Date()).toLocaleTimeString())
    }, 1000)

    const [moveable, setMoveable] = useState(false)

    async function changeRandomPageVisibility() {
        const tWindow = await TauriWebviewWindow.getByLabel("random")
        await tWindow?.isVisible() ? await tWindow?.hide() : await tWindow?.show()
    }

    useEffect(() => {
        setInterval(async () => {
            if (await TauriWebviewWindow.getByLabel("update")) {}
            else {
                return new TauriWebviewWindow("update", {
                    url: "/update/",
                    title: "更新",
                    width: 250,
                    height: 180,
                    transparent: true,
                    alwaysOnTop: false,
                    decorations: false,
                    shadow: false,
                    resizable: false,
                    skipTaskbar: true,
                    visible: false,
                })
            }
        }, 600000)
    }, []);

    return (
        <>
            <div id={"main-div"}
                 data-tauri-drag-region={moveable ? "true" : undefined}
                 onClick={changeRandomPageVisibility}
                 onDoubleClick={() => {setMoveable(!moveable)}}
                 onScroll={(e) => {e.preventDefault()}}>
                {time}
            </div>
        </>
    )
}