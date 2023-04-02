interface IApprovalPolicyPolicies {
  userGroups: string;
  expiresInDays: number;
  defaultAction: string;
}

interface IApprovalPolicy {
  id: number;
  name: string;
  policies: Array<IApprovalPolicyPolicies>;
}
