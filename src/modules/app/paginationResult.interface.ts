export interface PaginationResult {
  /**
   * data to return
   */
  data: any[];

  /**
   * page number to return
   */
  page: number;

  /**
   * limit to return
   */
  limit: number;

  /**
   * totalCount to return
   */
  totalCount: number;
}
