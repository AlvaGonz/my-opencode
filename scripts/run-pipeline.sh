#!/bin/bash
node scripts/session-init.mjs
node scripts/registry.mjs
python scripts/post_task_loop.py --task "$1" --output "$2" --hook-mode "${3:-ci}"
node scripts/registry.mjs
