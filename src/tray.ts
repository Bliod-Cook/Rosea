import { TrayIcon } from "@tauri-apps/api/tray";
import {defaultWindowIcon} from "@tauri-apps/api/app";
import {Menu} from "@tauri-apps/api/menu";
import {invoke} from "@tauri-apps/api/core";

export async function initTray() {
    const menu = await Menu.new({
        items: [
            {
                id: "Quit",
                text: "Quit",
                action: quit,
            },
        ]
    })

    const options = {
        menu,
        menuOnLeftClick: true,
        icon: await defaultWindowIcon() ?? undefined,
    }

    await TrayIcon.new(options)
}

function quit() {
    invoke("quit").then()
}