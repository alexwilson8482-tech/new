"use client"

import React, { useState } from "react"
import { InsightsData, normalizePercentages, calculateWatchTime } from "@/lib/insights-state"
import { recalculateMetrics } from "@/lib/insights-calculator"

interface InsightEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: InsightsData
  onSave: (updatedData: InsightsData) => void
}

export function InsightEditorModal({
  open,
  onOpenChange,
  data,
  onSave,
}: InsightEditorModalProps) {
  const [formData, setFormData] = useState<InsightsData>(data)
  const [activeTab, setActiveTab] = useState("basic")

  React.useEffect(() => {
    setFormData(data)
  }, [data, open])

  const handleBasicChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleEngagementChange = (field: string, value: any) => {
    const updatedData = { ...formData, [field]: value }
    const changes = recalculateMetrics(data, updatedData)
    setFormData((prev) => ({ ...prev, ...changes }))
  }

  const handleSave = () => {
    const calculatedWatchTime = calculateWatchTime(formData.views, formData.avgWatchTime)
    const finalData = { ...formData, watchTime: calculatedWatchTime }
    onSave(finalData)
    onOpenChange(false)
  }

  const handleReset = () => setFormData(data)

  if (!open) return null

  const tabs = [
    { id: "basic", label: "Basic" },
    { id: "engagement", label: "Engagement" },
    { id: "viewership", label: "Viewership" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative w-full sm:max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]">

        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-[16px] font-semibold text-white">Edit Reel Insights</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 px-4 py-3 overflow-x-auto shrink-0 border-b border-zinc-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-fuchsia-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {activeTab === "basic" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-zinc-300">Caption</label>
                <textarea
                  value={formData.caption}
                  onChange={(e) => handleBasicChange("caption", e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-fuchsia-500 transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-zinc-300">Duration (MM:SS)</label>
                  <input
                    type="text"
                    value={formData.videoDuration}
                    onChange={(e) => handleEngagementChange("videoDuration", e.target.value)}
                    placeholder="0:31"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-fuchsia-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-zinc-300">Publish Date</label>
                  <input
                    type="text"
                    value={formData.publishDate}
                    onChange={(e) => handleBasicChange("publishDate", e.target.value)}
                    placeholder="28 January"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-fuchsia-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "engagement" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-zinc-300">Total Views</label>
                <input
                  type="number"
                  value={formData.views}
                  onChange={(e) => handleEngagementChange("views", parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-fuchsia-500 transition-colors"
                />
              </div>

              <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-zinc-300">Total Interactions</span>
                  <span className="text-[15px] font-bold text-fuchsia-400">
                    {formData.likes + formData.comments + formData.shares + formData.reposts + formData.bookmarks}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "likes", label: "Likes", val: formData.likes },
                    { id: "comments", label: "Comments", val: formData.comments },
                    { id: "shares", label: "Shares", val: formData.shares },
                    { id: "reposts", label: "Reposts", val: formData.reposts },
                    { id: "bookmarks", label: "Bookmarks", val: formData.bookmarks },
                  ].map((item) => (
                    <div key={item.id} className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">{item.label}</label>
                      <input
                        type="number"
                        value={item.val}
                        onChange={(e) => handleEngagementChange(item.id, parseInt(e.target.value) || 0)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-[13px] text-white outline-none focus:border-fuchsia-500 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "viewership" && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-3">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-zinc-300">Avg Watch Time Per View</label>
                  <input
                    type="text"
                    value={formData.avgWatchTime}
                    onChange={(e) => handleBasicChange("avgWatchTime", e.target.value)}
                    placeholder="21s"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-fuchsia-500 transition-colors"
                  />
                  <p className="text-[11px] text-zinc-500">Format: MM:SS or Ss (e.g., 0:21 or 21s)</p>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-950 rounded-lg border border-zinc-700">
                  <div>
                    <p className="text-[11px] text-zinc-500">Total Watch Time (auto)</p>
                    <p className="text-[15px] font-bold text-fuchsia-400 mt-0.5">
                      {calculateWatchTime(formData.views, formData.avgWatchTime)}
                    </p>
                  </div>
                  <span className="text-[11px] text-zinc-600">{formData.views} × {formData.avgWatchTime}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-zinc-300">Accounts Reached</label>
                <input
                  type="number"
                  value={formData.accountsReached}
                  onChange={(e) => handleBasicChange("accountsReached", parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-fuchsia-500 transition-colors"
                />
              </div>
            </div>
          )}

        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-zinc-800 shrink-0">
          <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-[13px] text-zinc-400 hover:bg-zinc-900 transition-colors">Reset</button>
          <button onClick={() => onOpenChange(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-[13px] text-zinc-400 hover:bg-zinc-900 transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-[13px] text-white font-medium transition-colors">Save</button>
        </div>

      </div>
    </div>
  )
}
