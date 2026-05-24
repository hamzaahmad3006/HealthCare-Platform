import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, CalendarDays, Banknote } from 'lucide-react';
import { SidebarLayout } from '../../../component/admin/SidebarLayout';
import { Card } from '../../../constant/Card';
import { KpiCard } from '../../../component/admin/KpiCard';
import { api, extractApiError } from '../../../helper/axios';
import { API } from '../../../constant/apiUrls';

interface MonthlyData {
  label: string;
  bookings: number;
  completed: number;
  revenue: number;
}

interface ServiceBreakdown {
  name: string;
  count: number;
}

interface AnalyticsData {
  monthlyData: MonthlyData[];
  serviceBreakdown: ServiceBreakdown[];
}

const SERVICE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Analytics(): JSX.Element {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ success: true; data: AnalyticsData }>(API.ADMIN.ANALYTICS)
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(extractApiError(err).message))
      .finally(() => setIsLoading(false));
  }, []);

  const totalRevenue = data?.monthlyData.reduce((s, m) => s + m.revenue, 0) ?? 0;
  const totalBookings = data?.monthlyData.reduce((s, m) => s + m.bookings, 0) ?? 0;
  const totalCompleted = data?.monthlyData.reduce((s, m) => s + m.completed, 0) ?? 0;
  const completionRate = totalBookings > 0 ? Math.round((totalCompleted / totalBookings) * 100) : 0;

  return (
    <SidebarLayout title="Analytics" description="Revenue and booking trends over the last 6 months">
      {error ? (
        <div className="mb-6 px-4 py-3 rounded-xl bg-danger-50 ring-1 ring-danger-500/20 text-sm text-danger-700">
          {error}
        </div>
      ) : null}

      {isLoading || !data ? (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-ink-100 animate-pulse" />)}
          </div>
          <div className="h-72 rounded-2xl bg-ink-100 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 rounded-2xl bg-ink-100 animate-pulse" />
            <div className="h-64 rounded-2xl bg-ink-100 animate-pulse" />
          </div>
        </div>
      ) : (
        <>
          {/* KPI summary */}
          <div className="grid sm:grid-cols-3 gap-4 animate-slide-up">
            <KpiCard
              label="Total revenue (6 months)"
              value={`PKR ${totalRevenue.toLocaleString()}`}
              icon={<Banknote className="h-5 w-5" />}
              tone="success"
            />
            <KpiCard
              label="Total bookings (6 months)"
              value={totalBookings}
              icon={<CalendarDays className="h-5 w-5" />}
              tone="brand"
            />
            <KpiCard
              label="Completion rate"
              value={completionRate}
              unit="%"
              icon={<TrendingUp className="h-5 w-5" />}
              tone="accent"
            />
          </div>

          {/* Revenue + bookings area chart */}
          <Card padding="lg" className="mt-6 animate-slide-up">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              <h2 className="font-semibold text-ink-900">Revenue & Bookings — last 6 months</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.monthlyData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: 13 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" name="Revenue (PKR)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="mt-6 grid lg:grid-cols-2 gap-6 animate-slide-up">
            {/* Monthly bookings bar chart */}
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-5">
                <CalendarDays className="h-4 w-4 text-brand-600" />
                <h2 className="font-semibold text-ink-900">Bookings per month</h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.monthlyData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: 13 }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="bookings" fill="#6366f1" radius={[6, 6, 0, 0]} name="Bookings" />
                  <Bar dataKey="completed" fill="#10b981" radius={[6, 6, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Service breakdown pie */}
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-5">
                <PieIcon className="h-4 w-4 text-brand-600" />
                <h2 className="font-semibold text-ink-900">Bookings by service</h2>
              </div>
              {data.serviceBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-ink-400">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.serviceBreakdown} dataKey="count" nameKey="name" cx="50%" cy="45%" outerRadius={70} paddingAngle={3}>
                      {data.serviceBreakdown.map((_, i) => (
                        <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]!} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: 12 }}
                    />
                    <Legend iconType="circle" iconSize={8} formatter={(val) => <span style={{ fontSize: 11, color: '#64748b' }}>{val}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </>
      )}
    </SidebarLayout>
  );
}
