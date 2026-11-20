import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Response } from 'express';
import { ListingsService } from './listings.service';

const escapeHtml = (value: string | number | null | undefined): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const safeHttpUrl = (
  value: string | null | undefined,
  fallback: string,
): string => {
  try {
    const url = new URL(value ?? '');
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? url.toString()
      : fallback;
  } catch {
    return fallback;
  }
};

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

@Controller('listing')
export class ShareController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get(':id')
  async getSharePreview(@Param('id') id: string, @Res() res: Response) {
    try {
      if (!ID_PATTERN.test(id)) throw new NotFoundException();
      const listing = await this.listingsService.findOne(id);
      if (!listing) throw new NotFoundException();

      const fallbackImage = 'https://example.com/og-image.png';
      const imageUrl = escapeHtml(
        safeHttpUrl(listing.images?.[0]?.mediumUrl, fallbackImage),
      );
      const rawAppLink = `barmeh://listing/${encodeURIComponent(id)}`;
      const appLink = escapeHtml(rawAppLink);
      const appLinkJs = JSON.stringify(rawAppLink);
      const nonce = randomBytes(16).toString('base64');
      const title = escapeHtml(listing.title);
      const price = escapeHtml(listing.price);
      const priceLabel = escapeHtml(Number(listing.price).toLocaleString());
      const description = escapeHtml(listing.description);
      const shortDescription = escapeHtml(
        String(listing.description ?? '').substring(0, 150),
      );
      const pageUrl = `https://example.com/listing/${escapeHtml(encodeURIComponent(id))}`;

      const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | برمة</title>
    
    <meta property="og:type" content="website">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:title" content="${title} - ${price} ل.س">
    <meta property="og:description" content="${shortDescription}...">
    <meta property="og:image" content="${imageUrl}">

    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${pageUrl}">
    <meta property="twitter:title" content="${title} - ${price} ل.س">
    <meta property="twitter:description" content="${shortDescription}...">
    <meta property="twitter:image" content="${imageUrl}">

    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Cairo', sans-serif; background: #f8fafc; color: #1e293b; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .card { background: white; width: 90%; max-width: 500px; border-radius: 30px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.1); text-align: center; }
        .img { width: 100%; height: 300px; object-fit: cover; }
        .content { padding: 30px; }
        h1 { margin: 0; font-size: 24px; color: #064e3b; }
        .price { font-size: 28px; font-weight: 900; color: #c4a052; margin: 15px 0; }
        .desc { font-size: 16px; color: #64748b; line-height: 1.6; margin-bottom: 30px; }
        .btn { display: block; background: linear-gradient(135deg, #064e3b, #0d9488); color: white; text-decoration: none; padding: 18px; border-radius: 15px; font-weight: 700; font-size: 18px; transition: 0.3s; }
        .btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(6,78,59,0.2); }
        .logo { font-weight: 900; color: #064e3b; font-size: 30px; margin-bottom: 20px; display: block; text-decoration: none; }
    </style>
</head>
<body>
    <div class="card">
        <a href="/" class="logo" style="margin-top:20px">BARMEH</a>
        <img src="${imageUrl}" class="img" alt="${title}">
        <div class="content">
            <h1>${title}</h1>
            <div class="price">${priceLabel} ل.س</div>
            <p class="desc">${description}</p>
            <a href="${appLink}" class="btn">فتح في التطبيق</a>
            <p style="margin-top:20px; font-size:12px; color:#94a3b8">إذا لم يفتح التطبيق تلقائياً، تأكد من تثبيته من المتجر</p>
        </div>
    </div>
    <script nonce="${nonce}">
        window.onload = function() {
            setTimeout(function() {
                window.location = ${appLinkJs};
            }, 500);
        };
    </script>
</body>
</html>
      `;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader(
        'Content-Security-Policy',
        `default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'nonce-${nonce}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
      );
      res.send(html);
    } catch {
      res.status(404).send('Listing not found');
    }
  }
}
