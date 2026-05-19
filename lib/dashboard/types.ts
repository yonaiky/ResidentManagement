export type DashboardActivity = {
  id: number;
  residentId: number;
  residentName: string;
  noRegistro: string;
  amount: number;
  paymentDate: string;
};

export type PendingResident = {
  id: number;
  name: string;
  cedula: string;
  noRegistro: string;
  amount: number;
  dueDate: string | null;
  status: string;
};

export type DashboardStats = {
  totalResidents: number;
  newResidentsThisMonth: number;
  residentsTrend: number;
  activeTokens: number;
  newTokensThisMonth: number;
  tokensTrend: number;
  currentMonthTotal: number;
  percentageChange: number;
  pendingPaymentsCount: number;
  pendingPaymentsTotal: number;
  pendingPercentageChange: number;
  occupancyRate: number;
  paidResidents: number;
  monthlyGoal: number;
  monthlyGoalProgress: number;
};

export type MonthlyRevenuePoint = {
  month: string;
  label: string;
  revenue: number;
  pending: number;
};

export type WeeklyActivityPoint = {
  day: string;
  label: string;
  payments: number;
  amount: number;
};

export type PaymentStatusSlice = {
  name: string;
  value: number;
  fill: string;
};

export type RecentResident = {
  id: number;
  name: string;
  lastName: string;
  noRegistro: string | null;
  paymentStatus: string;
  createdAt: string;
};

export type SparklinePoint = {
  value: number;
};

export type DashboardData = {
  stats: DashboardStats;
  activities: DashboardActivity[];
  pendingResidents: PendingResident[];
  monthlyRevenue: MonthlyRevenuePoint[];
  weeklyActivity: WeeklyActivityPoint[];
  paymentStatus: PaymentStatusSlice[];
  recentResidents: RecentResident[];
  sparklines: {
    residents: SparklinePoint[];
    tokens: SparklinePoint[];
    revenue: SparklinePoint[];
    pending: SparklinePoint[];
  };
};
