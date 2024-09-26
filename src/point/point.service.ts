import { Injectable } from '@nestjs/common';
import {
  PointHistory,
  UserPoint,
  TransactionType,
} from 'src/point/point.model';
import { UserPointTable } from 'src/database/userpoint.table';
import { UserId } from 'src/user/userId.model';
import { PointValidator } from 'src/point/point.validator';
import { PointHistoryTable } from 'src/database/pointhistory.table';

@Injectable()
export class PointService {
  constructor(
    private readonly userPointTable: UserPointTable,
    private readonly pointHistoryTable: PointHistoryTable,
  ) {}

  public async search(id: number): Promise<UserPoint> {
    const userId: UserId = new UserId(id);

    const userPoint: UserPoint = await this.userPointTable.selectById(
      userId.id,
    );

    return userPoint;
  }

  public async charge(id: number, amount: number): Promise<UserPoint> {
    const userPoint: UserPoint = await this.search(id);

    PointValidator.validatePoint(amount);
    PointValidator.validatePoint(userPoint.point + amount);
    userPoint.point += amount;

    const result: UserPoint = await this.userPointTable.insertOrUpdate(
      id,
      userPoint.point,
    );

    this.addHistory(
      result.id,
      result.point,
      TransactionType.CHARGE,
      result.updateMillis,
    );

    return result;
  }

  public async use(id: number, amount: number): Promise<UserPoint> {
    const userPoint: UserPoint = await this.search(id);

    PointValidator.validatePoint(amount);
    PointValidator.validatePoint(userPoint.point - amount);
    userPoint.point -= amount;

    const result: UserPoint = await this.userPointTable.insertOrUpdate(
      id,
      userPoint.point,
    );

    this.addHistory(
      result.id,
      result.point,
      TransactionType.USE,
      result.updateMillis,
    );

    return result;
  }

  public async getHistory(id: number): Promise<PointHistory[]> {
    const userId: UserId = new UserId(id);

    return await this.pointHistoryTable.selectAllByUserId(userId.id);
  }

  private async addHistory(
    id: number,
    amount: number,
    transactionType: TransactionType,
    updateMillis: number,
  ): Promise<PointHistory> {
    return await this.pointHistoryTable.insert(
      id,
      amount,
      transactionType,
      updateMillis,
    );
  }
}
