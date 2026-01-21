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

      // Extract title and description
      const title = place.title || 'My City Kolkata';
      const description = place.description || 'Discover this amazing place in Kolkata!';

      // If desktop, show a nice preview page
      if (!isMobile) {
        return ctx.send(generatePreviewPage(title, description));
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
    <meta property="og:description" content="${description?.substring(0, 200) || 'Discover Kolkata with My City Kolkata'}">
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
            width: 100px;
            height: 100px;
            margin: 0 auto 20px;
            animation: pulse 2s infinite;
            border-radius: 50%;
            object-fit: contain;
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
        <img src="/logo.png" alt="My City Kolkata" class="logo">
        <h1>Opening ${title}</h1>
        <p>Redirecting you to My City Kolkata app...</p>
        <div class="loader"></div>
        <a href="${isAndroid ? playStoreUrl : appStoreUrl}" class="button" id="fallback">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
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
function generatePreviewPage(title, description) {
  // Truncate description if too long
  const shortDescription = description.length > 300 ? description.substring(0, 300) + '...' : description;
  
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: linear-gradient(135deg, #0e0c28 0%, #302d74 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .header h2 {
            font-size: 42px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .header p {
            font-size: 18px;
            opacity: 0.9;
        }
        .container {
            max-width: 900px;
            margin: 60px auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            flex: 1;
        }
        .content {
            padding: 60px 50px;
            text-align: center;
        }
        .icon-wrapper {
            width: 120px;
            height: 120px;
            margin: 0 auto 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            animation: float 3s ease-in-out infinite;
            padding: 20px;
        }
        .icon-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        h1 {
            font-size: 42px;
            margin-bottom: 25px;
            color: #0e0c28;
            font-weight: 700;
            line-height: 1.2;
        }
        .description {
            font-size: 18px;
            line-height: 1.8;
            color: #555;
            margin-bottom: 50px;
            text-align: left;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
        }
        .download-wrapper {
            margin: 50px 0;
        }
        .download {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 20px 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 18px;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .download::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
        }
        .download:hover::before {
            left: 100%;
        }
        .download:hover {
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
        }
        .download:active {
            transform: translateY(-2px) scale(1.02);
        }
        .download-icon {
            font-size: 24px;
        }
        .info-box {
            margin-top: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 15px;
            border-left: 5px solid #667eea;
        }
        .info-box p {
            font-size: 16px;
            color: #555;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .info-box strong {
            color: #0e0c28;
            font-size: 18px;
        }
        .info-box svg {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
        }
        .info-box .subtext {
            font-size: 14px;
            color: #888;
            margin-top: 10px;
        }
        @media (max-width: 768px) {
            .content {
                padding: 40px 30px;
            }
            h1 {
                font-size: 32px;
            }
            .description {
                font-size: 16px;
            }
            .download {
                padding: 18px 40px;
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="/logo.png" alt="My City Kolkata" class="header-logo">
        <h2>My City Kolkata</h2>
        <p>Explore the City of Joy</p>
    </div>
    <div class="container">
        <div class="content">
            <div class="icon-wrapper">
                <img src="/logo.png" alt="My City Kolkata">
            </div>
            <h1>${title}</h1>
            <div class="description">
                ${shortDescription}
            </div>
            <div class="download-wrapper">
                <a href="https://play.google.com/store/apps/details?id=com.sujoyhens.mycitykolkata" class="download">
                    <svg class="download-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download My City Kolkata App</span>
                </a>
            </div>
            <div class="info-box">
                <p>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <strong>Scan with your phone to open in app</strong>
                </p>
                <p class="subtext">Get the My City Kolkata app to explore more amazing places like this in the City of Joy</p>
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
        .category-logo {
            width: 100px;
            height: 100px;
            margin: 0 auto 20px;
            border-radius: 50%;
            object-fit: contain;
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
            display: inline-flex;
            align-items: center;
            gap: 8px;
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
        .download svg {
            width: 20px;
            height: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="/logo.png" alt="My City Kolkata" class="category-logo">
        <h1>Explore ${categoryName}</h1>
        <p>Download My City Kolkata to discover amazing places in the City of Joy</p>
        <a href="https://play.google.com/store/apps/details?id=com.sujoyhens.mycitykolkata" class="download">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download App
        </a>
    </div>
</body>
</html>
  `;
}
