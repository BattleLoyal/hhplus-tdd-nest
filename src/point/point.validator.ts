export class PointValidator {
  static readonly MAX_POINT: number = 10000;

  public static validatePoint(point: number) {
    if (point < 0 || PointValidator.MAX_POINT < point) {
      throw new Error('유효하지 않은 포인트 값입니다.');
    }
  }
}
