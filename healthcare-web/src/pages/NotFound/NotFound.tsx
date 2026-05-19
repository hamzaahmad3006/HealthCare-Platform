import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { Button } from '../../constant/Button';

export function NotFound(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center px-6">
      <div className="text-center max-w-md animate-fade-in">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-brand text-white flex items-center justify-center shadow-brand">
          <Heart className="h-7 w-7" fill="currentColor" />
        </div>
        <p className="mt-8 text-7xl font-bold text-ink-200 tracking-tight">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900">Page not found</h1>
        <p className="mt-2 text-ink-600">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
        </p>
        <Link to="/" className="inline-block mt-6">
          <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
