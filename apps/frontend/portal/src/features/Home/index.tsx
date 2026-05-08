import { Hero } from './components/Hero';
import { LatestRescue } from './components/LatestRescue';

export const Home = () => {
  return (
    <div className="flex flex-col">
      <Hero />
      <LatestRescue />
    </div>
  );
};
