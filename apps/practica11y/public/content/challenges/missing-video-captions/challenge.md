---
id: missing-video-captions
title: 'Lost for Words'
difficulty: intermediate
tags:
  - media
  - semantics
points: 125
starter:
  html: starter.html
  css: starter.css
  vtt: starter.vtt
validators:
  - video-has-captions
links:
  - text: 'MDN: The Video element'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video'
  - text: 'MDN: The Track element'
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track'
  - text: 'MDN: WebVTT API'
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API'
  - text: 'WCAG: Captions (Prerecorded)'
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded.html'
---

In this challenge you see a video element without captions or subtitles. Deaf or hard-of-hearing users cannot access the spoken content. Users in noisy environments or who speak a different language also benefit from captions.

## Your Task

Add captions to the video so that:

- A `<track>` element provides captions for the video content
- The `kind` attribute is set to `"captions"`
- A `srclang` and `label` attribute are provided for the language
- Optionally mark the track as `default` to show captions automatically

A pre-filled `captions.vtt` file is provided in the VTT tab. You can edit it and reference it from your `<track>` element using `src="captions.vtt"`.

## Tips

- Use `<track kind="captions" src="..." srclang="en" label="English">` inside the `<video>` element
- Captions should include spoken dialogue and important sound effects
- The `src` points to a `.vtt` (WebVTT) file containing the timed text
- You can add multiple `<track>` elements for different languages
- `kind="captions"` is for deaf/hard-of-hearing; `kind="subtitles"` is for translations
- Add the `default` attribute to auto-enable a specific track
- Check out the [MDN WebVTT API documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API) for a complete example of how to add captions to a video
