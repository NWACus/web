#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail
set -o xtrace

repo_root="$( dirname "${BASH_SOURCE[0]}" )"
tmp=$(mktemp)

git grep -nrl 'eslint-disable-next-line @typescript-eslint/consistent-type-assertions' | grep -v "$( basename "${BASH_SOURCE[0]}" )" | LC_ALL=C sort --stable > "${repo_root}/consistent-type-assertions.txt"

if [[ -n "${VALIDATE:-}" ]]; then
	set +o xtrace
	if [[ ! -z "$(git status --short)" ]]; then
		echo "##################################################################"
		echo "##                                                              ##"
		echo "##   Type assertion opt-out track is out of date. If you're     ##"
		echo "##   removing type assertings, update the tracker with:         ##"
		echo "##       pnpm update-type-assertions                            ##"
		echo "##                                                              ##"
		echo "##   If you've added new \`as\` assertions and ESLint comments    ##"
		echo "##   to disable the linter, please remove the assertions. This  ##"
		echo "##   repository is no longer allowing contributions with those  ##"
		echo "##   assertions. The tracker lets us work on removing existing  ##"
		echo "##   ones on our own schedules.                                 ##"
		echo "##                                                              ##"
		echo "##################################################################"
		git diff
		exit 1
	fi
fi

