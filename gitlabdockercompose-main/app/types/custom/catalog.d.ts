interface ICatalog {
  id: number;
  name: string;
  icon?: string;
  shortName: string;
  defaultTemplate: number;
  defaultApprovalPolicy: number;
  defaultLeasePeriod: number;
  permittedMaxLeaseExtensions: number;
  type: 'Standard' | 'Custom';
}
