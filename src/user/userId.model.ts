export class UserId {
  public id: number;

  constructor(id) {
    if (id <= 0) {
      throw new Error('id는 0보다 큰 숫자여야 합니다.');
    }

    this.id = id;
  }
}
