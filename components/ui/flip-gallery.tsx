import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const releases = [
  { title: "Walk Me Home… · EP · 2022", url: "/assets/cover-walk-me-home.jpg" },
  { title: "PULSE · EP · 2023", url: "/assets/cover-pulse.jpg" },
  { title: "Fireworks & Rollerblades · LP · 2024", url: "/assets/cover-fireworks.jpg" },
  { title: "American Heart · LP · 2025", url: "/assets/cover-american-heart.jpg" },
]

const speed = 750
const timing = { duration: speed, iterations: 1 }
const topDown = [{ transform: "rotateX(0)" }, { transform: "rotateX(-90deg)" }, { transform: "rotateX(-90deg)" }]
const bottomDown = [{ transform: "rotateX(90deg)" }, { transform: "rotateX(90deg)" }, { transform: "rotateX(0)" }]

export default function FlipGallery() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const applyImage = (index: number) => {
    containerRef.current?.querySelectorAll<HTMLElement>(".unite").forEach(part => {
      part.style.backgroundImage = `url('${releases[index].url}')`
    })
    containerRef.current?.setAttribute("data-title", releases[index].title)
  }
  useEffect(() => { applyImage(0) }, [])
  const move = (increment: number) => {
    const gallery = containerRef.current
    if (!gallery) return
    const next = (currentIndex + increment + releases.length) % releases.length
    const top = increment < 0 ? [...topDown].reverse() : topDown
    const bottom = increment < 0 ? [...bottomDown].reverse() : bottomDown
    gallery.querySelector<HTMLElement>(".overlay-top")?.animate(top, timing)
    gallery.querySelector<HTMLElement>(".overlay-bottom")?.animate(bottom, timing)
    gallery.style.setProperty("--title-opacity", "0")
    window.setTimeout(() => { applyImage(next); gallery.style.setProperty("--title-opacity", "1") }, speed * .52)
    setCurrentIndex(next)
  }
  return <div className="flex min-h-screen items-center justify-center bg-black">
    <div className="relative border border-white/25 bg-white/10 p-2">
      <div ref={containerRef} id="flip-gallery" className="relative h-[400px] w-[240px] text-center md:h-[500px] md:w-[500px]" style={{ perspective: "800px" }}>
        <div className="top unite"/><div className="bottom unite"/><div className="overlay-top unite"/><div className="overlay-bottom unite"/>
      </div>
      <div className="absolute right-0 top-full mt-3 flex gap-2">
        <button type="button" onClick={() => move(-1)} aria-label="Previous release" className="text-white"><ChevronLeft/></button>
        <button type="button" onClick={() => move(1)} aria-label="Next release" className="text-white"><ChevronRight/></button>
      </div>
      <style>{`#flip-gallery::after{content:'';position:absolute;background:#000;width:100%;height:4px;top:50%;left:0;transform:translateY(-50%)}#flip-gallery::before{content:attr(data-title);color:#fff;font:12px monospace;position:absolute;top:calc(100% + 16px);left:0;opacity:var(--title-opacity,1);transition:opacity .3s}#flip-gallery>*{position:absolute;width:100%;height:50%;overflow:hidden;background-size:100% 200%;background-repeat:no-repeat}.top,.overlay-top{top:0;transform-origin:bottom;background-position:top}.bottom,.overlay-bottom{bottom:0;transform-origin:top;background-position:bottom}`}</style>
    </div>
  </div>
}
