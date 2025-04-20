import type { MetaFunction } from '@remix-run/node';
import DashboardLayout from '~/components/layout/DashboardLayout';

export const meta: MetaFunction = () => [
  { title: 'termite - Trading Dashboard' },
];

export default function Index() {
  return <DashboardLayout />;
}
