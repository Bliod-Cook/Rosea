import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";

export function initPage() {
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
        dragDropEnabled: false,
        zoomHotkeysEnabled: false
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
        dragDropEnabled: false,
        zoomHotkeysEnabled: false
    })
}