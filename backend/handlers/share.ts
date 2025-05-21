import express from "express"

const router = express.Router()

// Simple helper to remove quotes
function removeQuotes(str?: string): string {
  return str ? str.replace(/^"(.*)"$/, "$1") : ""
}

// HTML templates
function errorTemplate(title: string, message: string): string {
  return `
    <html>
      <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #1e1e1e; color: white; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .error { color: #ff4444; margin: 20px 0; }
          .app-link { display: inline-block; background-color: #f3631a; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          <p class="error">${message}</p>
          <a href="packtrack://" class="app-link">Open PackTrack App</a>
        </div>
      </body>
    </html>
  `
}

function routeTemplate(
  name: string,
  description: string,
  distance: string,
  start: string,
  end: string,
  shareCode: string,
): string {
  return `
    <html>
      <head>
        <title>${name} - PackTrack</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #1e1e1e; color: white; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .route-card { background-color: #2a2a2a; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left; }
          .route-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .route-detail { margin: 5px 0; color: #ddd; }
          .app-link { display: inline-block; background-color: #f3631a; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; }
          .store-links { display: flex; justify-content: center; gap: 20px; margin-top: 30px; }
          .store-link { display: inline-block; background-color: #333; color: white; padding: 10px 20px; 
                        text-decoration: none; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Shared Route</h1>
          <div class="route-card">
            <div class="route-name">${name}</div>
            <div class="route-detail"><strong>Description:</strong> ${description}</div>
            <div class="route-detail"><strong>Distance:</strong> ${distance}</div>
            <div class="route-detail"><strong>Start:</strong> ${start}</div>
            <div class="route-detail"><strong>End:</strong> ${end}</div>
          </div>
          <p>View this route in the PackTrack app</p>
          <a href="packtrack://routes/shared/${shareCode}" class="app-link">Open in App</a>
          <div class="store-links">
            <a href="https://apps.apple.com/app/packtrack" class="store-link">App Store</a>
            <a href="https://play.google.com/store/apps/details?id=com.packtrack" class="store-link">Google Play</a>
          </div>
        </div>
      </body>
    </html>
  `
}

function packTemplate(
  name: string,
  description: string,
  memberCount: number,
  owner: string,
  shareCode: string,
): string {
  return `
    <html>
      <head>
        <title>${name} - PackTrack</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #1e1e1e; color: white; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .pack-card { background-color: #2a2a2a; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left; }
          .pack-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .pack-detail { margin: 5px 0; color: #ddd; }
          .app-link { display: inline-block; background-color: #f3631a; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; }
          .store-links { display: flex; justify-content: center; gap: 20px; margin-top: 30px; }
          .store-link { display: inline-block; background-color: #333; color: white; padding: 10px 20px; 
                        text-decoration: none; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Shared Pack</h1>
          <div class="pack-card">
            <div class="pack-name">${name}</div>
            <div class="pack-detail"><strong>Description:</strong> ${description}</div>
            <div class="pack-detail"><strong>Members:</strong> ${memberCount}</div>
            <div class="pack-detail"><strong>Owner:</strong> ${owner}</div>
          </div>
          <p>View this pack in the PackTrack app</p>
          <a href="packtrack://packs/shared/${shareCode}" class="app-link">Open in App</a>
          <div class="store-links">
            <a href="https://apps.apple.com/app/packtrack" class="store-link">App Store</a>
            <a href="https://play.google.com/store/apps/details?id=com.packtrack" class="store-link">Google Play</a>
          </div>
        </div>
      </body>
    </html>
  `
}

// Share handler route
router.get("/", (req, res) => {
  const type = req.query.type as string | undefined
  const shareCode = req.query.shareCode as string | undefined
  const ref = req.query.ref as string | undefined

  if (!type || !shareCode) {
    res.status(400).send(errorTemplate("Missing Parameters", "Share type and code are required"))
    return
  }

  // Basic response for now - implement the actual sharing logic
  if (type === "route") {
    // Find route by share code and return route template
    // This is a placeholder - implement the actual database query
    res.send(
      routeTemplate(
        "Sample Route",
        "This is a sample route description",
        "5.2 miles",
        "Starting Point",
        "Ending Point",
        shareCode,
      ),
    )
  } else if (type === "pack") {
    // Find pack by share code and return pack template
    // This is a placeholder - implement the actual database query
    res.send(packTemplate("Sample Pack", "This is a sample pack description", 5, "John Doe", shareCode))
  } else {
    res.status(400).send(errorTemplate("Invalid Type", "Share type must be 'route' or 'pack'"))
  }
})

export default router
