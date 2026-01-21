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

      // Get the full deep link URL for QR code
      const deepLinkUrl = `${ctx.request.origin}/place/${id}`;
      const appScheme = `mycitykolkata://place/${id}`;

      // If desktop, show preview with QR code
      if (!isMobile) {
        return ctx.send(generatePreviewPage(title, description, deepLinkUrl, id));
      }

      // For mobile devices, try to open the app
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.sujoyhens.mycitykolkata';
      const appStoreUrl = 'https://apps.apple.com/app/YOUR_APP_ID'; // Update with your iOS app ID

      // Generate HTML with improved redirect logic
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
            background: #f5f5f5;
            color: #333;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 400px;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .logo {
            width: 50px;
            height: 50px;
            margin: 0 auto 15px;
        }
        h1 {
            font-size: 20px;
            margin-bottom: 10px;
            color: #333;
        }
        p {
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
        }
        .loader {
            border: 2px solid #e0e0e0;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 14px;
            transition: background 0.2s;
        }
        .button:hover {
            background: #5568d3;
        }
        #fallback {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Opening ${title}</h1>
        <p>Redirecting to My City Kolkata app...</p>
        <div class="loader"></div>
        <a href="${isAndroid ? playStoreUrl : appStoreUrl}" class="button" id="fallback">
            Open in App Store
        </a>
    </div>
    
    <!-- Hidden iframe for deep link -->
    <iframe id="deeplink-iframe" style="display:none;"></iframe>
    
    <script>
        (function() {
            var appOpened = false;
            
            // Method 1: Try iframe (works better on some browsers)
            var iframe = document.getElementById('deeplink-iframe');
            iframe.src = '${appScheme}';
            
            // Method 2: Try window.location as fallback
            setTimeout(function() {
                if (!appOpened) {
                    window.location.href = '${appScheme}';
                }
            }, 500);
            
            // Detect if user left the page (app opened)
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    appOpened = true;
                }
            });
            
            // If app doesn't open in 2.5 seconds, redirect to store
            setTimeout(function() {
                if (!appOpened) {
                    window.location.href = '${isAndroid ? playStoreUrl : appStoreUrl}';
                }
            }, 2500);
            
            // Show fallback button after 3 seconds
            setTimeout(function() {
                if (!appOpened) {
                    document.getElementById('fallback').style.display = 'inline-block';
                }
            }, 3000);
        })();
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

    // Get the full deep link URL for QR code
    const deepLinkUrl = `${ctx.request.origin}/category/${name}`;

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
            background: #f5f5f5;
            color: #333;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 400px;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
            font-size: 20px; 
            margin-bottom: 10px;
            color: #333;
        }
        p {
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
        }
        .loader {
            border: 2px solid #e0e0e0;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 14px;
            transition: background 0.2s;
        }
        .button:hover {
            background: #5568d3;
        }
        #fallback {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Opening ${name}</h1>
        <p>Redirecting to My City Kolkata app...</p>
        <div class="loader"></div>
        <a href="${isAndroid ? playStoreUrl : appStoreUrl}" class="button" id="fallback">
            Open in App Store
        </a>
    </div>
    
    <!-- Hidden iframe for deep link -->
    <iframe id="deeplink-iframe" style="display:none;"></iframe>
    
    <script>
        (function() {
            var appOpened = false;
            
            // Try iframe first
            var iframe = document.getElementById('deeplink-iframe');
            iframe.src = '${appScheme}';
            
            // Fallback to window.location
            setTimeout(function() {
                if (!appOpened) {
                    window.location.href = '${appScheme}';
                }
            }, 500);
            
            // Detect if app opened
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    appOpened = true;
                }
            });
            
            // Redirect to store if app doesn't open
            setTimeout(function() {
                if (!appOpened) {
                    window.location.href = '${isAndroid ? playStoreUrl : appStoreUrl}';
                }
            }, 2500);
            
            // Show fallback button
            setTimeout(function() {
                if (!appOpened) {
                    document.getElementById('fallback').style.display = 'inline-block';
                }
            }, 3000);
        })();
    </script>
</body>
</html>
      `;

      ctx.type = 'text/html';
      return ctx.send(redirectHtml);
    }

    // For desktop, show preview with QR code
    return ctx.send(generateCategoryPreviewPage(name, deepLinkUrl));
  },
};

/**
 * Generate preview page for desktop users with QR code
 */
function generatePreviewPage(title, description, deepLinkUrl, placeId) {
  // Truncate description if too long
  const shortDescription = description.length > 300 ? description.substring(0, 300) + '...' : description;
  
  // Generate QR code using a free API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(deepLinkUrl)}`;
  
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
            background: #f5f5f5;
            min-height: 100vh;
            padding: 20px;
        }
        .header {
            background: white;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }
        .header-logo {
            width: 40px;
            height: 40px;
        }
        .header h2 {
            font-size: 24px;
            color: #333;
            font-weight: 600;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .content {
            padding: 40px;
        }
        h1 {
            font-size: 32px;
            margin-bottom: 20px;
            color: #333;
            font-weight: 600;
        }
        .description {
            font-size: 16px;
            line-height: 1.6;
            color: #666;
            margin-bottom: 40px;
        }
        .qr-section {
            background: #f9fafb;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }
        .qr-section h3 {
            font-size: 18px;
            color: #333;
            margin-bottom: 15px;
            font-weight: 600;
        }
        .qr-code {
            background: white;
            padding: 20px;
            border-radius: 8px;
            display: inline-block;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .qr-code img {
            display: block;
            width: 200px;
            height: 200px;
        }
        .qr-instructions {
            font-size: 14px;
            color: #666;
            margin-top: 15px;
        }
        .download-section {
            text-align: center;
            padding: 30px;
            background: #f9fafb;
            border-radius: 12px;
        }
        .download-section h3 {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .download {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 14px 28px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 16px;
            transition: background 0.2s;
        }
        .download:hover {
            background: #5568d3;
        }
        .download svg {
            width: 20px;
            height: 20px;
        }
        @media (max-width: 768px) {
            .content {
                padding: 30px 20px;
            }
            h1 {
                font-size: 24px;
            }
            .description {
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="#667eea"/>
                <path d="M20 10L25 15H22V22H18V15H15L20 10Z" fill="white"/>
                <path d="M12 28C12 27.4477 12.4477 27 13 27H27C27.5523 27 28 27.4477 28 28C28 28.5523 27.5523 29 27 29H13C12.4477 29 12 28.5523 12 28Z" fill="white"/>
            </svg>
            <h2>My City Kolkata</h2>
        </div>
    </div>
    <div class="container">
        <div class="content">
            <h1>${title}</h1>
            <div class="description">
                ${shortDescription}
            </div>
            
            <div class="qr-section">
                <h3>📱 Scan to Open in App</h3>
                <div class="qr-code">
                    <img src="${qrCodeUrl}" alt="QR Code to open in app" />
                </div>
                <p class="qr-instructions">
                    Scan this QR code with your phone's camera to open this place in the My City Kolkata app
                </p>
            </div>
            
            <div class="download-section">
                <h3>Don't have the app yet?</h3>
                <a href="https://play.google.com/store/apps/details?id=com.sujoyhens.mycitykolkata" class="download">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download on Google Play</span>
                </a>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Generate preview page for category on desktop with QR code
 */
function generateCategoryPreviewPage(categoryName, deepLinkUrl) {
  // Generate QR code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(deepLinkUrl)}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${categoryName} - My City Kolkata</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
            padding: 20px;
        }
        .header {
            background: white;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }
        .header h2 {
            font-size: 24px;
            color: #333;
            font-weight: 600;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 40px;
            text-align: center;
        }
        h1 {
            font-size: 28px;
            margin-bottom: 15px;
            color: #333;
        }
        .subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
        }
        .qr-section {
            background: #f9fafb;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
        }
        .qr-section h3 {
            font-size: 18px;
            color: #333;
            margin-bottom: 15px;
            font-weight: 600;
        }
        .qr-code {
            background: white;
            padding: 20px;
            border-radius: 8px;
            display: inline-block;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .qr-code img {
            display: block;
            width: 200px;
            height: 200px;
        }
        .qr-instructions {
            font-size: 14px;
            color: #666;
        }
        .download {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 14px 28px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            font-size: 16px;
            transition: background 0.2s;
        }
        .download:hover {
            background: #5568d3;
        }
        .download svg {
            width: 20px;
            height: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="8" fill="#667eea"/>
                <path d="M20 10L25 15H22V22H18V15H15L20 10Z" fill="white"/>
                <path d="M12 28C12 27.4477 12.4477 27 13 27H27C27.5523 27 28 27.4477 28 28C28 28.5523 27.5523 29 27 29H13C12.4477 29 12 28.5523 12 28Z" fill="white"/>
            </svg>
            <h2>My City Kolkata</h2>
        </div>
    </div>
    <div class="container">
        <h1>Explore ${categoryName}</h1>
        <p class="subtitle">Discover amazing places in the City of Joy</p>
        
        <div class="qr-section">
            <h3>📱 Scan to Open in App</h3>
            <div class="qr-code">
                <img src="${qrCodeUrl}" alt="QR Code" />
            </div>
            <p class="qr-instructions">
                Scan this QR code with your phone to explore ${categoryName} in the My City Kolkata app
            </p>
        </div>
        
        <a href="https://play.google.com/store/apps/details?id=com.sujoyhens.mycitykolkata" class="download">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download on Google Play</span>
        </a>
    </div>
</body>
</html>
  `;
}
