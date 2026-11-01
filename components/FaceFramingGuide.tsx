'use client';

import {useEffect, useRef, useState} from 'react';

/** Size the guide against the visible, object-fit:contain photo, not its letterbox. */
export default function FaceFramingGuide({mediaSource}: {mediaSource?: string}) {
  const overlay = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({width: 0, height: 0});

  useEffect(() => {
    const parent = overlay.current?.parentElement;
    if (!parent) return;
    const media = parent.querySelector('video, img');
    const measure = () => {
      let width = parent.clientWidth;
      let height = parent.clientHeight;
      const naturalWidth = media instanceof HTMLVideoElement ? media.videoWidth
        : media instanceof HTMLImageElement ? media.naturalWidth : 0;
      const naturalHeight = media instanceof HTMLVideoElement ? media.videoHeight
        : media instanceof HTMLImageElement ? media.naturalHeight : 0;
      if (naturalWidth && naturalHeight) {
        const scale = Math.min(width / naturalWidth, height / naturalHeight);
        width = naturalWidth * scale;
        height = naturalHeight * scale;
      }
      const ovalWidth = Math.min(width * .72, height * .78 * .73);
      setSize({width: ovalWidth, height: ovalWidth / .73});
    };
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    media?.addEventListener('loadedmetadata', measure);
    media?.addEventListener('load', measure);
    measure();
    return () => {
      observer.disconnect();
      media?.removeEventListener('loadedmetadata', measure);
      media?.removeEventListener('load', measure);
    };
  }, [mediaSource]);

  return <div ref={overlay} className={'framing-guide' + (mediaSource ? ' over-photo' : '')} aria-hidden="true">
    <div className="framing-oval" style={{width: size.width, height: size.height}} />
  </div>;
}
