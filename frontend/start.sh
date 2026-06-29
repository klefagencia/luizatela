#!/bin/sh
npx serve -s build --listen tcp://0.0.0.0:${PORT:-3000}
