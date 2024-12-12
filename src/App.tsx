import {BaseSyntheticEvent, useState} from "react";
import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";
import "./App.scss"
import {getCurrentWindow} from "@tauri-apps/api/window";

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

    async function startDrag(e: BaseSyntheticEvent) {
        e.preventDefault()
        if (moveable) {
            await getCurrentWindow().startDragging()
        }
    }

    return (
        <>
            <div id={"main-div"}
                 onClick={changeRandomPageVisibility}
                 onDoubleClick={() => {setMoveable(!moveable)}}
                 onTouchStart={startDrag}
                 onDragStart={startDrag}
                 draggable={true}
                 onScroll={(e) => {e.preventDefault()}}>
                {time}
            </div>
        </>
    )
}