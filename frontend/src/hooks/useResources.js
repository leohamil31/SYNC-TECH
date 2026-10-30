import { useMemo } from 'react';
import { useI18n } from '../i18n';
import { getResources } from '../resources';

/** Resource configs in the current language (memoized so option lists are not refetched each render). */
export function useResources() {
  const { language, t, formatDate } = useI18n();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getResources(t, formatDate), [language]);
}
