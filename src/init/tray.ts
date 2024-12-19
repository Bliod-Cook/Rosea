import { TrayIcon } from "@tauri-apps/api/tray";
import {defaultWindowIcon} from "@tauri-apps/api/app";
import {Menu} from "@tauri-apps/api/menu";
import {invoke} from "@tauri-apps/api/core";
import {emit, listen} from "@tauri-apps/api/event";
import { Update } from "./update.ts";
import {isPermissionGranted, requestPermission, sendNotification} from "@tauri-apps/plugin-notification";

const tray = await TrayIcon.getById("default") ?? await TrayIcon.new({
    menuOnLeftClick: true,
    icon: await defaultWindowIcon() ?? undefined,
    id: "default",
})

export let moveable = false;
export let click_through = false;
export let manual_update_check = false;

export async function initTray() {
    await changeTray()
}

async function changeTray()  {
    const menu = await Menu.new({
        items: [
            {
                id: "moveable",
                text: `Moveable ${moveable?"√":"×"}`,
                action: () => {moveable = !moveable; emit("change_moveable").then(()=>{changeTray()})}
            },
            {
                id: "click_through",
                text: `ClickThrough ${click_through?"√":"×"}`,
                action: () => {click_through = !click_through; emit("change_click_through").then(()=>{changeTray()})}
            },
            {
                id: "check_update",
                text: "Check for Updates",
                action: () => {manual_update_check = true;Update().then()}
            },
            {
                id: "Quit",
                text: "Quit",
                action: quit,
            },
        ]
    })

    await tray.setMenu(menu)
}

listen("newest-version", async () => {
    if (manual_update_check) {
        let permission = await isPermissionGranted();

        if (!permission) {
            const per = await requestPermission();
            permission = per === 'granted';
        }

        if (permission) {
            sendNotification({
                title: "Update",
                body: "Application is up-to-date"
            })
        }
        manual_update_check = false
    }
}).then()

listen("change-lock",()=>{
    moveable = !moveable; emit("change_moveable").then(()=>{changeTray().then()})
}).then()

listen("change-click_through",()=>{
    click_through = !click_through; emit("change_click_through").then(()=>{changeTray()})
}).then()

export function getMovable() {
    return moveable
}

function quit() {
    invoke("quit").then()
}
