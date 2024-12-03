import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import "./index.css"
import {initPage} from "./init/pages.ts";
import {initTray} from "./init/tray.ts";
import {initUpdate} from "./init/update.ts";

initTray()
initPage()
initUpdate()

createRoot(document.getElementById('root')!).render(
    <StrictMode >
        <App/>
    </StrictMode>,
)