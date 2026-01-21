'use strict';

/**
 * Deep Link Controller
 * Handles incoming deep links and redirects appropriately
 */

module.exports = {
  /**
   * Redirect to place (handles /place/:id)
   */
  async redirectPlace(ctx) {
    const { id } = ctx.params;
    const userAgent = ctx.request.header['user-agent'] || '';
    
    console.log(`Deep link request for place ID: ${id}`);
    console.log(`User agent: ${userAgent}`);

    // Detect device type
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isMobile = isAndroid || isIOS;

    try {
      // Fetch the place data from mycitykolkata content type
      // @ts-ignore - strapi global is available in Strapi controllers
      const place = await strapi.entityService.findOne('api::mycitykolkata.mycitykolkata', id, {
        populate: '*',
      });

      if (!place) {
        return ctx.notFound('Place not found');
      }

      // Extract title, description, and image
      const title = place.title || 'My City Kolkata';
      const description = place.description || 'Discover this amazing place in Kolkata!';
      const imageUrl = place.images?.[0]?.url || '';

      // If desktop, show a nice preview page
      if (!isMobile) {
        return ctx.send(generatePreviewPage(title, description, imageUrl));
      }

      // For mobile devices, try to open the app
      const appScheme = `mycitykolkata://place/${id}`;
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.sujoyhens.mycitykolkata';
      const appStoreUrl = 'https://apps.apple.com/app/YOUR_APP_ID'; // Update with your iOS app ID

      // Generate HTML with smart redirect logic
      const redirectHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - My City Kolkata</title>
    
    <!-- Open Graph Meta Tags for social sharing -->
    <meta property="og:title" content="${title} - My City Kolkata">
    <meta property="og:description" content="${description.substring(0, 200)}">
    ${imageUrl ? `<meta property="og:image" content="${imageUrl}">` : ''}
    <meta property="og:type" content="website">
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0e0c28 0%, #302d74 100%);
            color: white;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 500px;
        }
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        p {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 30px;
        }
        .loader {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .button {
            display: inline-block;
            margin-top: 20px;
            padding: 15px 30px;
            background: white;
            color: #0e0c28;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🏛️</div>
        <h1>Opening ${title}</h1>
        <p>Redirecting you to My City Kolkata app...</p>
        <div class="loader"></div>
        <a href="${isAndroid ? playStoreUrl : appStoreUrl}" class="button" id="fallback">
            Open in Store
        </a>
    </div>
    
    <script>
        // Try to open the app
        window.location = '${appScheme}';
        
        // If app doesn't open in 2.5 seconds, redirect to store
        setTimeout(function() {
            ${isAndroid 
              ? `window.location = '${playStoreUrl}';` 
              : `window.location = '${appStoreUrl}';`
            }
        }, 2500);
        
        // Show fallback button after 3 seconds
        setTimeout(function() {
            document.getElementById('fallback').style.display = 'inline-block';
        }, 3000);
    </script>
</body>
</html>
      `;

      ctx.type = 'text/html';
      return ctx.send(redirectHtml);

    } catch (error) {
      console.error('Error handling place redirect:', error);
      return ctx.internalServerError('Error processing request');
    }
  },

  /**
   * Redirect to category (handles /category/:name)
   */
  async redirectCategory(ctx) {
    const { name } = ctx.params;
    const userAgent = ctx.request.header['user-agent'] || '';
    
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isMobile = isAndroid || isIOS;

    console.log(`Deep link request for category: ${name}`);

    // For mobile, redirect to app
    if (isMobile) {
      const appScheme = `mycitykolkata://category/${encodeURIComponent(name)}`;
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.sujoyhens.mycitykolkata';
      const appStoreUrl = 'https://apps.apple.com/app/YOUR_APP_ID';

      const redirectHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - My City Kolkata</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0e0c28 0%, #302d74 100%);
            color: white;
            text-align: center;
            padding: 20px;
        }
        h1 { font-size: 24px; margin-bottom: 20px; }
        .loader {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div>
        <h1>Opening ${name}</h1>
        <div class="loader"></div>
    </div>
    <script>
        window.location = '${appScheme}';
        setTimeout(function() {
            window.location = '${isAndroid ? playStoreUrl : appStoreUrl}';
        }, 2500);
    </script>
</body>
</html>
      `;

      ctx.type = 'text/html';
      return ctx.send(redirectHtml);
    }

    // For desktop, show simple message
    return ctx.send(generateCategoryPreviewPage(name));
  },
};

/**
 * Generate preview page for desktop users
 */
function generatePreviewPage(title, description, imageUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - My City Kolkata</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #0e0c28 0%, #302d74 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .container {
            max-width: 800px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .image {
            width: 100%;
            height: 400px;
            object-fit: cover;
        }
        .content {
            padding: 40px;
        }
        h1 {
            font-size: 32px;
            margin-bottom: 20px;
            color: #0e0c28;
        }
        p {
            font-size: 16px;
            line-height: 1.6;
            color: #666;
            margin-bottom: 30px;
        }
        .download {
            display: inline-block;
            padding: 15px 30px;
            background: #0e0c28;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            transition: transform 0.2s;
        }
        .download:hover {
            transform: translateY(-2px);
        }
        .qr {
            margin-top: 30px;
            text-align: center;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🏛️ My City Kolkata</h2>
        <p>Explore the City of Joy</p>
    </div>
    <div class="container">
        ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="image">` : ''}
        <div class="content">
            <h1>${title}</h1>
            <p>${description}</p>
            <a href="https://play.google.com/store/apps/details?id=com.sujoyhens.mycitykolkata" class="download">
                Download My City Kolkata App
            </a>
            <div class="qr">
                <p><strong>Scan with your phone to open in app</strong></p>
                <p style="font-size: 14px; color: #999; margin-top: 10px;">
                    Get the My City Kolkata app to explore more places like this
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Generate preview page for category on desktop
 */
function generateCategoryPreviewPage(categoryName) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${categoryName} - My City Kolkata</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0e0c28 0%, #302d74 100%);
            color: white;
            text-align: center;
            padding: 20px;
        }
        .container {
            max-width: 500px;
        }
        h1 {
            font-size: 36px;
            margin-bottom: 20px;
        }
        p {
            font-size: 18px;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        .download {
            display: inline-block;
            padding: 15px 40px;
            background: white;
            color: #0e0c28;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.2s;
        }
        .download:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏛️</h1>
        <h1>Explore ${categoryName}</h1>
        <p>Download My City Kolkata to discover amazing places in the City of Joy</p>
        <a href="https://play.google.com/store/apps/details?id=com.sujoyhens.mycitykolkata" class="download">
            Download App
        </a>
    </div>
</body>
</html>
  `;
}
