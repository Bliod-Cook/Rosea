import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css"
import {initPage} from "./init/pages.ts";
import {initTray} from "./init/tray.ts";
import {initUpdate} from "./init/update.ts";
import {BrowserRouter, Route, Routes} from "react-router-dom";

import MainWindow from './App.tsx'
import RandomWindow from './randomer/randomer.tsx'
import RandomSettingsPage from './randomer/settings/settings.tsx'

initTray()
initPage()
initUpdate()

createRoot(document.getElementById('root')!).render(
    <StrictMode >
        <BrowserRouter>
            <Routes>
                <Route path="/">
                    <Route index element={<MainWindow/>} />
                </Route>
                <Route path="randomer">
                    <Route index element={<RandomWindow/>}></Route>
                    <Route path="settings" element={<RandomSettingsPage/>} />
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>,
)