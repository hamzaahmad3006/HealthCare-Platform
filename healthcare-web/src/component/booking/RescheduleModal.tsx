import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Card } from '../../constant/Card';
import { Button } from '../../constant/Button';
import { futureLocalTimeToIso, localDateTimeValue } from '../../helper/reschedule';

export function RescheduleModal({ isLoading, onSubmit, onClose }: {
  isLoading: boolean;
  onSubmit: (isoDate: string) => Promise<boolean>;
  onClose: () => void;
}): JSX.Element {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-950/40 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="reschedule-title">
      <Card variant="elevated" padding="lg" className="max-w-md w-full animate-scale-in">
        <h3 id="reschedule-title" className="text-lg font-bold text-ink-900">Reschedule booking</h3>
        <p className="text-sm text-ink-500 mt-1">Choose a future date and time in your local time zone. The new schedule will need admin confirmation and staff assignment.</p>
        <form onSubmit={async e => {
          e.preventDefault();
          setError('');
          let isoDate: string;
          try { isoDate = futureLocalTimeToIso(value); }
          catch (err) { setError((err as Error).message); return; }
          if (await onSubmit(isoDate)) onClose();
        }}>
          <label htmlFor="reschedule-date" className="block mt-4 text-sm">New start date and time</label>
          <input id="reschedule-date" type="datetime-local" required value={value}
            onChange={e => { setValue(e.target.value); setError(''); }}
            min={localDateTimeValue(new Date(Date.now() + 60000))}
            disabled={isLoading}
            className="mt-1 w-full px-4 py-3 text-sm rounded-xl border border-ink-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none" />
          {error ? <p role="alert" className="mt-2 text-sm text-danger-700">{error}</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" isLoading={isLoading} disabled={!value || isLoading} leftIcon={<CalendarClock className="h-4 w-4" />}>Confirm reschedule</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
