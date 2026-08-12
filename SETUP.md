# Heartline setup

The live fan page is intentionally dependency-free because Node/npm is not installed on this machine. Run it with Python:

```bash
python3 -m http.server 8899 --bind 127.0.0.1 --directory benson-boone-fan-page
```

The requested React components are preserved at `components/ui/wireframe-dotted-globe.tsx` and `components/ui/flip-gallery.tsx`.

## Converting this folder to shadcn + Tailwind + TypeScript

Install Node.js first, then from this folder run:

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install tailwindcss @tailwindcss/vite d3 lucide-react
npm install -D @types/d3
npx shadcn@latest init
```

Choose `components/ui` as the component path. This conventional location keeps shadcn components and imports such as `@/components/ui/wireframe-dotted-globe` consistent and discoverable. Add the Tailwind Vite plugin and import Tailwind from the app stylesheet, then render the component from a client React component.
