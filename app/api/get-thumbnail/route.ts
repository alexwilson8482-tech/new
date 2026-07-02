export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const reelUrl = searchParams.get("url")

  if (!reelUrl) {
    return Response.json({ error: "No URL" }, { status: 400 })
  }

  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(reelUrl)}`

    const res = await fetch(proxyUrl)
    const html = await res.text()

    const match = html.match(
      /<meta property="og:image" content="([^"]+)"/
    )

    const thumbnail = match ? match[1] : null

    return Response.json({ thumbnail })

  } catch (err) {
    return Response.json({ error: "Failed" }, { status: 500 })
  }
}
