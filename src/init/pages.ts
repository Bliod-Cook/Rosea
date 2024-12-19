import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";

export function initPage() {
    new TauriWebviewWindow("menu", {
        url: "/menu/",
        title: "Menu",
        width: 40,
        height: 40,
        transparent: true,
        alwaysOnTop: true,
        decorations: false,
        shadow: false,
        resizable: false,
        skipTaskbar: true,
        visible: true,
        zoomHotkeysEnabled: false,
        maximizable: false
    })

    new TauriWebviewWindow("random", {
        url: "/randomer/",
        title: "Randomer",
        width: 120,
        height: 180,
        transparent: true,
        alwaysOnTop: true,
        decorations: false,
        shadow: false,
        resizable: false,
        skipTaskbar: true,
        visible: false,
        zoomHotkeysEnabled: false,
        maximizable: false
    })

    new TauriWebviewWindow("random/settings", {
        url: "/randomer/settings/",
        title: "设置",
        width: 320,
        height: 220,
        transparent: true,
        alwaysOnTop: true,
        decorations: false,
        shadow: false,
        resizable: false,
        skipTaskbar: true,
        visible: false,
        zoomHotkeysEnabled: false,
        fullscreen: false,
        maximizable: false
    })
}