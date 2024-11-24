import RandomPage from "./randomer.tsx";
import {createRoot} from "react-dom/client";
import {StrictMode} from "react";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RandomPage/>
    </StrictMode>,
)