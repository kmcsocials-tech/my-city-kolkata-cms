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

      // App deep link scheme
      const appScheme = `mycitykolkata://place/${id}`;

      // If desktop, show preview page (no QR code needed as per request)
      if (!isMobile) {
        return ctx.send(generatePreviewPage(title, description));
      }

      // For mobile devices: Auto-redirect + Fallback
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.sujoyhens.mycitykolkata';
      const appStoreUrl = 'https://apps.apple.com/app/YOUR_APP_ID'; 

      const redirectHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | My City Kolkata</title>
    
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description?.substring(0, 200)}">
    <meta property="og:image" content="${ctx.request.origin}/logo.png">
    
    <style>
        :root {
            --primary: #0e0e79;
            --bg: #f8f9fa;
            --text: #1a1a1a;
        }
        body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: var(--bg);
            color: var(--text);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .card {
            background: white;
            padding: 40px 30px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(14, 14, 121, 0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
            border-top: 5px solid var(--primary);
        }
        .logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            margin-bottom: 25px;
        }
        h1 {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 10px;
            color: var(--primary);
        }
        p {
            font-size: 15px;
            color: #666;
            line-height: 1.5;
            margin: 0 0 30px;
        }
        .loader {
            width: 40px;
            height: 40px;
            border: 3px solid #e1e4e8;
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 30px;
        }
        .btn {
            display: block;
            background: var(--primary);
            color: white;
            text-decoration: none;
            padding: 14px 20px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(14, 14, 121, 0.2);
        }
        .secondary-btn {
            display: block;
            margin-top: 15px;
            color: var(--primary);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <img src="/logo.png" alt="My City Kolkata" class="logo">
        <h1>Opening App...</h1>
        <p>Taking you to <strong>${title}</strong></p>
        
        <div class="loader"></div>
        
        <a href="${appScheme}" class="btn">Open in App</a>
        <a href="${isAndroid ? playStoreUrl : appStoreUrl}" class="secondary-btn">Download App</a>
    </div>

    <script>
        // Attempt auto-redirect
        window.location.href = "${appScheme}";
        
        // Fallback to store if not opened
        setTimeout(function() {
             // Optional: Check if page is still visible (basic heuristic)
            if (!document.hidden) {
                // window.location.href = "${isAndroid ? playStoreUrl : appStoreUrl}";
            }
        }, 2500);
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

    // App deep link scheme
    const appScheme = `mycitykolkata://category/${encodeURIComponent(name)}`;

    // For desktop
    if (!isMobile) {
      return ctx.send(generateCategoryPreviewPage(name));
    }

    // For mobile
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.sujoyhens.mycitykolkata';
    const appStoreUrl = 'https://apps.apple.com/app/YOUR_APP_ID';

    const redirectHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Category: ${name}</title>
    <style>
        :root {
            --primary: #0e0e79;
            --bg: #f8f9fa;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: var(--bg);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .card {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.05);
            text-align: center;
            max-width: 380px;
            width: 100%;
        }
        .logo { width: 70px; margin-bottom: 20px; }
        h1 { color: var(--primary); margin: 0 0 10px; font-size: 20px; }
        p { color: #666; margin-bottom: 30px; font-size: 15px; }
        .btn {
            display: block;
            background: var(--primary);
            color: white;
            text-decoration: none;
            padding: 12px;
            border-radius: 10px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .loader {
            width: 30px; height: 30px;
            border: 3px solid #eee; border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s infinite linear;
            margin: 0 auto 20px;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <img src="/logo.png" class="logo" alt="Logo">
        <div class="loader"></div>
        <h1>Opening ${name}</h1>
        <p>Redirecting you to the app...</p>
        <a href="${appScheme}" class="btn">Open App</a>
        <a href="${isAndroid ? playStoreUrl : appStoreUrl}" style="color: #666; text-decoration: none; font-size: 13px;">Download App</a>
    </div>
    <script>
        window.location.href = "${appScheme}";
        setTimeout(() => { 
            // Fallback logic
        }, 2000);
    </script>
</body>
</html>
    `;

    ctx.type = 'text/html';
    return ctx.send(redirectHtml);
  },
};

/**
 * Generate preview page for desktop users (No QR Code)
 */
function generatePreviewPage(title, description) {
  const shortDescription = description.length > 300 ? description.substring(0, 300) + '...' : description;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | My City Kolkata</title>
    <style>
        :root {
            --primary: #0e0e79;
            --bg: #f8f9fa;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg);
            margin: 0;
            padding: 0;
            color: #333;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .navbar {
            background: white;
            padding: 15px 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .nav-logo {
            height: 40px;
            margin-right: 15px;
        }
        .nav-title {
            font-size: 20px;
            font-weight: 700;
            color: var(--primary);
        }
        .main-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
        }
        .content-card {
            background: white;
            max-width: 700px;
            width: 100%;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
            display: flex;
            flex-direction: column;
            text-align: center;
        }
        .hero-section {
            padding: 40px;
            background: linear-gradient(to bottom, #fff, #f8f9fa);
        }
        .hero-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 32px;
            color: var(--primary);
            margin: 0 0 15px;
            line-height: 1.3;
        }
        .description {
            font-size: 18px;
            color: #555;
            line-height: 1.6;
            margin: 0 auto 30px;
            max-width: 500px;
        }
        .actions {
            background: var(--primary);
            padding: 40px;
            color: white;
        }
        .cta-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 25px;
            color: rgba(255,255,255,0.95);
        }
        .download-btn {
            display: inline-flex;
            align-items: center;
            background: white;
            color: var(--primary);
            padding: 15px 30px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 700;
            font-size: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .download-btn svg {
            width: 24px;
            height: 24px;
            margin-right: 10px;
        }
        footer {
            text-align: center;
            padding: 20px;
            color: #888;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="navbar">
        <img src="/logo.png" alt="Logo" class="nav-logo">
        <span class="nav-title">My City Kolkata</span>
    </div>

    <div class="main-container">
        <div class="content-card">
            <div class="hero-section">
                <img src="/logo.png" alt="My City Kolkata" class="hero-logo">
                <h1>${title}</h1>
                <div class="description">${shortDescription}</div>
            </div>
            
            <div class="actions">
                <div class="cta-title">Experience the City of Joy</div>
                <a href="https://play.google.com/store/apps/details?id=com.sujoyhens.mycitykolkata" class="download-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                    Download App
                </a>
            </div>
        </div>
    </div>
    
    <footer>
        &copy; ${new Date().getFullYear()} My City Kolkata. All rights reserved.
    </footer>
</body>
</html>
  `;
}

/**
 * Generate preview page for category (No QR Code)
 */
function generateCategoryPreviewPage(categoryName) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${categoryName} | My City Kolkata</title>
    <style>
        :root {
            --primary: #0e0e79;
            --bg: #f8f9fa;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--bg);
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .card {
            background: white;
            padding: 50px 40px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 100%;
        }
        .logo { width: 80px; height: 80px; margin-bottom: 20px; object-fit: contain; }
        h1 { color: var(--primary); font-size: 30px; margin-bottom: 10px; }
        p { color: #555; font-size: 18px; margin-bottom: 40px; }
        .btn {
            display: inline-block;
            background: var(--primary);
            color: white;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 30px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 5px 15px rgba(14, 14, 121, 0.3);
            transition: transform 0.2s;
        }
        .btn:hover { transform: scale(1.05); }
    </style>
</head>
<body>
    <div class="card">
        <img src="/logo.png" alt="My City Kolkata" class="logo">
        <h1>Explore ${categoryName}</h1>
        <p>Discover the best of Kolkata with our mobile app.</p>
        <a href="https://play.google.com/store/apps/details?id=com.sujoyhens.mycitykolkata" class="btn">
            Download App
        </a>
    </div>
</body>
</html>
  `;
}
