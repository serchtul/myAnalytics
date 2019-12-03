interface DocCount {
  doc_count: number;
}

export interface OldAnalyticsBucket {
  key: string;
  total_applications: DocCount;
  total_an_accepted: DocCount;
  total_matched: DocCount;
  total_approvals: DocCount;
  total_realized: DocCount;
  total_finished: DocCount;
  total_completed: DocCount;
}

export interface AnalyticsDTO {
  [ey: string]: {
    [stage: string]: DocCount;
  };
}

export interface OldAnalyticsDTO {
  analytics: {
    children: {
      buckets: OldAnalyticsBucket[];
    };
  };
}
