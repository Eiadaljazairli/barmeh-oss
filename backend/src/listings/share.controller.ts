import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { Response } from 'express';

@Controller('listing')
export class ShareController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get(':id')
  async getSharePreview(
    @Param('id') id: string,
    @Res() res: import('express').Response,
  ) {
    try {
      const listing = await this.listingsService.findOne(id);
      if (!listing) throw new NotFoundException();

      const imageUrl =
        listing.images?.[0]?.mediumUrl || 'https://example.com/og-image.png';
      const appLink = `barmeh://listing/${id}`;

      const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${listing.title} | برمة</title>
    
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://example.com/listing/${id}">
    <meta property="og:title" content="${listing.title} - ${listing.price} ل.س">
    <meta property="og:description" content="${listing.description.substring(0, 150)}...">
    <meta property="og:image" content="${imageUrl}">

    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://example.com/listing/${id}">
    <meta property="twitter:title" content="${listing.title} - ${listing.price} ل.س">
    <meta property="twitter:description" content="${listing.description.substring(0, 150)}...">
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
        <img src="${imageUrl}" class="img" alt="${listing.title}">
        <div class="content">
            <h1>${listing.title}</h1>
            <div class="price">${listing.price.toLocaleString()} ل.س</div>
            <p class="desc">${listing.description}</p>
            <a href="${appLink}" class="btn">فتح في التطبيق</a>
            <p style="margin-top:20px; font-size:12px; color:#94a3b8">إذا لم يفتح التطبيق تلقائياً، تأكد من تثبيته من المتجر</p>
        </div>
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.location = "${appLink}";
            }, 500);
        };
    </script>
</body>
</html>
      `;
      res.send(html);
    } catch {
      res.status(404).send('Listing not found');
    }
  }
}
