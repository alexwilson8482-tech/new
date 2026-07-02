// Type definitions for insights data
export interface ViewsTimeDataPoint {
  date: string
  thisReel: number
  typical: number
}

export interface RetentionDataPoint {
  time: string
  retention: number
}

export interface CountryDataPoint {
  name: string
  percentage: number
}

export interface AgeDataPoint {
  name: string
  percentage: number
}

export interface SourceDataPoint {
  name: string
  percentage: number
}

export interface InsightsData {
  caption: string
  videoDuration: string
  publishDate: string
  likes: number
  comments: number
  shares: number
  reposts: number
  bookmarks: number
  views: number
  followerPercentage: number
  genderData: {
    men: number
    women: number
  }
  countryData: CountryDataPoint[]
  ageData: AgeDataPoint[]
  viewsTimeData: ViewsTimeDataPoint[]
  retentionData: RetentionDataPoint[]
  skipRateThis: number
  skipRateTypical: number
  watchTime: string
  avgWatchTime: string
  sourcesData: SourceDataPoint[]
  accountsReached: number
}

// Random number between min and max
const rand = (min: number, max: number, decimals = 1) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals))

// Random country percentages - US > UK > Canada > Australia > Germany > Others
const randomCountryData = (): CountryDataPoint[] => {
  const us = rand(35, 45)
  const uk = rand(20, 28)
  const ca = rand(12, 18)
  const au = rand(8, 13)
  const de = rand(4, 7)
  const others = parseFloat((100 - us - uk - ca - au - de).toFixed(1))
  return [
    { name: "United States", percentage: us },
    { name: "United Kingdom", percentage: uk },
    { name: "Canada", percentage: ca },
    { name: "Australia", percentage: au },
    { name: "Germany", percentage: de },
    { name: "Others", percentage: Math.max(0, others) },
  ]
}

// Random age data - 18-24 and 25-34 should be highest
const randomAgeData = (): AgeDataPoint[] => {
  const a1824 = rand(35, 48)
  const a2534 = rand(30, 42)
  const a3544 = rand(5, 10)
  const a4554 = rand(1, 4)
  const a5564 = rand(0.3, 1.5)
  const a65 = rand(0.2, 1)
  const a1317 = parseFloat((100 - a1824 - a2534 - a3544 - a4554 - a5564 - a65).toFixed(1))
  return [
    { name: "13-17", percentage: Math.max(0, a1317) },
    { name: "18-24", percentage: a1824 },
    { name: "25-34", percentage: a2534 },
    { name: "35-44", percentage: a3544 },
    { name: "45-54", percentage: a4554 },
    { name: "55-64", percentage: a5564 },
    { name: "65+", percentage: a65 },
  ]
}

// Random sources - reels tab (75-85%), explore (10-15%), rest distributed
const randomSourcesData = (): SourceDataPoint[] => {
  const reels = rand(75, 85)
  const explore = rand(10, 15)
  const remaining = parseFloat((100 - reels - explore).toFixed(1))
  const stories = parseFloat((remaining * 0.55).toFixed(1))
  const profile = parseFloat((remaining * 0.28).toFixed(1))
  const feed = parseFloat((remaining - stories - profile).toFixed(1))
  return [
    { name: "Reels tab", percentage: reels },
    { name: "Explore", percentage: explore },
    { name: "Stories", percentage: stories },
    { name: "Profile", percentage: profile },
    { name: "Feed", percentage: Math.max(0, feed) },
  ]
}

// Default insights data
export const DEFAULT_INSIGHTS_DATA: InsightsData = {
  caption: "The ultimate cheat code for couples.",
  videoDuration: "0:31",
  publishDate: "28 January",

  likes: 22,
  comments: 1,
  shares: 22,
  reposts: 0,
  bookmarks: 1,
  views: 481,

  followerPercentage: 7.2,

  genderData: {
    men: 28.5,
    women: 71.5,
  },

  countryData: [
    { name: "United States", percentage: 38.4 },
    { name: "United Kingdom", percentage: 23.1 },
    { name: "Canada", percentage: 14.7 },
    { name: "Australia", percentage: 10.2 },
    { name: "Germany", percentage: 5.8 },
    { name: "Others", percentage: 7.8 },
  ],

  ageData: [
    { name: "13-17", percentage: 4.2 },
    { name: "18-24", percentage: 41.3 },
    { name: "25-34", percentage: 35.6 },
    { name: "35-44", percentage: 11.2 },
    { name: "45-54", percentage: 4.8 },
    { name: "55-64", percentage: 1.8 },
    { name: "65+", percentage: 1.1 },
  ],

  viewsTimeData: [
    { date: "28 Jan", thisReel: 100, typical: 60 },
    { date: "29 Jan", thisReel: 300, typical: 80 },
    { date: "30 Jan", thisReel: 481, typical: 110 },
  ],

  retentionData: [
    { time: "0:00", retention: 100 },
    { time: "0:01", retention: 85 },
    { time: "0:02", retention: 65 },
    { time: "0:03", retention: 55 },
    { time: "0:04", retention: 45 },
    { time: "0:05", retention: 38 },
    { time: "0:06", retention: 32 },
    { time: "0:07", retention: 28 },
    { time: "0:08", retention: 25 },
  ],

  skipRateThis: 14.3,
  skipRateTypical: 24.7,
  watchTime: "2h 48m 21s",
  avgWatchTime: "21s",

  sourcesData: [
    { name: "Reels tab", percentage: 79.2 },
    { name: "Explore", percentage: 12.4 },
    { name: "Stories", percentage: 4.6 },
    { name: "Profile", percentage: 2.3 },
    { name: "Feed", percentage: 1.5 },
  ],

  accountsReached: 2118,
}

// Utility function to parse duration string
export const parseDuration = (durationStr: string): number => {
  const parts = durationStr.split(":").map(Number)
  let seconds = 0
  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1]
  }
  return seconds
}

// Utility function to format seconds to duration string
export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// Generate realistic retention data based on video duration
export const generateRetentionData = (durationStr: string): RetentionDataPoint[] => {
  const totalSeconds = parseDuration(durationStr)
  const dataPoints = Math.min(Math.ceil(totalSeconds / 1), 20)
  const retentionData: RetentionDataPoint[] = []
  for (let i = 0; i <= dataPoints; i++) {
    const timeSeconds = (i / dataPoints) * totalSeconds
    const minutes = Math.floor(timeSeconds / 60)
    const seconds = Math.floor(timeSeconds % 60)
    const retention = Math.max(20, 100 * Math.exp(-0.5 * (i / dataPoints)))
    retentionData.push({
      time: `${minutes}:${seconds.toString().padStart(2, "0")}`,
      retention: Math.round(retention),
    })
  }
  return retentionData
}

// Calculate watch time from views and average watch time
export const calculateWatchTime = (views: number, avgWatchTimeStr: string): string => {
  if (!avgWatchTimeStr || views === 0) return "0h 0m 0s"
  let avgSeconds = 0
  const str = avgWatchTimeStr.trim().toLowerCase()
  if (str.includes('h')) {
    const parts = str.match(/(\d+)h\s*(\d+)m\s*(\d+)s/)
    if (parts) avgSeconds = parseInt(parts[1]) * 3600 + parseInt(parts[2]) * 60 + parseInt(parts[3])
  } else if (str.includes('m')) {
    const parts = str.match(/(\d+)m\s*(\d+)s/)
    if (parts) avgSeconds = parseInt(parts[1]) * 60 + parseInt(parts[2])
  } else if (str.includes('s')) {
    const num = str.match(/(\d+)/)
    if (num) avgSeconds = parseInt(num[1])
  } else if (str.includes(':')) {
    avgSeconds = parseDuration(str)
  } else {
    const num = parseInt(str)
    if (!isNaN(num)) avgSeconds = num
  }
  if (avgSeconds === 0) return "0h 0m 0s"
  const totalSeconds = views * avgSeconds
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.round(totalSeconds % 60)
  return `${hours}h ${minutes}m ${seconds}s`
}

// Ensure percentages sum to 100
export const normalizePercentages = (
  data: Array<{ percentage: number }>
): Array<{ percentage: number }> => {
  const total = data.reduce((sum, item) => sum + item.percentage, 0)
  if (total === 0) return data
  return data.map((item) => ({
    ...item,
    percentage: (item.percentage / total) * 100,
  }))
}

// Calculate total interactions
export const calculateInteractions = (data: Partial<InsightsData>): number => {
  return (data.likes || 0) + (data.comments || 0) + (data.shares || 0) +
    (data.reposts || 0) + (data.bookmarks || 0)
}
