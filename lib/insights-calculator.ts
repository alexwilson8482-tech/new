import { InsightsData, ViewsTimeDataPoint, parseDuration } from "./insights-state"

// Generate views over time data based on total views and duration
export const generateViewsTimeData = (
  totalViews: number,
  _videoDuration: string
): ViewsTimeDataPoint[] => {
  // Create a realistic views over time curve
  const dataPoints = 6
  const data: ViewsTimeDataPoint[] = []
  
  // Typically views peak in first 2-3 days then plateau
  const peakRatio = 0.85 // Peak reaches 85% of final views
  const plateauRatio = 1.0 // Final plateau
  
  for (let i = 0; i < dataPoints; i++) {
    const progress = i / (dataPoints - 1)
    let thisReelViews: number
    
    if (progress < 0.4) {
      // Rapid growth phase (first 40% of time)
      thisReelViews = Math.round(totalViews * peakRatio * (progress / 0.4))
    } else {
      // Plateau phase
      thisReelViews = Math.round(totalViews * peakRatio)
    }
    
    // Typical reel views (baseline)
    const typicalViews = Math.round(totalViews / 0.3) * (0.3 + progress * 0.2)
    
    const dates = ["12 Jan", "15 Jan", "18 Jan", "23 Jan", "28 Jan", "2 Feb"]
    
    data.push({
      date: dates[i],
      thisReel: thisReelViews,
      typical: Math.round(typicalViews),
    })
  }
  
  return data
}

// Calculate follower percentage breakdown for views
export const calculateViewBreakdown = (
  totalViews: number,
  followerPercentage: number
): { followers: number; nonFollowers: number } => {
  const followers = Math.round((followerPercentage / 100) * totalViews)
  const nonFollowers = totalViews - followers
  
  return { followers, nonFollowers }
}

// Generate realistic retention curve based on typical patterns
export const generateRetentionCurve = (
  _skipRate: number
): Array<{ retention: number }> => {
  // Typical retention curve starts at 100 and decays
  const points: Array<{ retention: number }> = []
  const segments = 10
  
  for (let i = 0; i <= segments; i++) {
    const progress = i / segments
    // Exponential decay: more aggressive drop at beginning
    const retention = 100 * Math.exp(-0.7 * progress)
    points.push({ retention: Math.round(retention) })
  }
  
  return points
}

// Calculate average watch time from retention data
export const calculateAvgWatchTime = (
  retentionData: Array<{ time: string; retention: number }>,
  videoDuration: string
): string => {
  const totalSeconds = parseDuration(videoDuration)
  
  // Calculate average time watched based on retention curve
  let totalWatchSeconds = 0
  let count = 0
  
  retentionData.forEach((point, index) => {
    const timeSeconds = parseDuration(point.time)
    const retention = point.retention / 100
    totalWatchSeconds += timeSeconds * retention
    count++
  })
  
  const avgSeconds = Math.round(totalWatchSeconds / count)
  const minutes = Math.floor(avgSeconds / 60)
  const seconds = avgSeconds % 60
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

// Update retention data based on new video duration
export const updateRetentionForDuration = (
  oldDuration: string,
  newDuration: string,
  oldRetentionData: Array<{ time: string; retention: number }>
): Array<{ time: string; retention: number }> => {
  const oldTotalSeconds = parseDuration(oldDuration)
  const newTotalSeconds = parseDuration(newDuration)
  
  if (oldTotalSeconds === 0) return oldRetentionData
  
  const ratio = newTotalSeconds / oldTotalSeconds
  const newRetentionData: Array<{ time: string; retention: number }> = []
  
  // Generate new timepoints for the new duration
  const numPoints = Math.ceil(newTotalSeconds / 1)
  
  for (let i = 0; i <= Math.min(numPoints, 20); i++) {
    const timeSeconds = (i / Math.min(numPoints, 20)) * newTotalSeconds
    const minutes = Math.floor(timeSeconds / 60)
    const seconds = Math.floor(timeSeconds % 60)
    
    // Interpolate retention value from old data
    const normalizedProgress = i / Math.min(numPoints, 20)
    const oldIndex = Math.round(normalizedProgress * (oldRetentionData.length - 1))
    const retention = oldRetentionData[oldIndex]?.retention || 20
    
    newRetentionData.push({
      time: `${minutes}:${seconds.toString().padStart(2, "0")}`,
      retention: Math.round(retention),
    })
  }
  
  return newRetentionData
}

// Recalculate all dependent metrics when a base metric changes
export const recalculateMetrics = (
  data: InsightsData,
  changes: Partial<InsightsData>
): Partial<InsightsData> => {
  const updated = { ...changes }
  
  // If views changed, update views over time
  if (changes.views !== undefined) {
    updated.viewsTimeData = generateViewsTimeData(
      changes.views,
      data.videoDuration
    )
  }
  
  // If video duration changed, update retention data
  if (changes.videoDuration !== undefined) {
    updated.retentionData = updateRetentionForDuration(
      data.videoDuration,
      changes.videoDuration,
      data.retentionData
    )
  }
  
  // If retention data or video duration changed, update avg watch time
  if (
    changes.retentionData !== undefined ||
    changes.videoDuration !== undefined
  ) {
    const retentionData = changes.retentionData || data.retentionData
    const videoDuration = changes.videoDuration || data.videoDuration
    updated.avgWatchTime = calculateAvgWatchTime(retentionData, videoDuration)
  }
  
  return updated
}

// Validate that percentages sum to 100
export const validatePercentages = (
  data: Array<{ percentage: number }>
): boolean => {
  const total = data.reduce((sum, item) => sum + item.percentage, 0)
  return Math.abs(total - 100) < 0.01 // Allow for floating point errors
}

// Normalize percentages to sum to 100
export const normalizePercentageArray = (
  data: Array<{ percentage: number }>
): Array<{ percentage: number }> => {
  const total = data.reduce((sum, item) => sum + item.percentage, 0)
  if (total === 0) return data
  
  return data.map((item) => ({
    ...item,
    percentage: (item.percentage / total) * 100,
  }))
}
