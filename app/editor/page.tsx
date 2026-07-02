"use client"
 
import React from "react" 
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { InsightEditorModal } from "@/components/InsightEditorModal"
import { useInsightsStorage } from "@/hooks/useInsightsStorage"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { InsightsData } from "@/lib/insights-state"

const shimmerStyle = {
  background: "linear-gradient(110deg, transparent 30%, #3A3A3C 50%, transparent 70%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.4s linear infinite",
}

const shimmerKeyframes = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes rollDigit0 { 0% { transform: translateY(0); } 100% { transform: translateY(0); } }
@keyframes rollDigit1 { 0% { transform: translateY(0); } 100% { transform: translateY(-10%); } }
@keyframes rollDigit2 { 0% { transform: translateY(0); } 100% { transform: translateY(-20%); } }
@keyframes rollDigit3 { 0% { transform: translateY(0); } 100% { transform: translateY(-30%); } }
@keyframes rollDigit4 { 0% { transform: translateY(0); } 100% { transform: translateY(-40%); } }
@keyframes rollDigit5 { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
@keyframes rollDigit6 { 0% { transform: translateY(0); } 100% { transform: translateY(-60%); } }
@keyframes rollDigit7 { 0% { transform: translateY(0); } 100% { transform: translateY(-70%); } }
@keyframes rollDigit8 { 0% { transform: translateY(0); } 100% { transform: translateY(-80%); } }
@keyframes rollDigit9 { 0% { transform: translateY(0); } 100% { transform: translateY(-90%); } }
`

const BG = "#0c0f14"
const PINK = "#d939cf"
const PURPLE = "#7738fb"
const CARD_BG = "#25282d"
const BAR_BG = "#2a2d31"
const MAX_GREY_PATTERNS = 10

const tabContent = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.12 },
  },
}

// ===== ODOMETER STYLES =====
const odometerKeyframes = `
@keyframes rollDigit0 { 0% { transform: translateY(0); } 100% { transform: translateY(0); } }
@keyframes rollDigit1 { 0% { transform: translateY(0); } 100% { transform: translateY(-10%); } }
@keyframes rollDigit2 { 0% { transform: translateY(0); } 100% { transform: translateY(-20%); } }
@keyframes rollDigit3 { 0% { transform: translateY(0); } 100% { transform: translateY(-30%); } }
@keyframes rollDigit4 { 0% { transform: translateY(0); } 100% { transform: translateY(-40%); } }
@keyframes rollDigit5 { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
@keyframes rollDigit6 { 0% { transform: translateY(0); } 100% { transform: translateY(-60%); } }
@keyframes rollDigit7 { 0% { transform: translateY(0); } 100% { transform: translateY(-70%); } }
@keyframes rollDigit8 { 0% { transform: translateY(0); } 100% { transform: translateY(-80%); } }
@keyframes rollDigit9 { 0% { transform: translateY(0); } 100% { transform: translateY(-90%); } }
`

// ===== SINGLE ROLLING DIGIT =====
const RollingDigit = ({ target, delay }: { target: number; delay: number }) => {
  return (
    <span
      className="inline-block overflow-hidden"
      style={{
        height: "1em",
        lineHeight: "1em",
        verticalAlign: "top",
        width: "0.62em",
      }}
    >
      <span
        className="flex flex-col"
        style={{
          animation: `rollDigit${target} 1.8s cubic-bezier(0.2, 0.8, 0.3, 1) ${delay}s both`,
        }}
      >
        {[0,1,2,3,4,5,6,7,8,9].map(n => (
          <span key={n} className="block text-center" style={{ height: "1em", lineHeight: "1em" }}>
            {n}
          </span>
        ))}
      </span>
    </span>
  )
}

// ===== ANIMATED NUMBER (Odometer — digit rolling) =====
const AnimatedNumber = ({ value, className, triggerKey }: { value: number; className?: string; triggerKey?: number }) => {
  const formatted = value.toLocaleString("en-IN")
  const chars = formatted.split("")
  const digitChars = chars.filter(c => /\d/.test(c))
  const totalDigits = digitChars.length

  let digitIndex = 0

  return (
    <span className={className} key={triggerKey} style={{ display: "inline-flex", alignItems: "baseline" }}>
      {chars.map((char, i) => {
        if (/\d/.test(char)) {
          const currentIdx = digitIndex
          digitIndex++
          const staggerDelay = (totalDigits - 1 - currentIdx) * 0.15
          return <RollingDigit key={`${triggerKey}-${i}`} target={parseInt(char)} delay={staggerDelay} />
        }
        return <span key={`sep-${i}`} style={{ width: "0.3em", textAlign: "center" }}>{char}</span>
      })}
    </span>
  )
}
// ===== ICONS =====
const ChevronLeftIcon = () => (
  <svg width="40" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path
    d="M36 12H10M10 12L18 4M10 12L18 20"
    stroke="white"
    stroke-width="3"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
)

const HeaderBoostIcon = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)
const HeartIcon = () => (
  <svg
    width="26"
    height="26"
    viewBox="-1 -1 26 26"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ overflow: "visible" }}
  >
    <path d="M12 21s-7-4.35-9-8.5C1.5 8 4 5 7.5 5c2 0 3.5 1 4.5 2.5C13 6 14.5 5 16.5 5 20 5 22.5 8 21 12.5 19 16.65 12 21 12 21z"/>
  </svg>
)

const CommentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="23"
    height="23"
    viewBox="-1 -1 26 26"
    fill="currentColor"
    aria-label="Comment"
    className="x1lliihq x1n2onr6 x5n08af"
    style={{ overflow: "visible" }}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
    />
  </svg>
)

const RepostIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="23"
    height="23"
    viewBox="-1 -1 26 26"
    fill="currentColor"
    aria-label="Repost"
    className="x1lliihq x1n2onr6 xyb1xck"
    style={{ overflow: "visible" }}
  >
    <path d="M19.998 9.497a1 1 0 0 0-1 1v4.228a3.274 3.274 0 0 1-3.27 3.27h-5.313l1.791-1.787a1 1 0 0 0-1.412-1.416L7.29 18.287a1 1 0 0 0-.294.707v.001c0 .023.012.042.013.065a.92.92 0 0 0 .281.643l3.502 3.504a1 1 0 0 0 1.414-1.414l-1.797-1.798h5.318a5.276 5.276 0 0 0 5.27-5.27v-4.228a1 1 0 0 0-1-1Zm-6.41-3.496-1.795 1.795a1 1 0 1 0 1.414 1.414l3.5-3.5a1.003 1.003 0 0 0 0-1.417l-3.5-3.5a1 1 0 0 0-1.414 1.414l1.794 1.794H8.27A5.277 5.277 0 0 0 3 9.271V13.5a1 1 0 0 0 2 0V9.271a3.275 3.275 0 0 1 3.271-3.27Z"/>
  </svg>
)

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="23"
    height="23"
    viewBox="-1 -1 26 26"
    fill="currentColor"
    aria-label="Share"
    className="x1lliihq x1n2onr6 xyb1xck"
    style={{ overflow: "visible" }}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13.973 20.046 21.77 6.928C22.8 5.195 21.55 3 19.535 3H4.466C2.138 3 .984 5.825 2.646 7.456l4.842 4.752 1.723 7.121c.548 2.266 3.571 2.721 4.762.717Z"
    />
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m7.488 12.208 8.027-4.567"
    />
  </svg>
)

const BookmarkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="23"
    height="23"
    viewBox="-1 -1 26 26"
    fill="currentColor"
    aria-label="Save"
    className="x1lliihq x1n2onr6 xyb1xck"
    style={{ overflow: "visible" }}
  >
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m20 21-8-7.56L4 21V3h16z"
    />
  </svg>
)
const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
    <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
    <circle cx="12" cy="7.7" r="1.25"/>
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 16.8h3M10.5 11H12v5.7"/>
  </svg>
)
const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
)
const BoostIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)
const SkipRateIcon = () => (
  <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 6"/>
    <path d="M24 6 A18 18 0 0 1 42 24" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <line x1="24" y1="24" x2="24" y2="14" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <line x1="24" y1="24" x2="32" y2="24" stroke="white" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)
const ShareRateIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
  </svg>
)
const LikeRateIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-4.35-9-8.5C1.5 8 4 5 7.5 5c2 0 3.5 1 4.5 2.5C13 6 14.5 5 16.5 5 20 5 22.5 8 21 12.5 19 16.65 12 21 12 21z"/>
  </svg>
)
const SaveRateIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21l-8-7.56L4 21V3h16z"/>
  </svg>
)
const RepostRateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" aria-label="Repost" class="x1lliihq x1n2onr6 xyb1xck"><path d="M19.998 9.497a1 1 0 0 0-1 1v4.228a3.274 3.274 0 0 1-3.27 3.27h-5.313l1.791-1.787a1 1 0 0 0-1.412-1.416L7.29 18.287a1 1 0 0 0-.294.707v.001c0 .023.012.042.013.065a.92.92 0 0 0 .281.643l3.502 3.504a1 1 0 0 0 1.414-1.414l-1.797-1.798h5.318a5.276 5.276 0 0 0 5.27-5.27v-4.228a1 1 0 0 0-1-1Zm-6.41-3.496-1.795 1.795a1 1 0 1 0 1.414 1.414l3.5-3.5a1.003 1.003 0 0 0 0-1.417l-3.5-3.5a1 1 0 0 0-1.414 1.414l1.794 1.794H8.27A5.277 5.277 0 0 0 3 9.271V13.5a1 1 0 0 0 2 0V9.271a3.275 3.275 0 0 1 3.271-3.27Z"/></svg>
)
const CommentRateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" aria-label="Comment" class="x1lliihq x1n2onr6 x5n08af"><path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"/></svg>
)

// ===== AUDIENCE ROW =====
const AudienceRow = ({ labelNode, percentage, barColor }: { labelNode: React.ReactNode; percentage: number; barColor: string; animateCharts?: boolean; delay?: number }) => {
  return (
    <div className="mb-3.5">
      <div className="mb-1 text-[13px] text-white">{labelNode}</div>
      <div className="flex items-center gap-3">
        <div className="flex-1 relative h-[8px] overflow-hidden" style={{ backgroundColor: BAR_BG, borderRadius: 6 }}>
          <div className="absolute left-0 top-0 h-full" style={{ width: `${percentage}%`, backgroundColor: barColor, borderRadius: 6 }} />
        </div>
        <span className="text-[13px] text-white font-semibold w-[46px] text-right shrink-0">{percentage.toFixed(1)}%</span>
      </div>
    </div>
  )
}

// ===== ANIMATED BAR =====
const AnimatedBar = ({ percentage, color }: { percentage: number; color: string; animateCharts?: boolean; delay?: number }) => {
  return (
    <div className="flex-1 relative h-[8px] overflow-hidden" style={{ backgroundColor: BAR_BG, borderRadius: 6 }}>
      <div className="absolute left-0 top-0 h-full" style={{ width: `${percentage}%`, backgroundColor: color, borderRadius: 6 }} />
    </div>
  )
}

// ===== SIMPLE PROGRESS BAR =====
const SimpleBar = ({ percentage, color }: { percentage: number; color: string; animateCharts?: boolean; delay?: number }) => {
  return (
    <div className="relative w-full h-[8px] rounded-full overflow-hidden" style={{ backgroundColor: BAR_BG }}>
      <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
    </div>
  )
}

// ===== GENDER PERCENTAGE EDITOR =====
const GenderPercentEditor = ({ value, onSave, locked }: { value: number; onSave: (n: number) => void; locked: boolean }) => {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value.toFixed(1))
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { setVal(value.toFixed(1)) }, [value])
  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select() } }, [editing])
  const commit = () => { const p = parseFloat(val); if (!isNaN(p) && p >= 0 && p <= 100) onSave(p); setEditing(false) }
  if (editing) return <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === "Enter") commit() }} className="bg-zinc-800 border border-fuchsia-500 rounded-lg px-1 py-0.5 text-[13px] text-white text-center outline-none" style={{ caretColor: PINK, width: 60 }} />
  return <span className={`text-[13px] text-white font-semibold w-[46px] text-right shrink-0 ${locked ? "cursor-default" : "cursor-pointer hover:opacity-70"} transition-opacity`} onClick={() => { if (!locked) setEditing(true) }}>{value.toFixed(1)}%</span>
}
// ===== GREY LINE EDITOR =====
const GreyLineEditor = ({ data, onChange, yAxisTop, onSaveGrey }: { data: GraphPoint[]; onChange: (d: GraphPoint[]) => void; yAxisTop: number; onSaveGrey: (values: number[]) => void }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const padding = { top: 10, right: 10, bottom: 10, left: 10 }
  const width = 340; const height = 120
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const getX = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * chartW
  const getY = (val: number) => padding.top + chartH - (Math.min(val, yAxisTop) / yAxisTop) * chartH
  const getValFromY = (clientY: number) => {
    const svg = svgRef.current; if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    const svgY = ((clientY - rect.top) / rect.height) * height
    return Math.max(0, Math.min(yAxisTop, Math.round(((padding.top + chartH - svgY) / chartH) * yAxisTop)))
  }
  const buildPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return ""
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`
    return d
  }
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    setDragging(index)
  }
        const handlePointerMove = (e: React.PointerEvent) => {
    if (dragging === null) return
    const val = getValFromY(e.clientY)
    const nd = [...data]
    nd[dragging] = { ...nd[dragging], typical: val }
    onChange(nd)
    try {
      localStorage.setItem("saved-graph-data", JSON.stringify(nd))
      localStorage.setItem("saved-grey-line", JSON.stringify(nd.map(p => p.typical)))
    } catch {}
  }
  return (
    <div className="bg-zinc-800/50 rounded-xl p-2">
      <div className="text-[11px] text-zinc-400 mb-1 pl-1">Drag to edit typical line</div>
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full select-none touch-none" onPointerMove={handlePointerMove} onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)}>
        <path d={buildPath(data.map((d, i) => ({ x: getX(i), y: getY(d.typical) })))} fill="none" stroke="#8a8a8a" strokeWidth={3} strokeDasharray="5 5" strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={i} cx={getX(i)} cy={getY(d.typical)} r={8} fill="#8a8a8a" fillOpacity={0.4} stroke="#8a8a8a" strokeWidth={1.5} className="cursor-grab active:cursor-grabbing" onPointerDown={e => handlePointerDown(i, e)} style={{ touchAction: "none" }} />
        ))}
      </svg>
    </div>
  )
}

// ===== PINK LINE EDITOR =====
const PinkLineEditor = ({ data, onChange, yAxisTop }: { data: GraphPoint[]; onChange: (d: GraphPoint[]) => void; yAxisTop: number }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const padding = { top: 10, right: 10, bottom: 10, left: 10 }
  const width = 340; const height = 120
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const getX = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * chartW
  const getY = (val: number) => padding.top + chartH - (Math.min(val, yAxisTop) / yAxisTop) * chartH
  const getValFromY = (clientY: number) => {
    const svg = svgRef.current; if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    const svgY = ((clientY - rect.top) / rect.height) * height
    return Math.max(0, Math.min(yAxisTop, Math.round(((padding.top + chartH - svgY) / chartH) * yAxisTop)))
  }
  const buildPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return ""
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`
    return d
  }
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    setDragging(index)
  }
    const handlePointerMove = (e: React.PointerEvent) => {
    if (dragging === null) return
    const val = getValFromY(e.clientY)
    const nd = [...data]
    nd[dragging] = { ...nd[dragging], thisReel: val }
    onChange(nd)
    try { localStorage.setItem("saved-graph-data", JSON.stringify(nd)) } catch {}
  }
  return (
    <div className="bg-zinc-800/50 rounded-xl p-2">
      <div className="text-[11px] text-zinc-400 mb-1 pl-1">Drag to edit pink line</div>
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full select-none touch-none" onPointerMove={handlePointerMove} onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)}>
        <path d={buildPath(data.map((d, i) => ({ x: getX(i), y: getY(d.thisReel) })))} fill="none" stroke={PINK} strokeWidth={3} strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={i} cx={getX(i)} cy={getY(d.thisReel)} r={8} fill={PINK} fillOpacity={0.4} stroke={PINK} strokeWidth={1.5} className="cursor-grab active:cursor-grabbing" onPointerDown={e => handlePointerDown(i, e)} style={{ touchAction: "none" }} />
        ))}
      </svg>
    </div>
  )
}
// ===== BOTTOM SHEET =====
const BottomSheet = ({
  open,
  onClose,
  onOpenEditor,
  locked,
  onToggleLock,
  graphData,
  onUpdateGraph,
  yAxisTop,
  sourcesMode,
  onToggleSources,
}: {
  open: boolean
  onClose: () => void
  onOpenEditor: () => void
  locked: boolean
  onToggleLock: () => void
  graphData: GraphPoint[]
  onUpdateGraph: (d: GraphPoint[]) => void
  yAxisTop: number
  sourcesMode: "all" | "three"
  onToggleSources: () => void
}) => {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [showGreyEditor, setShowGreyEditor] = useState(false)
  const [showPinkEditor, setShowPinkEditor] = useState(false)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => {
      document.addEventListener("mousedown", h)
      document.addEventListener("touchstart", h as any)
    }, 100)
    return () => {
      clearTimeout(t)
      document.removeEventListener("mousedown", h)
      document.removeEventListener("touchstart", h as any)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            className="fixed left-0 right-0 bottom-0 z-[70]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex justify-center pt-3 pb-2 bg-[#1c1c1e] rounded-t-2xl">
              <div className="w-10 h-1 bg-zinc-600 rounded-full" />
            </div>
            <div className="bg-[#1c1c1e] px-4 pb-4 max-h-[50vh] overflow-y-auto">
              <button className="w-full flex items-center justify-between py-3 active:opacity-60 transition-opacity" onClick={() => setShowPinkEditor(p => !p)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PINK }} />
                  </div>
                  <span className="text-[13px] text-white">Edit pink line</span>
                </div>
                <ChevronRightIcon />
              </button>
              {showPinkEditor && (
                <div className="py-2">
                  <PinkLineEditor data={graphData} onChange={onUpdateGraph} yAxisTop={yAxisTop} />
                </div>
              )}
              <div className="h-px bg-zinc-800" />
              <button className="w-full flex items-center justify-between py-3 active:opacity-60 transition-opacity" onClick={() => setShowGreyEditor(p => !p)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-[#8a8a8a]" />
                  </div>
                  <span className="text-[13px] text-white">Edit typical line</span>
                </div>
                <ChevronRightIcon />
              </button>
              {showGreyEditor && (
                <div className="py-2">
                  <GreyLineEditor data={graphData} onChange={onUpdateGraph} yAxisTop={yAxisTop} onSaveGrey={values => {
                    try { localStorage.setItem("saved-grey-line", JSON.stringify(values)) } catch {}
                  }} />
                </div>
              )}
              <div className="h-px bg-zinc-800" />
              <button className="w-full flex items-center justify-between py-3 active:opacity-60 transition-opacity" onClick={() => { onClose(); onOpenEditor() }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </div>
                  <span className="text-[13px] text-white">Edit insights</span>
                </div>
                <ChevronRightIcon />
              </button>
             
                           <div className="h-px bg-zinc-800" />
              <button className="w-full flex items-center justify-between py-3 active:opacity-60 transition-opacity" onClick={onToggleSources}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  </div>
                  <span className="text-[13px] text-white">{sourcesMode === "all" ? "Show 3 sources only" : "Show all sources"}</span>
                </div>
                <ChevronRightIcon />
              </button>
              <div className="h-px bg-zinc-800" />
              <button className="w-full flex items-center justify-between py-3 active:opacity-60 transition-opacity" onClick={() => { onToggleLock(); onClose() }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    {locked ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    )}
                  </div>
                  <span className="text-[13px] text-white">{locked ? "Unlock editing" : "Lock editing"}</span>
                </div>
                <ChevronRightIcon />
              </button>
            </div>
            <div className="bg-[#1c1c1e] pb-[env(safe-area-inset-bottom)]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}



// ===== INLINE EDITOR =====
const InlineEditor = ({ value, onSave, isNumber = false, className = "", locked = false }: { value: string | number; onSave: (val: any) => void; isNumber?: boolean; className?: string; locked?: boolean }) => {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { setVal(String(value)) }, [value])
  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select() } }, [editing])
  const commit = () => { if (isNumber) { const p = parseFloat(val); if (!isNaN(p)) onSave(p) } else { if (val.trim()) onSave(val.trim()) }; setEditing(false) }
  if (editing) return <input ref={inputRef} value={val} type={isNumber ? "number" : "text"} onChange={e => setVal(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === "Enter") commit() }} className={`bg-zinc-800 border border-fuchsia-500 rounded-lg px-2 py-0.5 text-white outline-none ${className}`} style={{ caretColor: PINK, minWidth: 60 }} />
  return <span className={`${locked ? "cursor-default" : "cursor-pointer hover:opacity-70"} transition-opacity ${className}`} onClick={() => { if (!locked) { setVal(String(value)); setEditing(true) } }}>{value}</span>
}

// ===== COUNTRY NAME EDITOR =====
const CountryNameEditor = ({ name, onSave, locked }: { name: string; onSave: (n: string) => void; locked: boolean }) => {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select() } }, [editing])
  const commit = () => { if (value.trim()) onSave(value.trim()); else setValue(name); setEditing(false) }
  if (editing) return <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === "Enter") commit() }} className="bg-zinc-800 border border-fuchsia-500 rounded-lg px-2 py-0.5 text-[13px] text-white outline-none w-full" style={{ caretColor: PINK }} />
  return <span className={`text-[13px] text-white ${locked ? "cursor-default" : "cursor-pointer hover:opacity-70"} transition-opacity`} onClick={() => { if (!locked) { setValue(name); setEditing(true) } }}>{name}</span>
}

// ===== DRAGGABLE VIEWS GRAPH =====
type GraphPoint = { date: string; thisReel: number; typical: number }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const parseTimeToSeconds = (time: string) => {
  if (time.endsWith("s")) {
    const value = parseInt(time.replace("s", ""), 10)
    return Number.isNaN(value) ? 0 : value
  }

  const parts = time.split(":").map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}


const formatSeconds = (seconds: number) => {
  return `${seconds}s`
}


const getAutoAverageWatchTime = (videoDuration: string) => {
  const totalSec = Math.max(parseTimeToSeconds(videoDuration), 1)
  const ratio = 0.6 + Math.random() * 0.2
  const watchSec = Math.max(1, Math.min(totalSec, Math.round(totalSec * ratio)))
  return formatSeconds(watchSec)
}

const getAutoAccountsReached = (views: number) => {
  if (views <= 100) return Math.max(1, views - randomInRange(5, 25))
  return Math.max(1, views - randomInRange(50, 200))
}

const getAutomatedActions = (views: number) => {
  if (views <= 1000) return { follows: randomInRange(0, 1), profileVisits: randomInRange(4, 8) }
  if (views <= 2000) return { follows: randomInRange(2, 4), profileVisits: randomInRange(5, 15) }
  if (views <= 3000) return { follows: randomInRange(3, 6), profileVisits: randomInRange(8, 20) }
  if (views <= 5000) return { follows: randomInRange(5, 10), profileVisits: randomInRange(12, 30) }
  if (views <= 10000) return { follows: randomInRange(8, 16), profileVisits: randomInRange(20, 60) }
  return { follows: randomInRange(12, 24), profileVisits: randomInRange(35, 90) }
}

const getViewsAxisTop = (views: number) => {
  return Math.max(250, Math.ceil(views / 250) * 250)
}


const formatViewsAxisLabel = (value: number) => {
  if (value >= 1000) {
    const k = value / 1000
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`
  }
  return value.toLocaleString("en-IN")
}

const randomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

type ReelType = "viral" | "normal" | "dead"

const weightedSmooth = (values: number[]) => {
  if (values.length < 3) return [...values]

  const result = [...values]
  for (let i = 1; i < values.length - 1; i++) {
    result[i] = values[i - 1] * 0.2 + values[i] * 0.6 + values[i + 1] * 0.2
  }
  return result
}

const getViewsPointCount = (views: number) => {
  if (views <= 2000) return 10
  if (views <= 5000) return 12
  if (views <= 10000) return 14
  if (views <= 25000) return 16
  return 18
}

const getRetentionPointCount = (views: number) => {
  if (views <= 2000) return 10
  if (views <= 5000) return 12
  if (views <= 10000) return 14
  if (views <= 25000) return 16
  return 18
}


const pickReelType = (views: number): ReelType => {
  if (views >= 12000) return "viral"
  if (views <= 1200) return "dead"
  return "normal"
}

const lerp = (start: number, end: number, t: number) => start + (end - start) * t

const getViewScaleProfile = (totalViews: number) => {
  const settle = clamp((totalViews - 300) / 6700, 0, 1)

  return {
    jitter: lerp(0.34, 0.06, settle),
    chaos: lerp(0.28, 0.03, settle),
    flatChance: lerp(0.22, 0.05, settle),
    dipChance: lerp(0.2, 0.04, settle),
    clusterBoost: lerp(1.45, 1.12, settle),
    momentumBonus: lerp(0.88, 1.03, settle),
  }
}


const buildPhases = (points: number, reelType: ReelType) => {
  if (reelType === "viral") {
    return [
      { name: "test", length: Math.max(6, Math.round(points * 0.12)), base: 0.25, momentum: 0.78 },
      { name: "push", length: Math.max(10, Math.round(points * 0.26)), base: 2.7, momentum: 1.1 },
      { name: "cooldown", length: Math.max(8, Math.round(points * 0.18)), base: 1.15, momentum: 0.9 },
      { name: "re-push", length: Math.max(8, Math.round(points * 0.18)), base: 2.05, momentum: 1.04 },
      { name: "dead", length: points, base: 0.42, momentum: 0.8 },
    ]
  }

  if (reelType === "dead") {
    return [
      { name: "test", length: Math.max(8, Math.round(points * 0.18)), base: 0.18, momentum: 0.72 },
      { name: "push", length: Math.max(7, Math.round(points * 0.16)), base: 0.75, momentum: 0.94 },
      { name: "cooldown", length: Math.max(8, Math.round(points * 0.2)), base: 0.32, momentum: 0.82 },
      { name: "dead", length: points, base: 0.1, momentum: 0.72 },
    ]
  }

  return [
    { name: "test", length: Math.max(7, Math.round(points * 0.14)), base: 0.22, momentum: 0.75 },
    { name: "push", length: Math.max(10, Math.round(points * 0.24)), base: 1.75, momentum: 1.04 },
    { name: "cooldown", length: Math.max(9, Math.round(points * 0.2)), base: 0.82, momentum: 0.88 },
    { name: "re-push", length: Math.max(7, Math.round(points * 0.14)), base: 1.2, momentum: 0.96 },
    { name: "dead", length: points, base: 0.24, momentum: 0.76 },
  ]
}

const generateOrganicViews = (
  totalViews: number,
  points = 60,
  reelType: ReelType = "normal"
): { time: number; value: number }[] => {
  const total = Math.max(totalViews, 120)
  const phases = buildPhases(points, reelType)
  const scaleProfile = getViewScaleProfile(total)
  const increments: number[] = []

  let phaseIndex = 0
  let cumulative = 0
  let phasePoint = 0
  let previousIncrement =
    reelType === "viral" ? 1.8 :
    reelType === "dead" ? 0.45 :
    1

  while (increments.length < points) {
    const phase = phases[Math.min(phaseIndex, phases.length - 1)]
    const progress = increments.length / Math.max(points - 1, 1)
    const sinusoidal =
  1 +
  Math.sin(progress * Math.PI * 3.1) * 0.08 +
  Math.sin(progress * Math.PI * 11.2) * 0.02;

    let clusterBoost = 1
    const isBurstPhase = phase.name === "push" || phase.name === "re-push"

    if (isBurstPhase && previousIncrement > phase.base * 1.2 && Math.random() < 0.35) {
      const clusterLength = randomInRange(3, 6)
      clusterBoost = scaleProfile.clusterBoost + Math.random() * 0.18

      for (let burstOffset = 0; burstOffset < clusterLength && increments.length < points; burstOffset++) {
        const burstWave = 1 + Math.sin((burstOffset / Math.max(clusterLength - 1, 1)) * Math.PI) * 0.22
        const burstNoise = 1 + (Math.random() - 0.5) * scaleProfile.jitter
        let burstIncrement =
          previousIncrement * (phase.momentum + 0.03 * scaleProfile.momentumBonus) +
          phase.base * clusterBoost * burstWave * sinusoidal * burstNoise

        if (total < 1000 && Math.random() < scaleProfile.dipChance) {
          burstIncrement *= 0.72 + Math.random() * 0.18
        }

        burstIncrement = Math.max(0.05, burstIncrement)
        increments.push(burstIncrement)
        previousIncrement = burstIncrement
        phasePoint++

        if (phasePoint >= phase.length) {
          phaseIndex++
          phasePoint = 0
        }
      }

      continue
    }

    const noise = 1 + (Math.random() - 0.5) * scaleProfile.jitter
    const hour = increments.length % 24;
let hourBoost = 1;

if (hour < 8) hourBoost = 0.65;       // night slow
else if (hour < 18) hourBoost = 1.0;  // normal
else hourBoost = 1.35;                // evening boost

let increment =
  previousIncrement * (phase.momentum * scaleProfile.momentumBonus) +
  phase.base * sinusoidal * noise;

    // micro pause (realistic stagnation)
if (Math.random() < scaleProfile.flatChance) {
  increment *= 0.25 + Math.random() * 0.25;
}
increment *= hourBoost;

    if (total < 1000) {
      if (Math.random() < scaleProfile.dipChance) {
        increment *= 0.62 + Math.random() * 0.22
      }
      if (Math.random() < scaleProfile.chaos) {
        increment += phase.base * (Math.random() - 0.35)
      }
    } else if (total < 5000) {
      if (Math.random() < scaleProfile.flatChance) {
        increment *= 0.74 + Math.random() * 0.12
      }
    } else {
      increment = previousIncrement * 0.84 + increment * 0.16
    }

    if (phase.name === "dead") {
      increment *= 0.7 + Math.random() * 0.1
    }

    const saturation = cumulative / total;
increment *= (1 - Math.pow(saturation, 1.4));

increment = Math.max(0.05, increment);
    increments.push(increment);
cumulative += increment;
    previousIncrement = increment
    phasePoint++

    if (phasePoint >= phase.length) {
      phaseIndex++
      phasePoint = 0
    }
  }

  const smoothedIncrements =
    total > 5000
      ? weightedSmooth(weightedSmooth(increments))
      : total > 1000
        ? weightedSmooth(increments)
        : increments.map((value, index, arr) =>
            index === 0 || index === arr.length - 1 ? value : value * 0.72 + arr[index - 1] * 0.14 + arr[index + 1] * 0.14
          )

  const rawTotal = smoothedIncrements.reduce((sum, n) => sum + n, 0) || 1
  const scale = total / rawTotal

  cumulative = 0
  const result = smoothedIncrements.map((inc, index) => {
    cumulative += inc * scale
    return {
      time: index,
      value: Math.round(cumulative),
    }
  })

  result[0].value = Math.max(1, Math.round(total * 0.003))
  for (let i = 1; i < result.length; i++) {
    result[i].value = Math.max(result[i].value, result[i - 1].value + 1)
  }
  result[result.length - 1].value = total

  return result
}


const generateRetention = (
  duration = 20,
  reelType: ReelType = "normal"
): { second: number; retention: number }[] => {
  const totalSeconds = clamp(duration, 6, 45)

  const decayK =
    reelType === "viral" ? 0.085 :
    reelType === "dead" ? 0.14 :
    0.11

  const earlyReplayCenter = clamp(randomInRange(2, 4), 2, totalSeconds - 2)
  const midReplayCenter = clamp(Math.round(totalSeconds * (0.4 + Math.random() * 0.2)), 4, totalSeconds - 2)

  const gaussian = (x: number, center: number, width: number) =>
    Math.exp(-Math.pow(x - center, 2) / (2 * width * width))

  const hookStrength = Math.random(); // 0–1
  const raw: number[] = []

  for (let t = 0; t <= totalSeconds; t++) {
    const base = 100 * Math.exp(-decayK * t)
    const earlyDropPenalty = t <= 3 ? t * (reelType === "dead" ? 8 : 6) : 0

    const earlyReplay =
  (reelType === "viral" ? 8 : reelType === "dead" ? 4 : 6) *
  gaussian(t, earlyReplayCenter, 0.8) *
  (0.6 + hookStrength);

    const midReplay =
      (reelType === "viral" ? 7 : reelType === "dead" ? 3 : 5) *
      gaussian(t, midReplayCenter, 1.3)

    const shaped =
      base -
      earlyDropPenalty +
      earlyReplay +
      midReplay

    raw.push(clamp(shaped, 5, 100))
  }

  const smoothed = weightedSmooth(raw)
  const result: { second: number; retention: number }[] = []
  let previous = 100

  for (let i = 0; i < smoothed.length; i++) {
    let value = i === 0 ? 100 : Math.round(smoothed[i])

    if (i > 0) {
      const allowedRise = i <= 4 ? 4 : 2
      value = Math.min(value, previous + allowedRise)
    }

    value = clamp(value, 5, 100)
    result.push({ second: i, retention: value })
    previous = value
  }

  result[0].retention = 100
  return result
}

const generateViewsGraph = (views: number): GraphPoint[] => {
  const pointCount = getViewsPointCount(views)
  const reelType = pickReelType(views)
  const raw = generateOrganicViews(views, 60, reelType)
  const labels = ["28 Jan", "29 Jan", "30 Jan"]

  const mapped: GraphPoint[] = [];

for (let i = 0; i < pointCount; i++) {
  const rawIndex = Math.round((i / Math.max(pointCount - 1, 1)) * (raw.length - 1));
  const progress = i / Math.max(pointCount - 1, 1);
  const labelIndex = Math.min(2, Math.floor(progress * 3));

  // STATIC TYPICAL LINE (independent from views)
const baseTypicalPattern = [
  20, 35, 60, 90, 120, 150, 180, 210, 240, 270
];

const typicalValue =
  baseTypicalPattern[i] ??
  baseTypicalPattern[baseTypicalPattern.length - 1];

mapped.push({
  date: labels[labelIndex],
  thisReel: raw[rawIndex].value,
  typical: typicalValue,
});
}

  return mapped
}

const generateRetentionGraph = (videoDuration: string, avgWatchTime: string, views: number): RetentionPoint[] => {
  const totalSec = Math.max(parseTimeToSeconds(videoDuration), 6)
  const reelType = pickReelType(views)
  const raw = generateRetention(totalSec, reelType)
  const pointCount = getRetentionPointCount(views)

  return Array.from({ length: pointCount }, (_, i) => {
    const rawIndex = Math.round((i / Math.max(pointCount - 1, 1)) * (raw.length - 1))
    return {
      time: formatSeconds(raw[rawIndex].second),
      retention: raw[rawIndex].retention,
    }
  })
}



const DraggableGraph = ({
  data,
  onChange,
  locked,
  yAxisTop,
  greyLineLocked,
}: {
  data: GraphPoint[]
  onChange: (d: GraphPoint[]) => void
  locked: boolean
  yAxisTop: number
  greyLineLocked: boolean
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<{ index: number; line: "thisReel" | "typical" } | null>(null)
    const [xLabels, setXLabels] = useState<string[]>(() => {
    const defaults = ["28 Jan", "29 Jan", "30 Jan"]

    try {
      const saved = localStorage.getItem("graph-x-labels")
      if (saved) {
        const parsed = JSON.parse(saved)

        if (Array.isArray(parsed) && parsed.length === 3) {
          const repaired = parsed.map((label, index) =>
            typeof label === "string" && label.trim() ? label : defaults[index]
          )

          localStorage.setItem("graph-x-labels", JSON.stringify(repaired))
          return repaired
        }
      }
    } catch {}

    return defaults
  })
    const [editingX, setEditingX] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const [editingY, setEditingY] = useState<number | null>(null)
  const [editYValue, setEditYValue] = useState("")
  const yInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
    if (editingX !== null && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingX])

  useEffect(() => {
    if (editingY !== null && yInputRef.current) {
      yInputRef.current.focus()
      yInputRef.current.select()
    }
  }, [editingY])

  const padding = { top: 15, right: 10, bottom: 38, left: 44 }
  const width = 380
  const height = 170
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
    const yLabels = (() => {
    try {
      const saved = localStorage.getItem("graph-y-labels")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === 3) return parsed
      }
    } catch {}
    return ["0", formatViewsAxisLabel(Math.round(yAxisTop / 2)), formatViewsAxisLabel(yAxisTop)]
  })()
  const yPositions = [padding.top + chartH, padding.top + chartH / 2, padding.top]
    const getX = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * chartW
  const getThisReelX = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * (chartW * 0.75)
  const getY = (val: number) => padding.top + chartH - (Math.min(val, yAxisTop) / yAxisTop) * chartH
  const getValFromY = (clientY: number) => {
    const svg = svgRef.current
    if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    const svgY = ((clientY - rect.top) / rect.height) * height
    return Math.max(0, Math.min(yAxisTop, Math.round(((padding.top + chartH - svgY) / chartH) * yAxisTop)))
  }
  const buildPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return ""
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`
    return d
  }

  const fullPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.thisReel) }))
const cutoff = Math.ceil(fullPoints.length * 0.75)
const allThisReel = fullPoints.slice(0, cutoff)
    const handlePointerDown = (index: number, line: "thisReel" | "typical", e: React.PointerEvent) => {
    if (locked) return
    if (line === "typical" && greyLineLocked) return
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    setDragging({ index, line })
  }
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || locked) return
    e.preventDefault()
    const val = getValFromY(e.clientY)
    const nd = [...data]
    nd[dragging.index] = { ...nd[dragging.index], [dragging.line]: val }
    onChange(nd)
  }
  const handlePointerUp = () => setDragging(null)
    const xPositions = [padding.left + 18, padding.left + chartW / 2, padding.left + chartW - 14]
    const commitEdit = () => {
    if (editingX !== null) {
      const updated = [...xLabels]
      if (editValue.trim()) {
        updated[editingX] = editValue.trim()
      }
      setXLabels(updated)
      try { localStorage.setItem("graph-x-labels", JSON.stringify(updated)) } catch {}
      setEditingX(null)
    }
    setEditValue("")
  }
  const pathD = buildPath(allThisReel)

  return (
    <div className="relative -mx-1">
           {editingY !== null && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <input
            ref={yInputRef}
            value={editYValue}
            onChange={e => setEditYValue(e.target.value)}
            onBlur={() => {
              if (editingY !== null && editYValue.trim()) {
                const updated = [...yLabels]
                updated[editingY] = editYValue.trim()
                try { localStorage.setItem("graph-y-labels", JSON.stringify(updated)) } catch {}
              }
              setEditingY(null)
              setEditYValue("")
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                if (editingY !== null && editYValue.trim()) {
                  const updated = [...yLabels]
                  updated[editingY] = editYValue.trim()
                  try { localStorage.setItem("graph-y-labels", JSON.stringify(updated)) } catch {}
                }
                setEditingY(null)
                setEditYValue("")
              }
            }}
            className="pointer-events-auto bg-zinc-800 border border-fuchsia-500 rounded-lg px-3 py-1.5 text-[13px] text-white text-center w-[100px] outline-none shadow-lg"
            style={{ caretColor: PINK }}
          />
        </div>
      )}
      {editingX !== null && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => { if (e.key === "Enter") commitEdit() }}
            className="pointer-events-auto bg-zinc-800 border border-fuchsia-500 rounded-lg px-3 py-1.5 text-[13px] text-white text-center w-[100px] outline-none shadow-lg"
            style={{ caretColor: PINK }}
          />
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={`w-full select-none ${locked ? "" : "touch-none"}`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
                {yLabels.map((label, i) => (
          <text
            key={`yt-${i}`}
            x={padding.left - 8}
            y={yPositions[i] + 5}
            textAnchor="end"
            fill={editingY === i ? PINK : "#d1d5db"}
            fontSize="13"
            fontFamily="sans-serif"
            className={i === 0 || locked ? "cursor-default" : "cursor-pointer"}
            onClick={() => {
              if (locked || i === 0) return
              setEditingY(i)
              setEditYValue(label)
            }}
          >
            {label}
          </text>
        ))}
                {xLabels.map((label, i) => (
          <text
            key={`xt-${i}`}
            x={xPositions[i]}
            y={height - 6}
            textAnchor="middle"
            fill={editingX === i ? PINK : "#d1d5db"}
            fontSize="13"
            fontFamily="sans-serif"
            className={locked ? "cursor-default" : "cursor-pointer"}
            onClick={() => {
              if (locked) return
              setEditingX(i)
              setEditValue(label)
            }}
          >
            {label}
          </text>
        ))}

        {/* Horizontal grid lines */}
        {[0, yAxisTop / 2, yAxisTop].map((val, i) => (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            x2={padding.left + chartW}
            y1={getY(val)}
            y2={getY(val)}
            stroke="#2a2d33"
            strokeWidth="1"
            opacity="0.5"
          />
        ))}

        {/* Typical (grey dashed) line */}
        <path
          d={buildPath(data.map((d, i) => ({ x: getX(i), y: getY(d.typical) })))}
          fill="none"
          stroke="#8a8a8a"
          strokeWidth={4.25}
          strokeDasharray="6 6"
          strokeLinecap="round"
        />

        {/* Main pink line - 3/4 length */}
        <path
          d={pathD}
          fill="none"
          stroke={PINK}
          strokeWidth={5}
          strokeLinecap="round"
        />

                        {data.map((d, i) => (
          <circle
            key={`tr-${i}`}
            cx={getThisReelX(i)}
            cy={getY(d.thisReel)}
            r={30}
            fill="transparent"
            className={locked ? "cursor-default" : "cursor-grab active:cursor-grabbing"}
            onPointerDown={e => handlePointerDown(i, "thisReel", e)}
            style={{ touchAction: "none" }}
          />
        ))}
      </svg>

      <div className="flex items-center gap-6 mt-3 pl-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PINK }} />
          <span className="text-[10px] text-zinc-300">This reel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#8a8a8a]" />
          <span className="text-[10px] text-zinc-300">Your typical reel</span>
        </div>
      </div>
    </div>
  )
}


// ===== DRAGGABLE ENGAGEMENT GRAPH =====
type EngagementPoint = { time: string; value: number }
const DraggableEngagementGraph = ({ data, onChange, locked, videoDuration }: { data: EngagementPoint[]; onChange: (d: EngagementPoint[]) => void; locked: boolean; videoDuration: string }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const [editingRightX, setEditingRightX] = useState(false)
  const [rightXValue, setRightXValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editingRightX && inputRef.current) { inputRef.current.focus(); inputRef.current.select() } }, [editingRightX])
          const padding = { top: 15, right: 10, bottom: 38, left: 44 };
  const width = 380; const height = 200;
  const chartW = width - padding.left - padding.right; const chartH = height - padding.top - padding.bottom;
  const getX = (i: number) => (padding.left + 12) + (i / Math.max(data.length - 1, 1)) * (chartW - 12);
  const getY = (val: number) => padding.top + chartH - (Math.min(val, 100) / 100) * chartH;
  const getValFromY = (clientY: number) => { const svg = svgRef.current; if (!svg) return 0; const rect = svg.getBoundingClientRect(); const svgY = ((clientY - rect.top) / rect.height) * height; return Math.max(0, Math.min(100, Math.round(((padding.top + chartH - svgY) / chartH) * 100))) }
  const buildPath = (points: { x: number; y: number }[]) => { if (points.length < 2) return ""; let d = `M ${points[0].x} ${points[0].y}`; for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`; return d }
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }))
  const pathD = buildPath(points)
  const handlePointerDown = (index: number, e: React.PointerEvent) => { if (locked) return; e.preventDefault(); e.stopPropagation(); (e.target as Element).setPointerCapture?.(e.pointerId); setDragging(index) }
  const handlePointerMove = (e: React.PointerEvent) => { if (dragging === null || locked) return; e.preventDefault(); const val = getValFromY(e.clientY); const nd = [...data]; nd[dragging] = { ...nd[dragging], value: val }; onChange(nd) }
  const handlePointerUp = () => setDragging(null)
  const lastIdx = data.length - 1
  const commitRightX = () => { if (rightXValue.trim()) { const nd = [...data]; nd[lastIdx] = { ...nd[lastIdx], time: rightXValue.trim() }; onChange(nd) }; setEditingRightX(false) }
    // Right side label is always current video duration
  const rightLabel = videoDuration;

  return (
    <div className="relative -mx-1">
            <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className={`w-full select-none ${locked ? "" : "touch-none"}`} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
        {[0, 50, 100].map(t => <text key={t} x={padding.left - 8} y={getY(t) + 4} textAnchor="end" fill="#d1d5db" fontSize="13" fontFamily="sans-serif">{t === 0 ? "0" : `${t}%`}</text>)}
        <text x={padding.left + 15} y={height - 7} textAnchor="middle" fill="#d1d5db" fontSize="13" fontFamily="sans-serif">0:00</text>
        <text x={getX(lastIdx) - 8} y={height - 7} textAnchor="middle" fill="#d1d5db" fontSize="13" fontFamily="sans-serif">{rightLabel}</text>
                {[0, 50, 100].map((val, i) => (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            x2={padding.left + chartW}
            y1={getY(val)}
            y2={getY(val)}
            stroke="#2a2d33"
            strokeWidth="1"
            opacity="0.5"
          />
        ))}
             <path d={pathD} fill="none" stroke={PINK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => <circle key={i} cx={getX(i)} cy={getY(d.value)} r={18} fill="transparent" className={locked ? "cursor-default" : "cursor-grab active:cursor-grabbing"} onPointerDown={e => handlePointerDown(i, e)} style={{ touchAction: "none" }} />)}
      </svg>
    </div>
  )
}

// ===== DRAGGABLE RETENTION GRAPH =====
type RetentionPoint = { time: string; retention: number }
const DraggableRetentionGraph = ({ data, onChange, locked, videoDuration }: { data: RetentionPoint[]; onChange: (d: RetentionPoint[]) => void; locked: boolean; videoDuration: string }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const [editingRightX, setEditingRightX] = useState(false)
  const [rightXValue, setRightXValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editingRightX && inputRef.current) { inputRef.current.focus(); inputRef.current.select() } }, [editingRightX])
  const padding = { top: 15, right: 10, bottom: 38, left: 44 }
  const width = 380; const height = 150
  const chartW = width - padding.left - padding.right; const chartH = height - padding.top - padding.bottom
  const getX = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * chartW
  const getY = (val: number) => padding.top + chartH - (Math.min(val, 100) / 100) * chartH
  const getValFromY = (clientY: number) => { const svg = svgRef.current; if (!svg) return 0; const rect = svg.getBoundingClientRect(); const svgY = ((clientY - rect.top) / rect.height) * height; return Math.max(0, Math.min(100, Math.round(((padding.top + chartH - svgY) / chartH) * 100))) }
  const buildPath = (points: { x: number; y: number }[]) => { if (points.length < 2) return ""; let d = `M ${points[0].x} ${points[0].y}`; for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`; return d }
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.retention) }))
  const pathD = buildPath(points)
  const handlePointerDown = (index: number, e: React.PointerEvent) => { if (locked) return; e.preventDefault(); e.stopPropagation(); (e.target as Element).setPointerCapture?.(e.pointerId); setDragging(index) }
  const handlePointerMove = (e: React.PointerEvent) => { if (dragging === null || locked) return; e.preventDefault(); const val = getValFromY(e.clientY); const nd = [...data]; nd[dragging] = { ...nd[dragging], retention: val }; onChange(nd) }
  const handlePointerUp = () => setDragging(null)
  const lastIdx = data.length - 1
  const commitRightX = () => { if (rightXValue.trim()) { const nd = [...data]; nd[lastIdx] = { ...nd[lastIdx], time: rightXValue.trim() }; onChange(nd) }; setEditingRightX(false) }
  const totalSec = (() => { const parts = videoDuration.split(":").map(Number); return parts.length === 2 ? parts[0] * 60 + parts[1] : 31 })()
  const durMin = Math.floor(totalSec / 60); const durSec = totalSec % 60
  const dynamicDurLabel = `${durMin}:${durSec.toString().padStart(2, "0")}`

  return (
    <div className="relative -mx-1">
      {editingRightX && <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"><input ref={inputRef} value={rightXValue} onChange={e => setRightXValue(e.target.value)} onBlur={commitRightX} onKeyDown={e => { if (e.key === "Enter") commitRightX() }} className="pointer-events-auto bg-zinc-800 border border-fuchsia-500 rounded-lg px-3 py-1.5 text-[13px] text-white text-center w-[100px] outline-none shadow-lg" style={{ caretColor: PINK }} /></div>}
            <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className={`w-full select-none ${locked ? "" : "touch-none"}`} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
        {[0, 50, 100].map(t => <text key={t} x={padding.left - 8} y={getY(t) + 4} textAnchor="end" fill="#d1d5db" fontSize="13" fontFamily="sans-serif">{t === 0 ? "0" : `${t}%`}</text>)}
                <text x={getX(0) + 18} y={height - 7} textAnchor="middle" fill="#d1d5db" fontSize="13" fontFamily="sans-serif">0:00</text>
        <text x={getX(lastIdx) - 6} y={height - 7} textAnchor="middle" fill={editingRightX ? PINK : "#d1d5db"} fontSize="13" fontFamily="sans-serif" className={locked ? "cursor-default" : "cursor-pointer"} onClick={() => { if (locked) return; setRightXValue(dynamicDurLabel); setEditingRightX(true) }}>{dynamicDurLabel}</text>
                {[0, 50, 100].map((val, i) => (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            x2={padding.left + chartW}
            y1={getY(val)}
            y2={getY(val)}
            stroke="#2a2d33"
            strokeWidth="1"
            opacity="0.5"
          />
        ))}
             <path d={pathD} fill="none" stroke={PINK} strokeWidth={5} strokeLinecap="round" />
        {data.map((d, i) => <circle key={i} cx={getX(i)} cy={getY(d.retention)} r={16} fill="transparent" className={locked ? "cursor-default" : "cursor-grab active:cursor-grabbing"} onPointerDown={e => handlePointerDown(i, e)} style={{ touchAction: "none" }} />)}
      </svg>
    </div>
  )
}

const TABS = ["Overview", "Engagement", "Audience"] as const

export default function ReelInsights() {
    const { data: insightsData, saveData, isLoaded } = useInsightsStorage()
    const router = useRouter()

        useEffect(() => {
  if (!isLoaded) return
  const access = localStorage.getItem("access-granted")
  const savedKey = localStorage.getItem("device-access-key")
  if (access !== "true" || !savedKey) {
    router.replace("/")
  }
}, [isLoaded, router])
    const [headerImage, setHeaderImage] = useState<string | null>(null)
        const [thumbnailImage, setThumbnailImage] = useState<string | null>(() => {
    try { return localStorage.getItem("shared-thumbnail") } catch { return null }
  })
  const [retentionThumbnail, setRetentionThumbnail] = useState<string | null>(() => {
    try { return localStorage.getItem("shared-thumbnail") } catch { return null }
  })
    const [thumbnailUrl, setThumbnailUrl] = useState(() => {
    try { return localStorage.getItem("shared-thumbnail") || "" } catch { return "" }
  })
  const [viewsFilter, setViewsFilter] = useState<"All" | "Followers" | "Non-followers">("All")
  const [audienceTab, setAudienceTab] = useState<"Gender" | "Country" | "Age">("Age")
  const [animateCharts, setAnimateCharts] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [locked, setLocked] = useState(false)
  const [greyLineLocked, setGreyLineLocked] = useState(false)
   const [sourcesMode, setSourcesMode] = useState<"all" | "three">(() => {
    try {
      const saved = localStorage.getItem("sources-mode")
      if (saved === "three") return "three"
    } catch {}
    return "all"
  })
  const [profileActivity, setProfileActivity] = useState(0)
  const [profileVisits, setProfileVisits] = useState(0)
      const headerInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const retentionInputRef = useRef<HTMLInputElement>(null)
  const sharedThumbInputRef = useRef<HTMLInputElement>(null)
  const [mainTab, setMainTab] = useState<"Overview" | "Engagement" | "Audience">("Overview")
    const [animationKey, setAnimationKey] = useState(0)
    const [viewsAnimKey, setViewsAnimKey] = useState(0)
    const [showMetaVerifiedBanner, setShowMetaVerifiedBanner] = useState(true)
  const [animateBanner, setAnimateBanner] = useState(true)
    const overviewRef = useRef<HTMLDivElement>(null)
   const permanentGreyLine = useRef<number[]>([])

  const buildEngagementData = (videoDuration: string): EngagementPoint[] => {
    const totalSec = (() => { const parts = videoDuration.split(":").map(Number); return parts.length === 2 ? parts[0] * 60 + parts[1] : 31 })()
    const numPoints = Math.min(totalSec + 1, 20)
    const data: EngagementPoint[] = []
    for (let i = 0; i < numPoints; i++) {
      const p = i / (numPoints - 1); let v = 0
      if (p < 0.1) v = 60 + Math.random() * 30; else if (p < 0.2) v = 40 + Math.random() * 35
      else if (p < 0.4) v = 20 + Math.random() * 40; else if (p < 0.5) v = 50 + Math.random() * 40
      else if (p < 0.7) v = 15 + Math.random() * 30; else v = 5 + Math.random() * 20
      const timeSec = Math.round(p * totalSec); const tMin = Math.floor(timeSec / 60); const tSec = timeSec % 60
      data.push({ time: `${tMin}:${tSec.toString().padStart(2, "0")}`, value: Math.min(100, Math.max(0, v)) })
    }
    if (data.length > 0) { const dm = Math.floor(totalSec / 60); const ds = totalSec % 60; data[data.length - 1].time = `${dm}:${ds.toString().padStart(2, "0")}` }
    return data
  }

    const [engagementData, setEngagementData] = useState<EngagementPoint[]>([])

  

      
              useEffect(() => {
    try {
      const sl = localStorage.getItem("site-locked"); if (sl) setLocked(JSON.parse(sl))
      const gl = localStorage.getItem("grey-line-locked"); if (gl) setGreyLineLocked(JSON.parse(gl))
      const sh = localStorage.getItem("header-image"); if (sh) setHeaderImage(sh)

      const oldGrey = localStorage.getItem("grey-line-values")
      const activeGrey = localStorage.getItem("active-grey-pattern")
      if (oldGrey && !activeGrey) {
        localStorage.setItem("active-grey-pattern", oldGrey)
      }
    } catch {}
  }, [])

    useEffect(() => {
    try {
      const savedGrey = localStorage.getItem("permanent-grey-line")
      if (savedGrey) {
        const parsed: number[] = JSON.parse(savedGrey)
        if (Array.isArray(parsed) && parsed.length > 0) {
          permanentGreyLine.current = parsed
        }
      }
    } catch {}
  }, [])



  

    const toggleLock = () => { const n = !locked; setLocked(n); try { localStorage.setItem("site-locked", JSON.stringify(n)) } catch {} }
  const toggleGreyLineLock = () => { const n = !greyLineLocked; setGreyLineLocked(n); try { localStorage.setItem("grey-line-locked", JSON.stringify(n)) } catch {} }
   const replayOverviewAnimation = () => { setAnimationKey(p => p + 1) }

  const getSavedGreyPatterns = (): number[][] => {
    try {
      const raw = localStorage.getItem("grey-line-patterns")
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed)
        ? parsed.filter((item): item is number[] => Array.isArray(item) && item.every(v => typeof v === "number"))
        : []
    } catch {
      return []
    }
  }

  const setSavedGreyPatterns = (patterns: number[][]) => {
    try {
      localStorage.setItem("grey-line-patterns", JSON.stringify(patterns.slice(-MAX_GREY_PATTERNS)))
    } catch {}
  }

  const getActiveGreyPattern = (): number[] | null => {
    try {
      const raw = localStorage.getItem("active-grey-pattern")
      const parsed = raw ? JSON.parse(raw) : null
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  const setActiveGreyPattern = (pattern: number[]) => {
    try {
      localStorage.setItem("active-grey-pattern", JSON.stringify(pattern))
    } catch {}
  }

  const applyGreyPatternToGraph = (graph: GraphPoint[], pattern: number[]) => {
    return graph.map((point, index) => {
      const patternIndex = Math.round(
        (index / Math.max(graph.length - 1, 1)) * Math.max(pattern.length - 1, 1)
      )
      return {
        ...point,
        typical: pattern[patternIndex] ?? point.typical,
      }
    })
  }

  const saveCurrentGreyPattern = () => {
    const currentPattern = graphData.map(p => p.typical)
    const existing = getSavedGreyPatterns()
    const deduped = existing.filter(pattern => JSON.stringify(pattern) !== JSON.stringify(currentPattern))
    const nextPatterns = [...deduped, currentPattern].slice(-MAX_GREY_PATTERNS)
    setSavedGreyPatterns(nextPatterns)
    setActiveGreyPattern(currentPattern)
  }

      const mergeGreyTypicalLine = (nextData: GraphPoint[], prevData: GraphPoint[]) => {
    // If locked OR we have previous data, keep the grey values exactly as they were
    if (greyLineLocked || prevData.length > 0) {
      return nextData.map((point, index) => {
        const prevIndex = Math.round((index / Math.max(nextData.length - 1, 1)) * (prevData.length - 1))
        return {
          ...point,
          typical: prevData[prevIndex]?.typical ?? point.typical,
        }
      })
    }
    return nextData
  }

  const DEFAULT_GRAPH_DATA: GraphPoint[] = [
    { date: "28 Jan", thisReel: 80, typical: 60 }, { date: "28 Jan", thisReel: 200, typical: 80 },
    { date: "28 Jan", thisReel: 170, typical: 90 }, { date: "29 Jan", thisReel: 320, typical: 75 },
    { date: "29 Jan", thisReel: 290, typical: 100 }, { date: "29 Jan", thisReel: 400, typical: 85 },
    { date: "30 Jan", thisReel: 370, typical: 95 }, { date: "30 Jan", thisReel: 460, typical: 80 },
    { date: "30 Jan", thisReel: 481, typical: 110 },
  ]
    const [graphData, setGraphData] = useState<GraphPoint[]>(() => {
    try {
      const saved = localStorage.getItem("saved-graph-data")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return DEFAULT_GRAPH_DATA
  })
      const [retentionData, setRetentionData] = useState<RetentionPoint[]>(
    generateRetentionGraph(insightsData.videoDuration, insightsData.avgWatchTime, insightsData.views)
  )



  

      useEffect(() => {
    try {
      const se = localStorage.getItem("engagement-graph-data")
      if (se) {
        const p = JSON.parse(se)
        if (Array.isArray(p) && p.length > 0) {
          setEngagementData(p)
          return
        }
      }
      setEngagementData(buildEngagementData(insightsData.videoDuration))
    } catch {
      setEngagementData(buildEngagementData(insightsData.videoDuration))
    }
  }, [insightsData.videoDuration])



      const handleGraphChange = (nd: GraphPoint[]) => {
    if (locked) return
    setGraphData(nd)
    try {
      localStorage.setItem("saved-graph-data", JSON.stringify(nd))
      localStorage.setItem("saved-grey-line", JSON.stringify(nd.map(p => p.typical)))
    } catch {}
  }
  const handleRetentionChange = (nd: RetentionPoint[]) => { if (locked) return; setRetentionData(nd) }
  const handleEngagementChange = (nd: EngagementPoint[]) => { if (locked) return; setEngagementData(nd); try { localStorage.setItem("engagement-graph-data", JSON.stringify(nd)) } catch {} }

                  const refreshViewsGraph = () => {
    if (locked) return
    const next = generateViewsGraph(insightsData.views)
    setGraphData(prev => {
      const greyValues = prev.map(p => p.typical)
      const result = next.map((point, index) => {
        const greyIndex = Math.round((index / Math.max(next.length - 1, 1)) * Math.max(greyValues.length - 1, 1))
        return {
          date: point.date,
          thisReel: point.thisReel,
          typical: greyValues[greyIndex] ?? 100,
        }
      })
      try { localStorage.setItem("saved-graph-data", JSON.stringify(result)) } catch {}
      return result
    })
  }

  const refreshRetentionGraph = () => {
    if (locked) return
    setRetentionData(generateRetentionGraph(insightsData.videoDuration, insightsData.avgWatchTime, insightsData.views))
  }



                        useEffect(() => {
    if (!isLoaded) return

    const automated = getAutomatedActions(insightsData.views)
    setProfileActivity(automated.follows)
    setProfileVisits(automated.profileVisits)

    // Only update pink line. Grey line comes from saved data.
    const next = generateViewsGraph(insightsData.views)

        setGraphData(prev => {
      // Load saved graph from localStorage (has both pink + grey)
      let savedGraph: GraphPoint[] = []
      try {
        const saved = localStorage.getItem("saved-graph-data")
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            savedGraph = parsed
          }
        }
      } catch {}

      // If we have saved graph, use its pink AND grey values
      if (savedGraph.length > 0) {
        return savedGraph
      }

      // Otherwise use generated pink + saved grey
      let greyValues: number[] = []
      try {
        const saved = localStorage.getItem("saved-grey-line")
        if (saved) greyValues = JSON.parse(saved)
      } catch {}

      if (!greyValues.length && prev.length > 0) {
        greyValues = prev.map(p => p.typical)
      }

      if (!greyValues.length) {
        greyValues = DEFAULT_GRAPH_DATA.map(p => p.typical)
      }

      const result = next.map((point, index) => {
        const greyIndex = Math.round((index / Math.max(next.length - 1, 1)) * Math.max(greyValues.length - 1, 1))
        return {
          date: point.date,
          thisReel: point.thisReel,
          typical: greyValues[greyIndex] ?? 100,
        }
      })

      try { localStorage.setItem("saved-graph-data", JSON.stringify(result)) } catch {}
      return result
    })
    setRetentionData(generateRetentionGraph(insightsData.videoDuration, insightsData.avgWatchTime, insightsData.views))
  }, [isLoaded, insightsData.views, insightsData.videoDuration, insightsData.avgWatchTime])

    const hasAutoCalculated = useRef(false)

  useEffect(() => {
    if (!isLoaded) return
    if (hasAutoCalculated.current) return
    hasAutoCalculated.current = true

    const nextAvgWatchTime = getAutoAverageWatchTime(insightsData.videoDuration)
    const nextAccountsReached = getAutoAccountsReached(insightsData.views)

    // Randomize followers
    const fp = parseFloat((Math.random() * 8 + 2).toFixed(1))

       // Randomize sources based on mode
    const savedMode = localStorage.getItem("sources-mode")
    const reels = parseFloat((75 + Math.random() * 10).toFixed(1))
    let nextSources
    if (savedMode === "three") {
      const profile = parseFloat((Math.random() * 3).toFixed(1))
      const explore = parseFloat((100 - reels - profile).toFixed(1))
      nextSources = [
        { name: "Reels tab", percentage: reels },
        { name: "Explore", percentage: Math.max(0, explore) },
        { name: "Profile", percentage: Math.max(0, profile) },
      ]
    } else {
      const explore = parseFloat((5 + Math.random() * 10).toFixed(1))
      const rem = parseFloat((100 - reels - explore).toFixed(1))
      const stories = parseFloat((rem * 0.55).toFixed(1))
      const prof = parseFloat((rem * 0.28).toFixed(1))
      const feed = parseFloat((rem - stories - prof).toFixed(1))
      nextSources = [
        { name: "Reels tab", percentage: reels },
        { name: "Explore", percentage: explore },
        { name: "Stories", percentage: stories },
        { name: "Profile", percentage: prof },
        { name: "Feed", percentage: Math.max(0, feed) },
      ]
    }

    // Randomize countries
        const us = parseFloat((40 + Math.random() * 15).toFixed(1))
    const uk = parseFloat((20 + Math.random() * 8).toFixed(1))
    const ca = parseFloat((12 + Math.random() * 6).toFixed(1))
    const au = parseFloat((8 + Math.random() * 5).toFixed(1))
    const de = parseFloat((4 + Math.random() * 3).toFixed(1))
    const ot = parseFloat((100 - us - uk - ca - au - de).toFixed(1))

    // Randomize age
    const a13 = parseFloat((5 + Math.random() * 8).toFixed(1))
    const a18 = parseFloat((35 + Math.random() * 13).toFixed(1))
    const a25 = parseFloat((30 + Math.random() * 12).toFixed(1))
    const a35 = parseFloat((5 + Math.random() * 5).toFixed(1))
    const a45 = parseFloat((1 + Math.random() * 3).toFixed(1))
    const a55 = parseFloat((0.3 + Math.random() * 1.2).toFixed(1))
    const a65 = parseFloat((100 - a13 - a18 - a25 - a35 - a45 - a55).toFixed(1))

    // Randomize gender
    const men = parseFloat((45 + Math.random() * 10).toFixed(1))

    saveData({
      ...insightsData,
      avgWatchTime: nextAvgWatchTime,
      accountsReached: nextAccountsReached,
      followerPercentage: fp,
      sourcesData: nextSources,
      countryData: [
        { name: insightsData.countryData[0]?.name ?? "United States", percentage: us },
        { name: insightsData.countryData[1]?.name ?? "United Kingdom", percentage: uk },
        { name: insightsData.countryData[2]?.name ?? "Canada", percentage: ca },
        { name: insightsData.countryData[3]?.name ?? "Australia", percentage: au },
        { name: insightsData.countryData[4]?.name ?? "Germany", percentage: de },
        { name: insightsData.countryData[5]?.name ?? "Others", percentage: Math.max(0, ot) },
      ],
      ageData: [
        { name: "13-17", percentage: Math.max(0, a13) },
        { name: "18-24", percentage: a18 },
        { name: "25-34", percentage: a25 },
        { name: "35-44", percentage: a35 },
        { name: "45-54", percentage: a45 },
        { name: "55-64", percentage: a55 },
        { name: "65+", percentage: Math.max(0, a65) },
      ],
      genderData: { men, women: parseFloat((100 - men).toFixed(1)) },
    })
  }, [isLoaded])



  useEffect(() => {
    setSummaryLoading(true)
    const t1 = setTimeout(() => setSummaryLoading(false), 900)
    const t2 = setTimeout(() => setAnimateCharts(true), 300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [insightsData])



    const handleEditorSave = (ud: InsightsData) => {
  const updatedData = {
    ...ud,
    avgWatchTime: getAutoAverageWatchTime(ud.videoDuration),
    accountsReached: getAutoAccountsReached(ud.views),
  }

  saveData(updatedData)
  setAnimateCharts(false)
  setTimeout(() => setAnimateCharts(true), 50)
}
  const handleHeaderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (locked) return
    const f = e.target.files?.[0]
    if (f) {
      const r = new FileReader()
      r.onload = ev => {
        const result = ev.target?.result as string
        setHeaderImage(result)
        try { localStorage.setItem("header-image", result) } catch {}
      }
      r.readAsDataURL(f)
    }
  }

     const handleSharedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setThumbnailUrl(result)
      setThumbnailImage(result)
      setRetentionThumbnail(result)
      try { localStorage.setItem("shared-thumbnail", result) } catch {}
    }
    reader.readAsDataURL(file)
  }
    const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (locked) return
    const f = e.target.files?.[0]
    if (f) {
      const r = new FileReader()
      r.onload = ev => {
        const result = ev.target?.result as string
        setThumbnailImage(result)
        setRetentionThumbnail(result)
        setThumbnailUrl(result)
        try { localStorage.setItem("reel-thumb-url", result) } catch {}
      }
      r.readAsDataURL(f)
    }
  }
  const handleRetentionThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (locked) return; const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setRetentionThumbnail(ev.target?.result as string); r.readAsDataURL(f) } }

  const saveGender = (newMen: number) => { const nw = parseFloat((100 - newMen).toFixed(1)); try { localStorage.setItem("gender-data", JSON.stringify({ men: newMen, women: nw })) } catch {}; saveData({ ...insightsData, genderData: { men: newMen, women: nw } }) }

  const totalViews = insightsData.views || 1
  const affectsData = [
    { icon: <SkipRateIcon />, label: "Skip rate", value: `${insightsData.skipRateThis.toFixed(1)}%` },
    { icon: <ShareRateIcon />, label: "Share rate", value: `${((insightsData.shares / totalViews) * 100).toFixed(1)}%` },
    { icon: <LikeRateIcon />, label: "Like rate", value: `${((insightsData.likes / totalViews) * 100).toFixed(1)}%` },
    { icon: <SaveRateIcon />, label: "Save rate", value: `${((insightsData.bookmarks / totalViews) * 100).toFixed(1)}%` },
    { icon: <RepostRateIcon />, label: "Repost rate", value: `${((insightsData.reposts / totalViews) * 100).toFixed(1)}%` },
    { icon: <CommentRateIcon />, label: "Comment rate", value: `${((insightsData.comments / totalViews) * 100).toFixed(1)}%` },
  ]

  return (
    <>
      <style>{shimmerKeyframes}{`
  html, body {
    scrollbar-width: none;
    -ms-overflow-style: none;
    -webkit-tap-highlight-color: transparent;
  }

  html::-webkit-scrollbar,
  body::-webkit-scrollbar {
    display: none;
  }

  body {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  svg text,
  svg tspan {
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  input,
  textarea,
  select,
  [contenteditable="true"] {
    -webkit-user-select: text;
    user-select: text;
    -webkit-touch-callout: default;
  }
`}</style>

      <div
  className="min-h-screen text-white font-sans antialiased flex justify-center"
  style={{ backgroundColor: BG, overflowX: "clip" }}
>
        <div className="w-full max-w-[420px]">

                    {/* Header Image */}
                    <header
            className="fixed top-0 z-50 w-full max-w-[420px]"
            style={{ backgroundColor: BG }}
          >

            <div
              className="relative h-[48px] w-full overflow-hidden cursor-pointer group bg-zinc-900"
              onClick={() => { if (!locked) headerInputRef.current?.click() }}
            >
              {headerImage ? (
                <>
                  <img src={headerImage} alt="Header" className="w-full h-full object-cover" />
                  {!locked && (
                    <button
                      className="absolute top-1.5 right-2 p-1 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={e => {
                        e.stopPropagation()
                        setHeaderImage(null)
                        try { localStorage.removeItem("header-image") } catch {}
                      }}
                    >
                      <CloseIcon />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 hover:text-zinc-300 transition-colors">
                  <div className="flex items-center gap-2">
                    <UploadIcon />
                    <span className="text-[11px] font-medium">Upload header image</span>
                  </div>
                </div>
              )}
              <input
                ref={headerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleHeaderUpload}
              />
            </div>
          </header>


                    {/* Header Spacer */}
          <div className="h-[48px]" />

          {/* Thumbnail */}
          <section className="flex flex-col items-center pt-4 pb-4 px-5">

                
                          <div
              className="relative w-[130px] h-[230px] bg-zinc-900 rounded-lg overflow-hidden cursor-pointer group shadow-lg"
              onClick={() => { if (!locked) sharedThumbInputRef.current?.click() }}
            >
              {(thumbnailUrl || thumbnailImage) ? (
                <>
                  <img src={thumbnailUrl || thumbnailImage || ""} alt="Reel" className="w-full h-full object-cover" />
                  {!locked && (
                    <button
                      className="absolute top-1.5 right-1.5 p-1 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={e => {
  e.stopPropagation()
  setThumbnailUrl("")
  setThumbnailImage(null)
  setRetentionThumbnail(null)
  try { localStorage.removeItem("shared-thumbnail") } catch {}
}}
                    >
                      <CloseIcon />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 hover:text-zinc-300 transition-colors">
                  <UploadIcon />
                  <span className="text-[9px] mt-1.5 font-medium">Upload thumbnail</span>
                </div>
              )}
            </div>
            <input ref={sharedThumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleSharedImageUpload} />
<div
  className="flex items-center justify-center gap-7 w-full px-3 overflow-hidden mt-4"
  style={{
    position: "relative",
    width: "100%",
    backgroundColor: "transparent",
    alignItems: "center",
  }}
>

  <div className="flex flex-col items-center gap-1 min-w-[38px]" style={{ lineHeight: 0 }}>
    <HeartIcon />
    <span className="text-[12px] text-white leading-none font-bold">{insightsData.likes}</span>
  </div>

  <div className="flex flex-col items-center gap-1 min-w-[38px]" style={{ lineHeight: 0 }}>
    <CommentIcon />
    <span className="text-[12px] text-white leading-none font-bold">{insightsData.comments}</span>
  </div>

  <div className="flex flex-col items-center gap-1 min-w-[38px]" style={{ lineHeight: 0 }}>
    <RepostIcon />
    <span className="text-[12px] text-white leading-none font-bold">{insightsData.reposts}</span>
  </div>

  <div className="flex flex-col items-center gap-1 min-w-[38px]" style={{ lineHeight: 0 }}>
    <SendIcon />
    <span className="text-[12px] text-white leading-none font-bold">{insightsData.shares}</span>
  </div>

  <div className="flex flex-col items-center gap-1 min-w-[38px]" style={{ lineHeight: 0 }}>
    <BookmarkIcon />
    <span className="text-[12px] text-white leading-none font-bold">{insightsData.bookmarks}</span>
  </div>
</div>
          </section>

                                       
<LayoutGroup>
  <div
    className="sticky z-50 flex border-b border-zinc-800/40"
    style={{
      top: "48px",
      paddingTop: "1px",
      backgroundColor: BG,
    }}
  >
    {TABS.map(tab => (
      <button
        key={tab}
        onClick={() => setMainTab(tab)}
        className={`flex-1 py-2.5 text-[13px] font-medium text-center relative transition-colors ${mainTab === tab ? "text-white" : "text-gray-300"}`}
      >
        {tab}
        {mainTab === tab && (
          <motion.div
            layoutId="activeTabUnderline"
            initial={false}
            className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-white rounded-full"
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          />
        )}
      </button>
    ))}
  </div>
</LayoutGroup>

          <main className="pb-12">
            <AnimatePresence mode="wait">

              {/* ===== OVERVIEW ===== */}
              {mainTab === "Overview" && (
                <motion.div key="overview" variants={tabContent} initial="initial" animate="animate" exit="exit">

                        <div className="px-4 pt-4">
  <div
    style={{
      height: showMetaVerifiedBanner ? "auto" : "0px",
      overflow: "hidden",
      transition: "all 0.25s ease",
    }}
  >
        <div
      style={{
        opacity: showMetaVerifiedBanner ? 1 : 0,
        transform: showMetaVerifiedBanner ? "scale(1)" : "scale(0.98)",
        transition: "all 0.25s ease",
      }}
    >
      <div
        style={{
          transform: animateBanner ? "translateY(0px)" : "translateY(20px)",
          opacity: animateBanner ? 1 : 0,
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
      <div
        className="flex items-start justify-between gap-[10px] rounded-[14px] border border-[#1f2328] px-[14px] py-[12px] mb-[14px]"
        style={{ backgroundColor: "#0c0f14" }}
      >
                        <div className="shrink-0 mt-[6px]">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 24 24"><path d="M14.973 8.988a1 1 0 0 1 1.28 1.537l-.076.063a36.6 36.6 0 0 0-4.689 4.688 1.09 1.09 0 0 1-1.607.074l-2.183-2.183a1.001 1.001 0 0 1 1.414-1.415L10.6 13.24a38.6 38.6 0 0 1 4.296-4.188z"/><path fillRule="evenodd" d="M13.944 2.122a1 1 0 0 1 1.332.356l1.149 1.88 2.204.056.098.008a1 1 0 0 1 .876.967l.055 2.203 1.88 1.15a1 1 0 0 1 .358 1.331l-1.054 1.936 1.054 1.935a1 1 0 0 1-.357 1.332l-1.88 1.149-.056 2.204a1 1 0 0 1-.974.974l-2.204.055-1.149 1.881a1 1 0 0 1-1.332.357l-1.935-1.054-1.936 1.054a1 1 0 0 1-1.332-.357l-1.15-1.88-2.202-.056a1 1 0 0 1-.975-.974l-.056-2.204-1.88-1.149a1 1 0 0 1-.356-1.332l1.054-1.935-1.054-1.936a1 1 0 0 1 .356-1.332l1.88-1.15.056-2.202a1 1 0 0 1 .975-.975l2.203-.056 1.15-1.88.055-.082a1 1 0 0 1 1.276-.274l1.936 1.054zm-4.93 3.745a1 1 0 0 1-.828.478L6.39 6.39l-.045 1.796a1 1 0 0 1-.478.829l-1.535.937.86 1.578a1 1 0 0 1 0 .957l-.86 1.577 1.535.939.103.072a1 1 0 0 1 .375.756l.045 1.797 1.796.045.126.01a1 1 0 0 1 .703.468l.937 1.534 1.578-.86.115-.054c.273-.106.582-.088.842.054l1.578.858.938-1.532.072-.103a1 1 0 0 1 .756-.375l1.797-.045.045-1.797.01-.126a1 1 0 0 1 .468-.702l1.532-.938-.858-1.578a1 1 0 0 1 0-.957l.86-1.578-1.534-.937a1 1 0 0 1-.478-.829l-.045-1.796-1.797-.045a1 1 0 0 1-.828-.478l-.939-1.534-1.577.86a1 1 0 0 1-.957 0l-1.578-.861z" clipRule="evenodd"/></svg>
        </div>

        <div className="flex-1">
                    <div className="text-[10px] leading-[1.35] text-white">
            Content from Meta Verified subscribers get more views, likes and comments on average.
          </div>
          <div className="mt-2 text-[11px] font-semibold text-[#8c9edd] cursor-pointer">
            Try Meta Verified for ₹45
          </div>
        </div>

              <button
        className="text-[#9ca3af] shrink-0 mt-[2px] active:opacity-60 transition-opacity"
        onClick={() => setShowMetaVerifiedBanner(false)}
      >
        <CloseIcon />
      </button>
    </div>
    </div>
    </div>
  </div>
</div><section ref={overviewRef} key={animationKey} className="px-4 pt-0 pb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-[15px] font-semibold">Summary</h3>
                      <button onClick={() => { setSummaryLoading(true); setViewsAnimKey(k => k + 1); setTimeout(() => setSummaryLoading(false), 800); setAnimateBanner(false); setTimeout(() => setAnimateBanner(true), 400) }} className="focus:outline-none active:opacity-60 transition-opacity"><InfoIcon /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: "Views", value: insightsData.views },
                        { label: "Accounts reached", value: insightsData.accountsReached },
                        { label: "Average watch time", value: insightsData.avgWatchTime },
                        { label: "Follows", value: profileActivity },
                      ].map((card, i) => (
                        <div
                          key={card.label}
                          className="rounded-xl p-3.5 relative overflow-hidden"
                          style={{ backgroundColor: CARD_BG, minHeight: 72, transform: "none" }}
                        >
                          {/* Shimmer overlay — sits on top, doesn't affect layout */}
                          {summaryLoading && (
                            <div className="absolute inset-0 z-10" style={{ ...shimmerStyle, animationDelay: `${i * 0.08}s` }} />
                          )}

                          {/* Content — ALWAYS rendered to maintain fixed height */}
                          <div style={{ opacity: summaryLoading ? 0 : 1, transition: "opacity 0.2s ease-out" }}>
                            <div className="h-[14px] mb-1 flex items-center">
                              <span className="text-[11px] text-gray-400">{card.label}</span>
                            </div>
                                                                                    <div className="h-[24px] flex items-center">
                              {card.label === "Average watch time" ? (
                                <span className="text-[17px] font-bold text-white">{card.value}</span>
                              ) : card.label === "Follows" ? (
                                <span className="text-[17px] font-bold text-white">{profileActivity}</span>
                                                            ) : card.label === "Accounts reached" ? (
                                <InlineEditor
                                  value={(card.value as number).toLocaleString("en-IN")}
                                  isNumber={true}
                                  locked={locked}
                                  className="text-[17px] font-bold text-white"
                                  onSave={(val: number) => {
                                    saveData({ ...insightsData, accountsReached: val })
                                  }}
                                />
                              ) : (
                                <span className="text-[17px] font-bold text-white">{(card.value as number).toLocaleString("en-IN")}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="px-4 py-5">
                                        <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold">Views</h3>
                        <button
                          className="focus:outline-none active:opacity-60 transition-opacity"
                          onClick={refreshViewsGraph}
                        >
                          <InfoIcon />
                        </button>
                      </div>
                      <AnimatedNumber value={insightsData.views} className="text-[15px] font-semibold" triggerKey={viewsAnimKey} />
                    </div>

                    <div className="flex gap-2 mb-4">
                      {(["All", "Followers", "Non-followers"] as const).map(filter => (
                        <button key={filter} onClick={() => setViewsFilter(filter)} className={`px-3.5 py-[7px] rounded-full text-[11px] font-medium transition-all duration-200 ${viewsFilter === filter ? "text-white" : "bg-transparent text-white border border-zinc-700"}`} style={viewsFilter === filter ? { backgroundColor: CARD_BG } : {}}>{filter}</button>
                      ))}
                    </div>
                    <div className="mt-4">
                                         <DraggableGraph
                      data={graphData}
                      onChange={handleGraphChange}
                      locked={locked}
                      greyLineLocked={greyLineLocked}
                      yAxisTop={getViewsAxisTop(insightsData.views)}
                    />
                    </div>

                  </section>

                  <section className="px-4 py-5">
                    <div className="flex flex-col gap-1 mb-4">
  <div className="flex items-center gap-2">
    <h3 className="text-[15px] font-semibold">What affects your views</h3>
    <InfoIcon />
  </div>
  <span className="text-[11px] text-zinc-300">
    Rates are listed in order of importance to reach.
  </span>
</div>
                                        <div className="space-y-5">
                      {affectsData.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                            <div className="rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: CARD_BG, width: 52, height: 52 }}>{item.icon}</div>
                            <span className="text-[14px] text-white font-medium">{item.label}</span>
                          </div>
                          <span className="text-[14px] text-white font-semibold">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                                   <section className="px-4 py-5">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-[15px] font-semibold">How long people watched your reel</h3>
                      <button
                        className="focus:outline-none active:opacity-60 transition-opacity"
                        onClick={refreshRetentionGraph}
                      >
                        <InfoIcon />
                      </button>
                    </div>
                    <div className="flex justify-center mb-5">

                                                                  <div className="relative w-[100px] h-[170px] bg-zinc-900 rounded-xl overflow-hidden cursor-pointer group shadow-xl" onClick={() => { if (!locked) sharedThumbInputRef.current?.click() }}>
                        {(thumbnailUrl || retentionThumbnail) ? (
                          <>
                            <img src={thumbnailUrl || retentionThumbnail || ""} alt="Retention" className="w-full h-full object-cover" />
                            {!locked && (
                              <button
                                className="absolute top-1.5 right-1.5 p-1 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={e => {
  e.stopPropagation()
  setThumbnailUrl("")
  setThumbnailImage(null)
  setRetentionThumbnail(null)
  try { localStorage.removeItem("shared-thumbnail") } catch {}
}}
                              >
                                <CloseIcon />
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            <span className="text-[9px] mt-1.5">Upload</span>
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg></div>
                      </div>
                    </div>
                    <DraggableRetentionGraph data={retentionData} onChange={handleRetentionChange} locked={locked} videoDuration={insightsData.videoDuration} />
                  </section>

                  <section className="px-4 py-5">
                    <div className="flex items-center gap-2 mb-4"><h4 className="text-[15px] font-semibold">Top sources of views</h4><InfoIcon /></div>
                    <div className="space-y-4">
                      {insightsData.sourcesData.map((source, index) => (
                        <div key={source.name}>
                          <div className="flex justify-between mb-1.5"><span className="text-[13px] text-white">{source.name}</span><span className="text-[13px] text-white font-medium">{source.percentage.toFixed(1)}%</span></div>
                          <SimpleBar percentage={source.percentage} color={PINK} animateCharts={animateCharts} delay={index * 100} />
                        </div>
                      ))}
                    </div>
                  </section>

                                                      <section className="px-4 py-5">
                    <h3 className="text-[15px] font-semibold mb-3">Ad</h3>
                    <button
                      className="w-full flex items-center justify-between py-2 active:opacity-60 transition-opacity"
                      onClick={() => setBottomSheetOpen(true)}
                    >
                      <div className="flex items-center gap-3">
                        <BoostIcon />
                        <span className="text-[13px] text-white font-medium">Boost this Reel</span>
                      </div>
                      <ChevronRightIcon />
                    </button>
                  </section>

                </motion.div>
              )}

              {/* ===== ENGAGEMENT ===== */}
              {mainTab === "Engagement" && (
                <motion.div key="engagement" variants={tabContent} initial="initial" animate="animate" exit="exit">
                  <section className="px-4 py-5">
                                       <div className="flex items-center gap-2 mb-8"><h3 className="text-[15px] font-semibold">When people liked your reel</h3><InfoIcon /></div>
                    {engagementData.length > 0 && <DraggableEngagementGraph data={engagementData} onChange={handleEngagementChange} locked={locked} videoDuration={insightsData.videoDuration} />}
                  </section>

                  <section className="px-4 py-5">
                    <div className="flex items-center gap-2 mb-4"><h3 className="text-[15px] font-semibold">Actions after viewing</h3><InfoIcon /></div>
                    <div className="space-y-3.5">
                                            <div className="flex justify-between items-center">
                        <span className="text-[13px] text-white">Follows</span>
                        <span className="text-[13px] text-white font-semibold">{profileActivity}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-white">Profile visits</span>
                        <span className="text-[13px] text-white font-semibold">{profileVisits}</span>
                      </div>

                    </div>
                  </section>

                  <section className="px-4 py-5">
                    <div className="flex items-center gap-2 mb-4"><h3 className="text-[15px] font-semibold">Interactions</h3><InfoIcon /></div>
                    <div className="space-y-3.5">
                      {[["Likes", insightsData.likes], ["Comments", insightsData.comments], ["Reposts", insightsData.reposts], ["Shares", insightsData.shares], ["Saves", insightsData.bookmarks]].map(([label, val]) => (
                        <div key={label as string} className="flex justify-between items-center">
                          <span className="text-[13px] text-white">{label}</span>
                          <span className="text-[13px] text-white font-semibold">{val}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </motion.div>
              )}

              {/* ===== AUDIENCE ===== */}
              {mainTab === "Audience" && (
                <motion.div key="audience" variants={tabContent} initial="initial" animate="animate" exit="exit">
                  <section className="px-4 pt-5 pb-3">
                    <div className="flex items-center gap-2 mb-4"><h3 className="text-[15px] font-semibold">Who viewed your reel</h3><InfoIcon /></div>
                    <AudienceRow labelNode={<span>Followers</span>} percentage={insightsData.followerPercentage} barColor={PINK} animateCharts={animateCharts} delay={0} />
                    <AudienceRow labelNode={<span>Non-followers</span>} percentage={100 - insightsData.followerPercentage} barColor={PURPLE} animateCharts={animateCharts} delay={120} />
                  </section>

                  <section className="px-4 pt-3 pb-5">
                                        <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-[15px] font-semibold">Audience details</h3>
                      <button className="focus:outline-none active:opacity-60 transition-opacity" onClick={() => {
                        const us = parseFloat((40 + Math.random() * 15).toFixed(1))
                        const uk = parseFloat((15 + Math.random() * 10).toFixed(1))
                        const ca = parseFloat((8 + Math.random() * 8).toFixed(1))
                        const au = parseFloat((5 + Math.random() * 6).toFixed(1))
                        const de = parseFloat((3 + Math.random() * 4).toFixed(1))
                        const ot = parseFloat(Math.max(0, 100 - us - uk - ca - au - de).toFixed(1))
                        saveData({
                          ...insightsData,
                          countryData: [
                            { name: insightsData.countryData[0]?.name ?? "United States", percentage: us },
                            { name: insightsData.countryData[1]?.name ?? "United Kingdom", percentage: uk },
                            { name: insightsData.countryData[2]?.name ?? "Canada", percentage: ca },
                            { name: insightsData.countryData[3]?.name ?? "Australia", percentage: au },
                            { name: insightsData.countryData[4]?.name ?? "Germany", percentage: de },
                            { name: insightsData.countryData[5]?.name ?? "Others", percentage: ot },
                          ],
                        })
                      }}><InfoIcon /></button>
                    </div>
                    <div className="flex gap-2 mb-5">
                      {(["Age", "Country", "Gender"] as const).map(tab => (
                        <button key={tab} onClick={() => setAudienceTab(tab === "Age" ? "Age" : tab === "Country" ? "Country" : "Gender")} className={`px-4 py-[8px] rounded-full text-[12px] font-medium transition-all duration-200 border ${audienceTab === tab ? "text-white border-transparent" : "bg-transparent text-white border-zinc-700"}`} style={audienceTab === tab ? { backgroundColor: CARD_BG } : {}}>{tab}</button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {audienceTab === "Age" && (
                        <motion.div key="age" variants={tabContent} initial="initial" animate="animate" exit="exit">
                          {insightsData.ageData.map((age, index) => <AudienceRow key={age.name} labelNode={<span>{age.name}</span>} percentage={age.percentage} barColor={PINK} animateCharts={animateCharts} delay={index * 60} />)}
                        </motion.div>
                      )}
                                            {audienceTab === "Country" && (
                        <motion.div key="country" variants={tabContent} initial="initial" animate="animate" exit="exit">
                          {insightsData.countryData.map((country, index) => (
                            <div key={index} className="mb-3.5">
                              <div className="mb-1 text-[13px] text-white">
                                <CountryNameEditor locked={locked} name={country.name} onSave={newName => { const uc = [...insightsData.countryData]; uc[index] = { ...uc[index], name: newName }; try { localStorage.setItem("country-names", JSON.stringify(uc.map(c => c.name))) } catch {}; saveData({ ...insightsData, countryData: uc }) }} />
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 relative h-[8px] overflow-hidden" style={{ backgroundColor: BAR_BG, borderRadius: 6 }}>
                                  <div className="absolute left-0 top-0 h-full" style={{ width: `${country.percentage}%`, backgroundColor: PINK, borderRadius: 6 }} />
                                </div>
                                {index === 0 ? (
                                  <GenderPercentEditor value={country.percentage} locked={locked} onSave={(newVal: number) => {
                                    const clamped = Math.max(40, Math.min(100, newVal))
                                    const remaining = 100 - clamped
                                    const otherTotal = insightsData.countryData.slice(1).reduce((s, c) => s + c.percentage, 0) || 1
                                    const updated = insightsData.countryData.map((c, i) => {
                                      if (i === 0) return { ...c, percentage: clamped }
                                      return { ...c, percentage: parseFloat((c.percentage / otherTotal * remaining).toFixed(1)) }
                                    })
                                    saveData({ ...insightsData, countryData: updated })
                                  }} />
                                ) : (
                                  <span className="text-[13px] text-white font-semibold w-[46px] text-right shrink-0">{country.percentage.toFixed(1)}%</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                      {audienceTab === "Gender" && (
                        <motion.div key="gender" variants={tabContent} initial="initial" animate="animate" exit="exit">
                          <div className="mb-3.5">
                            <div className="mb-1 text-[13px] text-white">Men</div>
                            <div className="flex items-center gap-3">
                              <AnimatedBar percentage={insightsData.genderData.men} color={PINK} animateCharts={animateCharts} delay={0} />
                              <GenderPercentEditor value={insightsData.genderData.men} locked={locked} onSave={saveGender} />
                            </div>
                          </div>
                          <div className="mb-3.5">
                            <div className="mb-1 text-[13px] text-white">Women</div>
                            <div className="flex items-center gap-3">
                              <AnimatedBar percentage={insightsData.genderData.women} color={PURPLE} animateCharts={animateCharts} delay={120} />
                              <span className="text-[13px] text-white font-semibold w-[46px] text-right shrink-0">{insightsData.genderData.women.toFixed(1)}%</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                </motion.div>
              )}

            </AnimatePresence>
          </main>

          <InsightEditorModal open={editorOpen} onOpenChange={setEditorOpen} data={insightsData} onSave={handleEditorSave} />
                        <BottomSheet 
            open={bottomSheetOpen} 
            onClose={() => setBottomSheetOpen(false)} 
            onOpenEditor={() => setEditorOpen(true)} 
            locked={locked} 
            onToggleLock={toggleLock}
            graphData={graphData}
            onUpdateGraph={setGraphData}
            yAxisTop={getViewsAxisTop(insightsData.views)}
            sourcesMode={sourcesMode}
            onToggleSources={() => {
              const next = sourcesMode === "all" ? "three" : "all"
              setSourcesMode(next)
              try { localStorage.setItem("sources-mode", next) } catch {}

              if (next === "three") {
                const reels = parseFloat((75 + Math.random() * 10).toFixed(1))
                const profile = parseFloat((Math.random() * 3).toFixed(1))
                const explore = parseFloat((100 - reels - profile).toFixed(1))

                saveData({
                  ...insightsData,
                  sourcesData: [
                    { name: "Reels tab", percentage: reels },
                    { name: "Explore", percentage: Math.max(0, explore) },
                    { name: "Profile", percentage: Math.max(0, profile) }
                  ]
                })
              } else {
                const reels = parseFloat((75 + Math.random() * 10).toFixed(1))
                const explore = parseFloat((5 + Math.random() * 10).toFixed(1))
                const rem = parseFloat((100 - reels - explore).toFixed(1))
                const stories = parseFloat((rem * 0.55).toFixed(1))
                const prof = parseFloat((rem * 0.28).toFixed(1))
                const feed = parseFloat((rem - stories - prof).toFixed(1))

                saveData({
                  ...insightsData,
                  sourcesData: [
                    { name: "Reels tab", percentage: reels },
                    { name: "Explore", percentage: explore },
                    { name: "Stories", percentage: stories },
                    { name: "Profile", percentage: prof },
                    { name: "Feed", percentage: Math.max(0, feed) }
                  ]
                })
              }
            }}
          />
        </div>
      </div>
    </>
  )
}
