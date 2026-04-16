export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserDto;
}

export interface ProductDto {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  dosage: string;
  packaging: string;
  requiresPrescription: boolean;
  quantity: number;
}

export interface CartItemDto {
  productId: number;
  quantity: number;
  productName: string;
  category: string;
  requiresPrescription: boolean;
}

export interface CartDto {
  userId: number;
  items: CartItemDto[];
}

export const PRESCRIPTION_STATUS_LABELS = ['Pending', 'Approved', 'Rejected'] as const;
export type PrescriptionStatusLabel = (typeof PRESCRIPTION_STATUS_LABELS)[number];

export interface PrescriptionDto {
  id: number;
  userId: number;
  fileUrl: string;
  status: number;
  reviewedBy?: number | null;
  createdAt: string;
}

export interface PrescriptionViewModel extends Omit<PrescriptionDto, 'status'> {
  status: PrescriptionStatusLabel;
}

export const ORDER_STATUS_LABELS = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered', 'Cancelled'] as const;
export type OrderStatusLabel = (typeof ORDER_STATUS_LABELS)[number];

export interface OrderItemDto {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
}

export interface OrderStatusHistoryDto {
  id: number;
  orderId: number;
  status: number;
  changedAt: string;
}

export interface OrderDto {
  id: number;
  userId: number;
  prescriptionId?: number | null;
  totalAmount: number;
  status: number;
  createdAt: string;
  orderItems: OrderItemDto[];
  statusHistory: OrderStatusHistoryDto[];
}

export interface OrderViewModel extends Omit<OrderDto, 'status' | 'statusHistory'> {
  status: OrderStatusLabel;
  statusHistory: Array<Omit<OrderStatusHistoryDto, 'status'> & { status: OrderStatusLabel }>;
}

export function toPrescriptionStatusLabel(status: number): PrescriptionStatusLabel {
  return PRESCRIPTION_STATUS_LABELS[status] ?? 'Pending';
}

export function toOrderStatusLabel(status: number): OrderStatusLabel {
  return ORDER_STATUS_LABELS[status] ?? 'Placed';
}

export function toPrescriptionReviewStatus(status: Extract<PrescriptionStatusLabel, 'Approved' | 'Rejected'>): number {
  return status === 'Approved' ? 1 : 2;
}

export function toOrderStatusValue(status: Exclude<OrderStatusLabel, 'Placed'>): number {
  return ORDER_STATUS_LABELS.indexOf(status);
}

export function mapPrescriptionToViewModel(item: PrescriptionDto): PrescriptionViewModel {
  return {
    ...item,
    status: toPrescriptionStatusLabel(item.status)
  };
}

export function mapOrderToViewModel(order: OrderDto): OrderViewModel {
  return {
    ...order,
    status: toOrderStatusLabel(order.status),
    statusHistory: (order.statusHistory ?? []).map((history) => ({
      ...history,
      status: toOrderStatusLabel(history.status)
    }))
  };
}
