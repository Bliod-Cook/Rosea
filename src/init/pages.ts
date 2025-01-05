import {WebviewWindow as TauriWebviewWindow} from "@tauri-apps/api/webviewWindow";

export function initPage() {
    new TauriWebviewWindow("canvas", {
        url: "/canvas/",
        title: "Canvas",
        x: 0,
        y: 0,
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
        maximizable: true,
        minimizable: false,
    })

    setTimeout(()=> {
        new TauriWebviewWindow("menu", {
            parent: "canvas",
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
    },2000)

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
        height: 230,
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