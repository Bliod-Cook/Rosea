import Canvas from "./canvas.tsx";
import {createRoot} from "react-dom/client";
import {StrictMode} from "react";
import {currentMonitor} from "@tauri-apps/api/window";

const monitor = await currentMonitor()

if (monitor) {
    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <Canvas screenSize={monitor.size}/>
        </StrictMode>,
    )
}