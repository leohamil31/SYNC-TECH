import { useState } from 'react';
import { thumbnailUrl } from '../../../shared/lib/youtube';
import Icon from '../../../design-system/Icon';

/** 16:9 YouTube thumbnail with a graceful fallback when there is no video or the image fails. */
export default function VideoThumb({ videoUrl, alt = '', children, className = '' }) {
  const [failed, setFailed] = useState(false);
  const src = thumbnailUrl(videoUrl);
  return (
    <div className={`thumb ${className}`}>
      {src && !failed ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span className="thumb-fallback" aria-hidden="true">
          <Icon name="video" size={28} />
        </span>
      )}
      {children}
    </div>
  );
}
