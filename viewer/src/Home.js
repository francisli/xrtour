import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useStaticContext } from './StaticContext';

import Api from './Api';

function Home() {
  const { tour: tourData } = useStaticContext();
  const [tour, setTour] = useState(tourData);

  useEffect(() => {
    let isCancelled = false;
    if (!tour) {
      Api.getData().then((response) => {
        if (isCancelled) return;
        setTour(response.data);
      });
    }
    return () => (isCancelled = true);
  }, [tour]);

  const title = tour?.names?.[tour?.variants?.[0].code] ?? '';
  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <main className="container">
        <h1>{title}</h1>
        <p>Testing</p>
      </main>
    </>
  );
}

export default Home;
