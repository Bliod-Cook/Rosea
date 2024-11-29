import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import "./index.css"
import {initPage} from "./pages.ts";
import {initTray} from "./tray.ts";

initPage()
await initTray()

createRoot(document.getElementById('root')!).render(
    <StrictMode >
        <App/>
    </StrictMode>,
)