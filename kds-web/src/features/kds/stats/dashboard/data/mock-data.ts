// KDS 매장 통계 대시보드 모의 데이터

export interface KpiData {
  label: string;
  value: string | number;
  unit?: string;
  change: number; // 전일 대비 변화율 (%)
  changeLabel: string;
}

export interface HourlyOrder {
  hour: string;
  today: number;
  yesterday: number;
}

export interface KitchenStatusItem {
  status: string;
  count: number;
  color: string;
}

export interface MenuItem {
  rank: number;
  name: string;
  quantity: number;
  revenue: number;
  change: number; // 전일 대비 변화율
}

export interface InsightItem {
  type: 'info' | 'warning' | 'success';
  message: string;
}

// KPI 데이터
export const kpiData: KpiData[] = [
  {
    label: '주문 수',
    value: 187,
    unit: '건',
    change: 12.5,
    changeLabel: '전일 대비',
  },
  {
    label: '매출',
    value: '2,847,000',
    unit: '원',
    change: 8.3,
    changeLabel: '전일 대비',
  },
  {
    label: '완료율',
    value: 94.2,
    unit: '%',
    change: 2.1,
    changeLabel: '전일 대비',
  },
  {
    label: '평균 완료 시간',
    value: '8분 42초',
    change: -5.2,
    changeLabel: '전일 대비',
  },
  {
    label: '지연 주문',
    value: 7,
    unit: '건',
    change: -15.0,
    changeLabel: '전일 대비',
  },
  {
    label: '피크 시간',
    value: '12:00~13:00',
    change: 0,
    changeLabel: '동일',
  },
];

// 시간대별 주문 흐름
export const hourlyOrders: HourlyOrder[] = [
  { hour: '10시', today: 5, yesterday: 4 },
  { hour: '11시', today: 18, yesterday: 15 },
  { hour: '12시', today: 42, yesterday: 38 },
  { hour: '13시', today: 35, yesterday: 32 },
  { hour: '14시', today: 12, yesterday: 14 },
  { hour: '15시', today: 8, yesterday: 9 },
  { hour: '16시', today: 6, yesterday: 7 },
  { hour: '17시', today: 14, yesterday: 11 },
  { hour: '18시', today: 28, yesterday: 25 },
  { hour: '19시', today: 32, yesterday: 30 },
  { hour: '20시', today: 22, yesterday: 20 },
  { hour: '21시', today: 15, yesterday: 12 },
];

// 3일 평균 주문 데이터
export const hourlyOrders3DayAvg: number[] = [4, 14, 39, 33, 13, 9, 7, 12, 26, 29, 21, 13];

// 7일 평균 주문 데이터
export const hourlyOrders7DayAvg: number[] = [5, 13, 36, 31, 12, 8, 6, 11, 24, 28, 19, 12];

// 주방 처리 상태
export const kitchenStatus: KitchenStatusItem[] = [
  { status: '완료', count: 176, color: 'hsl(142, 71%, 45%)' },
  { status: '진행중', count: 4, color: 'hsl(217, 91%, 60%)' },
  { status: '지연', count: 4, color: 'hsl(0, 84%, 60%)' },
  { status: '취소', count: 3, color: 'hsl(45, 93%, 47%)' },
];

// 메뉴별 판매 성과
export const menuPerformance: MenuItem[] = [
  { rank: 1, name: '김치찌개', quantity: 42, revenue: 378000, change: 15.2 },
  { rank: 2, name: '된장찌개', quantity: 35, revenue: 315000, change: 8.7 },
  { rank: 3, name: '제육볶음', quantity: 28, revenue: 308000, change: -3.1 },
  { rank: 4, name: '비빔밥', quantity: 25, revenue: 225000, change: 22.0 },
  { rank: 5, name: '돈까스', quantity: 22, revenue: 264000, change: 5.5 },
  { rank: 6, name: '냉면', quantity: 18, revenue: 162000, change: 45.0 },
  { rank: 7, name: '불고기', quantity: 15, revenue: 195000, change: -8.2 },
];

// 운영 인사이트
export const insights: InsightItem[] = [
  {
    type: 'success',
    message: '오늘 완료율 94.2%로 이번 주 최고 기록입니다.',
  },
  {
    type: 'info',
    message: '피크 시간(12~13시) 주문이 전일 대비 15% 증가했습니다. 인력 배치를 확인해보세요.',
  },
  {
    type: 'warning',
    message: '냉면 주문이 45% 급증했습니다. 재료 재고를 확인해보세요.',
  },
  {
    type: 'info',
    message: '평균 완료 시간이 5.2% 단축되었습니다. 주방 효율이 개선되고 있습니다.',
  },
];

// 주방 처리 시간 분포
export const processingTimeData = [
  { range: '5분 이하', count: 85, percentage: 45.5 },
  { range: '5~10분', count: 62, percentage: 33.2 },
  { range: '10~15분', count: 28, percentage: 15.0 },
  { range: '15분 초과', count: 12, percentage: 6.3 },
];

// 배달 플랫폼별 통계
export interface PlatformData {
  name: string;
  orders: number;
  revenue: number;
  change: number; // 전일 대비 변화율
  color: string;
}

export const platformData: PlatformData[] = [
  { name: '배달의민족', orders: 68, revenue: 1_088_000, change: 14.2, color: '#2AC1BC' },
  { name: '쿠팡이츠', orders: 45, revenue: 720_000, change: 8.5, color: '#3B82F6' },
  { name: '요기요', orders: 32, revenue: 480_000, change: -4.3, color: '#FF0000' },
  { name: '전화 주문', orders: 18, revenue: 252_000, change: -12.0, color: '#64748B' },
  { name: '매장 주문', orders: 24, revenue: 307_000, change: 22.5, color: '#F59E0B' },
];
