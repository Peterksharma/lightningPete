# Performance Website Builder

A build-time JSON injection system for creating 95+ performance score websites using vanilla JS/CSS.

## 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Build your site:**
```bash
npm run build
```

3. **Serve locally:**
```bash
npm run serve
```

4. **Or run both:**
```bash
npm run dev
```

## 📁 Project Structure

```
performance-builder/
├── package.json
├── build.js                    // Main build script
├── src/
│   ├── templates/
│   │   ├── base.html          // Main layout template
│   │   └── components/
│   │       ├── hero.html      // Hero section template
│   │       ├── content.html   // Content grid template
│   │       └── gallery.html   // Gallery template
│   ├── styles/
│   │   ├── critical.css       // Critical path CSS
│   │   └── components.css     // Component-specific styles
│   └── scripts/
│       └── app.js             // Main application logic
├── data/
│   ├── site-config.json       // Global site configuration
│   └── pages/
│       ├── home.json          // Homepage content
│       └── about.json         // About page content
└── dist/                      // Build output directory
    ├── index.html             // Built homepage
    └── about.html             // Built about page
```

## 🎯 How It Works

1. **Build Process**: `node build.js` reads JSON data and templates, injects content, and outputs optimized HTML files
2. **Template System**: Modular components in `src/templates/components/` can be combined based on page configuration
3. **Performance**: All CSS and JS is inlined, eliminating additional HTTP requests
4. **Scalability**: Add new templates by creating new component files and updating JSON data

## 🧩 Adding New Components

1. Create a new component template in `src/templates/components/`
2. Add corresponding styles in `src/styles/components.css`
3. Update your page JSON to include the component in the `components` array
4. Add component data to your page JSON

## 📝 Customizing Content

Edit the JSON files in `data/pages/` to customize your content:

- **Page-level**: Title, description, component list
- **Component-level**: Text, links, images for each section
- **Global**: Site-wide settings in `data/site-config.json`

## 🎨 Styling

- **Critical CSS**: Essential styles loaded immediately in `src/styles/critical.css`
- **Component CSS**: Component-specific styles in `src/styles/components.css`
- **Responsive**: Mobile-first design with CSS Grid and Flexbox
- **Performance**: Optimized animations and transitions

## ⚡ Performance Features

- **Inline CSS/JS**: No additional HTTP requests
- **Critical Path**: Essential styles loaded first
- **Minification**: HTML minification for smaller file sizes
- **Mobile Optimized**: Touch-friendly interactions and responsive design
- **Performance Monitoring**: Built-in performance metrics logging

## 🔧 Configuration

### Site Configuration (`data/site-config.json`)
```json
{
  "language": "en",
  "siteName": "Performance Builder",
  "author": "Your Name",
  "baseUrl": "https://yoursite.com"
}
```

### Page Configuration (`data/pages/*.json`)
```json
{
  "page": {
    "title": "Page Title",
    "description": "Page description",
    "components": ["hero", "content"]
  },
  "hero": {
    "title": "Hero Title",
    "subtitle": "Hero subtitle"
  }
}
```

## 🚀 Next Steps

- Add image optimization with Sharp
- Implement template loops for dynamic content
- Add service worker for caching
- Create template validation
- Add CSS/JS minification options
- Implement asset optimization
- Add build-time analytics

## 📊 Performance Targets

- **Lighthouse Score**: 95+
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run build`
5. Submit a pull request

## 📄 License

MIT License - feel free to use this system for your projects!

---

Built with ❤️ for performance-first web development.
