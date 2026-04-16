# App Icon Generation

Generate from the Parbaughs logo (watermark.jpg):

1. Create a 1024x1024 PNG:
   - Background: #0e1118 (Classic theme dark)
   - Logo centered at ~70% of canvas size
   - Subtle gold gradient ring or glow around logo
   - NO text, NO rounded corners (stores add their own)

2. Generate all sizes using a tool like https://maskable.app/editor
   or https://realfavicongenerator.net:

   iOS sizes: 20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024
   Android sizes: 48, 72, 96, 144, 192, 512
   PWA: 48, 72, 96, 144, 192, 512 (same as Android)

3. Save all as PNG in this directory:
   icon-48.png, icon-72.png, icon-96.png, icon-144.png,
   icon-192.png, icon-512.png, icon-1024.png

4. Update manifest.json to reference these files.

For now, watermark.jpg is used as a placeholder at all sizes.
