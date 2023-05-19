import { useAuthContext } from './AuthContext';
import TeamsList from './Teams/TeamsList';

function Home() {
  const { user } = useAuthContext();

  return user ? (
    <TeamsList />
  ) : (
    <main className="container">
      <h1>Home</h1>
    </main>
  );
}

export default Home;
