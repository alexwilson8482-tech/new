import { useState, useEffect } from "react"
import { InsightsData, DEFAULT_INSIGHTS_DATA } from "@/lib/insights-state"

const STORAGE_KEY = "instagram-reel-insights"

export function useInsightsStorage() {
  const [data, setData] = useState<InsightsData>(DEFAULT_INSIGHTS_DATA)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setData({ ...DEFAULT_INSIGHTS_DATA, ...parsed })
      } else {
        setData(DEFAULT_INSIGHTS_DATA)
      }
    } catch (error) {
      console.error("[v0] Failed to load insights data from storage:", error)
      setData(DEFAULT_INSIGHTS_DATA)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage whenever data changes
  const saveData = (newData: InsightsData) => {
    setData(newData)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
    } catch (error) {
      console.error("[v0] Failed to save insights data to storage:", error)
    }
  }

  // Reset to defaults
  const resetData = () => {
    setData(DEFAULT_INSIGHTS_DATA)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INSIGHTS_DATA))
  }

  return {
    data,
    saveData,
    resetData,
    isLoaded,
  }
}
