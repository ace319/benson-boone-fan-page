"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

interface RotatingEarthProps { width?: number; height?: number; className?: string }

export default function RotatingEarth({ width = 800, height = 600, className = "" }: RotatingEarthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return
    const w = Math.min(width, window.innerWidth - 40), h = Math.min(height, window.innerHeight - 100)
    const dpr = window.devicePixelRatio || 1, radius = Math.min(w, h) / 2.5
    canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.width = `${w}px`; canvas.style.height = `${h}px`; context.scale(dpr, dpr)
    const projection = d3.geoOrthographic().scale(radius).translate([w / 2, h / 2]).clipAngle(90)
    const path = d3.geoPath().projection(projection).context(context)
    let land: any, rotation = [0, -10, 0], active = true
    const render = () => { context.clearRect(0, 0, w, h); context.beginPath(); path({type:"Sphere"} as any); context.fillStyle="#101b3d"; context.fill(); context.strokeStyle="#fff9ef"; context.lineWidth=2; context.stroke(); if(land){context.beginPath();path(land);context.strokeStyle="#f6cb35";context.lineWidth=1;context.stroke();context.beginPath();path(d3.geoGraticule10());context.globalAlpha=.18;context.stroke();context.globalAlpha=1} }
    fetch("https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json").then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{land=d;render()}).catch(()=>setError("Failed to load land map data"))
    const timer=d3.timer(()=>{if(active){rotation[0]+=.25;projection.rotate(rotation as [number,number,number]);render()}})
    const drag=d3.drag<HTMLCanvasElement,unknown>().on("start",()=>{active=false}).on("drag",e=>{rotation[0]+=e.dx*.4;rotation[1]-=e.dy*.4;rotation[1]=Math.max(-90,Math.min(90,rotation[1]));projection.rotate(rotation as [number,number,number]);render()}).on("end",()=>{active=true})
    d3.select(canvas).call(drag)
    const wheel=(e:WheelEvent)=>{e.preventDefault();projection.scale(Math.max(radius*.5,Math.min(radius*2.5,projection.scale()*(e.deltaY>0?.9:1.1))));render()};canvas.addEventListener("wheel",wheel,{passive:false})
    return()=>{timer.stop();canvas.removeEventListener("wheel",wheel)}
  },[width,height])
  if(error)return <div className={`flex items-center justify-center rounded-2xl p-8 ${className}`}>{error}</div>
  return <div className={`relative ${className}`}><canvas ref={canvasRef} className="h-auto w-full rounded-2xl"/><span className="absolute bottom-4 left-4 text-xs">Drag to rotate · Scroll to zoom</span></div>
}
