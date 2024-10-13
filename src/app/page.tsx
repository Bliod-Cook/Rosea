'use client'
import {Suspense, useEffect, useState} from "react";
import styles from './styles.module.css'
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // 更新时间间隔为 1 秒

    return () => clearInterval(intervalId); // 在组件卸载时清除计时器
  }, []);

  const [isRandomPageOpen, setIsRandomPageOpen] = useState(false)

  async function OpenPage() {
    if (isRandomPageOpen) {
      setIsRandomPageOpen(false);
      await randomPage.hide()
    } else {
      setIsRandomPageOpen(true);
      await randomPage.show()
    }
  }

  const [randomPage] = useState(new WebviewWindow('RandomPage', {
    url: '/random',
    decorations: false,
    transparent: true,
    shadow: false,
    alwaysOnTop: true,
    resizable: false,
    width: 120,
    height: 180,
    focus: false,
    skipTaskbar: true,
    dragDropEnabled: false,
    visible: false,
    x: 500,
    y: 500,
  }))

  return (
      <div draggable={false}>
        <Suspense fallback={null}>
          <p className={`${styles.clockFont} text-center`}
             onClick={OpenPage}>{currentTime.toLocaleTimeString()}</p>
        </Suspense>
      </div>
  );
}