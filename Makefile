.PHONY: test all release debug clean

all: release debug
release: dist/minifloat.js dist/minifloat.d.ts
debug: dist/minifloat.debug.js

clean:
	rm -rf dist
	npm prune

dist/wasm.js dist/wasm.d.ts: extract-types.js src/minifloat.asm.ts
	mkdir -p dist
	node $<

dist/release.wasm dist/release.wasm.map dist/release.wat dist/release.js: src/minifloat.asm.ts
	npx asc $< --target release

dist/debug.wasm dist/debug.wasm.map dist/debug.wat dist/debug.js: src/minifloat.asm.ts
	npx asc $< --target debug

dist/minifloat.d.ts: src/minifloat.ts
	mkdir -p dist
	npx tsc --outDir dist --emitDeclarationOnly --declaration $<

dist/minifloat.js: src/minifloat.ts dist/release.wasm dist/wasm.js dist/wasm.d.ts
	npx esbuild src/minifloat.ts --alias:minifloat.wasm=./dist/release.wasm \
	        --minify --bundle --loader:.wasm=binary --format=esm > $@

dist/minifloat.debug.js: src/minifloat.ts dist/debug.inlined.wasm dist/wasm.js dist/wasm.d.ts
	npx esbuild src/minifloat.ts --alias:minifloat.wasm=./dist/debug.inlined.wasm \
	        --sourcemap=inline --bundle --loader:.wasm=binary --format=esm > $@

dist/debug.inlined.wasm: inline-map.js dist/debug.wasm dist/debug.wasm.map
	node $<

test: tests/minifloat.test.ts dist/minifloat.js dist/minifloat.d.ts
	deno test tests/
