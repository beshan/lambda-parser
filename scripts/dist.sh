npx esbuild ./src/index.ts --bundle --platform=node --target=es2015 --format=cjs --outdir=dist
npx esbuild ./src/generator/index.ts --bundle --platform=node --target=es2015 --format=cjs --outdir=dist/generator --external:../
npx esbuild ./src/bin/index.ts --bundle --platform=node --target=esnext --format=cjs --outdir=dist/bin --external:../generator --packages=external

npx esbuild ./src/index.ts --bundle --platform=neutral --target=es2015 --format=esm --outfile=dist/index.mjs
