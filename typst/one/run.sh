#!/bin/bash

set -x 
set -euo pipefail
typst compile one.typ
open one.pdf
set +x
