import { Helmet } from 'react-helmet-async';
import { useStaticContext } from './StaticContext';

function Home() {
  const { tour } = useStaticContext();
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
