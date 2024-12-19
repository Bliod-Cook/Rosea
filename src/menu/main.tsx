import Menu from "./menu.tsx";
import {createRoot} from "react-dom/client";
import {StrictMode} from "react";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Menu/>
    </StrictMode>,
)