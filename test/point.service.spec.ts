import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from 'src/point/point.service';
import { UserId } from 'src/user/userId.model';
import { UserPoint, PointHistory, TransactionType } from 'src/point/point.model';
import { UserPointTable } from 'src/database/userpoint.table';
import { PointHistoryTable } from 'src/database/pointhistory.table';
import { PointValidator } from 'src/point/point.validator';

describe('포인트서비스', () => {
  let service: PointService;

  // 가짜(Mock) 객체를 정의
  const mockUserPointTable = {
    selectById: jest.fn(),
    insertOrUpdate: jest.fn(),
  };

  const mockPointHistoryTable = {
    insert: jest.fn(),
    selectAllByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        { provide: UserPointTable, useValue: mockUserPointTable },
        { provide: PointHistoryTable, useValue: mockPointHistoryTable },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
  });

  // 유효성 검사
  // 1.유저 아이디에 대한 유효성 검사
  // -- 유저아이디는 1 이상이어야 한다
  // -- 유저아이디는 숫자이다
  // 2.포인트에 대한 유효성 검사
  // -- 포인트는 양수여야한다
  // -- 최대값이 존재한다

  describe('유저아이디', () => {
    it('유저아이디유효성검사실패', () => {
      expect(() => new UserId(0)).toThrow('id는 0보다 큰 숫자여야 합니다.');
      expect(() => new UserId(-1)).toThrow('id는 0보다 큰 숫자여야 합니다.');
    });

    it('유저아이디유효성검사성공', () => {
      expect(() => new UserId(1)).not.toThrow();
    });
  });

  describe('포인트유효성', () => {
    const userId: UserId = new UserId(1);

    it('포인트유효성검사실패', () => {
      expect(() => new UserPoint(userId, -10)).toThrow(
        '유효하지 않은 포인트 값입니다',
      );
      expect(() => new UserPoint(userId, PointValidator.MAX_POINT + 1)).toThrow(
        '유효하지 않은 포인트 값입니다',
      );
    });

    it('포인트유효성검사성공', () => {
      expect(() => new UserPoint(userId, 100)).not.toThrow();
    });
  });

  /*
  포인트 조회 기능
   */
  // 1.포인트 조회시 예외 발생
  describe('포인트 조회', () => {
    // const userPoint:UserPoint = PointService.search(userId));
    it('포인트 조회 실패', async () => {
      // 유저 아이디가 -1인 유저에 대한 포인트 조회는 예외 발생
      await expect(service.search(-1)).rejects.toThrow('id는 0보다 큰 숫자여야 합니다.');

      // 유저 아이디가 1인 유저를 서치하면 undefined가 아니다..
      await expect(service.search(1)).resolves.not.toBeNull();
    });
  });

  /*
  충전하는 기능
  1. 기존 포인트 정보를 가져와야 한다.
  2. 충전이 제대로 되는지 확인
  3. 충전 후 금액이 제대로 업데이트 되었는지 확인
  4. 충전 시, 잔고가 최대가 될 경우 충전 실패
  */

  describe('포인트 충전', () => {
    it('포인트 충전 성공', async () => {
      const mockUserPoint = { id: 1, point: 1000 };

      // 유저 조회
      jest
        .spyOn(mockUserPointTable, 'selectById')
        .mockResolvedValue(mockUserPoint);

      // 포인트 충전 결과
      jest
        .spyOn(mockUserPointTable, 'insertOrUpdate')
        .mockResolvedValue({ ...mockUserPoint, point: 1500 });

      const result = await service.charge(1, 500);

      // 충전한 결과가 올바른지
      expect(result.point).toBe(1500);
      expect(mockUserPointTable.insertOrUpdate).toHaveBeenCalledWith(1, 1500);
    });
  });

  /*
  차감하는 기능
  1. 기존 포인트 정보를 가져와야 한다.
  2. 차감이 제대로 되는지 확인
  3. 차감 후 금액이 제대로 업데이트 되었는지 확인
  4. 차감시, 잔고가 부족할 경우 실패
  */
  describe('포인트 차감', () => {
    it('포인트 차감 성공', async () => {
      const mockUserPoint = { id: 1, point: 3000 };

      // 유저 조회
      jest
        .spyOn(mockUserPointTable, 'selectById')
        .mockResolvedValue(mockUserPoint);

      // 포인트 차감 결과
      jest
        .spyOn(mockUserPointTable, 'insertOrUpdate')
        .mockResolvedValue({ ...mockUserPoint, point: 2000 });

      const result = await service.use(1, 1000);

      // 결과가 올바른지
      expect(result.point).toBe(2000);
      expect(mockUserPointTable.insertOrUpdate).toHaveBeenCalledWith(1, 2000);
    });
  });

  /*
  히스토리를 조회하는 기능
  1. 히스토리를 조회한다.
  */
  describe('히스토리 조회', () => {
    it('히스토리를 조회 성공', async () => {
      const mockHistory: PointHistory[] = [
        {
          id: 1,
          userId: 1,
          type: TransactionType.CHARGE,
          amount: 500,
          timeMillis: Date.now(),
        },
        {
          id: 2,
          userId: 1,
          type: TransactionType.USE,
          amount: 300,
          timeMillis: Date.now(),
        },
      ];

      jest.spyOn(
        mockPointHistoryTable,
        'selectAllByUserId',
      ).mockResolvedValue(mockHistory);

      const result = await service.getHistory(1);

      expect(result).toEqual(mockHistory);

      expect(mockPointHistoryTable.selectAllByUserId).toHaveBeenCalledWith(1);
    });
  });
});
