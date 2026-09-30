# Chainz 2.0 (Treesh Games)

This is a word-chaining game for Treesh.

The files that go live are in **`treesh-site/`**. See `treesh-site/README.md` for the exact steps to publish at https://treesh.app/games/chainz.

- `treesh-site/games/chainz.html` is the game, as one self-contained file.
- `treesh-site/index.html` is Treesh, patched for live Starlite, profile and accent sync.
- `frontend/` holds the React source. Rebuild with `bash treesh-site/build.sh`.
- `tools/` holds the word bank generator, the single-file packer and the Treesh patcher.
