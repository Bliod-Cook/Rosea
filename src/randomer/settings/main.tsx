import RandomSettingsPage from "./settings.tsx";
import {createRoot} from "react-dom/client";
import {StrictMode} from "react";

window.global ||= window;

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RandomSettingsPage/>
    </StrictMode>,
)