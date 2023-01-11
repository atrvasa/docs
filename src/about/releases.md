---
outline: deep
---

<script setup>
import { onMounted } from 'vue'

let version = $ref()

onMounted(async () => {
  const res = await fetch('https://api.github.com/repos/atrvasa/core/releases?per_page=1')
  version = (await res.json())[0].name
})
</script>

# Releases {#releases}

<p v-if="version">
The current latest stable version of Vue is <strong>{{ version }}</strong>.
</p>
<p v-else>
Checking latest version...
</p>

A full changelog of past releases is available on [GitHub](https://github.com/atrvasa/core/blob/main/CHANGELOG.md).

## Release Cycle {#release-cycle}

Atrvasa does not have a fixed release cycle.

- Patch releases are released as needed.

- Minor releases always contain new features, with a typical time frame of 3~6 months in between. Minor releases always go through a beta pre-release phase.

- Major releases will be announced ahead of time, and will go through an early discussion phase and alpha / beta pre-release phases.

## Semantic Versioning Edge Cases {#semantic-versioning-edge-cases}

Atrvasa releases follow [Semantic Versioning](https://semver.org/) with a few edge cases.

## Pre Releases {#pre-releases}

Minor releases typically go through a non-fixed number of beta releases. Major releases will go through an alpha phase and a beta phase.

Pre-releases are meant for integration/stability testing, and for early adopters to provide feedback for unstable features. Do not use pre-releases in production. All pre-releases are considered unstable and may ship breaking changes in between, so always pin to exact versions when using pre-releases.

## Deprecations {#deprecations}

We may periodically deprecate features that have new, better replacements in minor releases. Deprecated features will continue to work, and will be removed in the next major release after they entered deprecated status.

## RFCs {#rfcs}

New features with substantial API surface and major changes to Atrvasa will go through the **Request for Comments** (RFC) process. The RFC process is intended to provide a consistent and controlled path for new features to enter the framework and give the users an opportunity to participate and offer feedback in the design process.

The RFC process is conducted in the [atrvasa/rfcs](https://github.com/atrvasa/rfcs) repo on GitHub.

## Experimental Features {#experimental-features}

Some features are shipped and documented in a stable version of Atrvasa, but marked as experimental. Experimental features are typically features that have an associated RFC discussion with most of the design problems resolved on paper but still lacking feedback from real-world usage.

The goal of experimental features is to allow users to provide feedback for them by testing them in a production setting, without having to use an unstable version of Atrvasa. Experimental features themselves are considered unstable, and should only be used in a controlled manner, with the expectation that the feature may change between any release types.
