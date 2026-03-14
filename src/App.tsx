import { useCallback, useState } from 'react';
import Layout from './components/Layout';
import Map from './components/Map';
import type { NewsItem, UserInterest } from './types';

export default function App() {
  const [news] = useState<NewsItem[]>([]);
  const [interests] = useState<UserInterest[]>([]);
  const handleBoundsChange = useCallback(() => {}, []);
  const handleMarkerClick = useCallback(() => {}, []);

  return (
    <Layout>
      <div className="h-full w-full">
        <Map
          news={news}
          interests={interests}
          onBoundsChange={handleBoundsChange}
          onMarkerClick={handleMarkerClick}
          showHeatmap={false}
          showSentiment={false}
        />
      </div>
    </Layout>
  );
}
