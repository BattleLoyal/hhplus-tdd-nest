import { UserId } from 'src/user/userId.model';
import { PointValidator } from './point.validator';

export class UserPoint {
  id: number;
  point: number;
  updateMillis: number;

  constructor(userId: UserId, point: number) {
    PointValidator.validatePoint(point);
    this.id = userId.id;
    this.point = point;
  }
}

/**
 * 포인트 트랜잭션 종류
 * - CHARGE : 충전
 * - USE : 사용
 */
export enum TransactionType {
  CHARGE,
  USE,
}

export type PointHistory = {
  id: number;
  userId: number;
  type: TransactionType;
  amount: number;
  timeMillis: number;
};
