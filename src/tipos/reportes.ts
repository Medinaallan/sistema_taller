export interface FinancialStats {
  totalSales: number;
  taxableAmount: number;
  isv: number;
  totalWithTax: number;
  cashPayments: number;
  cardPayments: number;
  transferPayments: number;
  pendingPayments: number;
}

export interface ServiceStats {
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  pendingOrders: number;
  rejectedOrders: number;
}

export interface SatisfactionStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  mechanicRatings: {
    mechanicId: string;
    mechanicName: string;
    averageRating: number;
    totalRatings: number;
  }[];
}

export interface OrderRating {
  orderId: string;
  mechanicId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  mechanicId?: string;
  serviceTypeId?: string;
  clientId?: string;
  status?: 'completed' | 'in-progress' | 'pending' | 'rejected';
}
